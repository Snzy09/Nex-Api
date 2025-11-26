import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { load } from 'cheerio'

export class Kurama {
  u: string
  targetEnv: string
  is: AxiosInstance
  userAgents: string[]

  constructor() {
    this.u = 'https://v8.kuramanime.tel'
    this.targetEnv = 'data-kk'

    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
    ]

    const defaultHeaders = {
      'User-Agent': this.userAgents[0],
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      Connection: 'keep-alive',
      Origin: this.u,
      Referer: this.u,
    }

    const axiosOpts: AxiosRequestConfig = {
      baseURL: this.u,
      headers: defaultHeaders,
      timeout: 15_000,
    }

    // Optional simple proxy support via env var SCRAPE_PROXY (host:port or http(s)://host:port)
    const proxyRaw = process.env.SCRAPE_PROXY || process.env.KURAMA_PROXY
    if (proxyRaw) {
      try {
        // support http://host:port or host:port
        const normalized = proxyRaw.replace(/^https?:\/\//, '')
        const [hostPart, portPart] = normalized.split(':')
        const port = portPart ? parseInt(portPart, 10) : undefined
        if (hostPart && port) {
          ;(axiosOpts as any).proxy = { host: hostPart, port }
        }
      } catch (err) {
        // ignore proxy parse errors; continue without proxy
      }
    }

    this.is = axios.create(axiosOpts)
  }

  private sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms))
  }

  private async requestWithRetry(method: 'get' | 'post', url: string, config?: AxiosRequestConfig, maxRetries = 3) {
    let attempt = 0
    const baseDelay = 300
    while (attempt < maxRetries) {
      attempt++
      try {
        // rotate user-agent per attempt
        const ua = this.userAgents[Math.floor(Math.random() * this.userAgents.length)]
        const finalConfig: AxiosRequestConfig = { ...(config || {}), headers: { ...(config?.headers || {}), 'User-Agent': ua } }
        const res = await this.is.request({ url, method, ...finalConfig })
        return res
      } catch (err: any) {
        const status = err?.response?.status
        const body = err?.response?.data
        // If 403 or 429, wait and retry with backoff; otherwise rethrow
        if (status === 403 || status === 429 || !err?.response) {
          if (attempt >= maxRetries) {
            const message = `Request failed after ${attempt} attempts: status=${status} ${err?.message || ''}`
            const e = new Error(message)
            ;(e as any).status = status
            ;(e as any).body = body
            throw e
          }
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 100)
          await this.sleep(delay)
          continue
        }
        // other status codes: throw with response body
        const e = new Error(err?.message || 'Request error')
        ;(e as any).status = status
        ;(e as any).body = body
        throw e
      }
    }
    throw new Error('unreachable')
  }

  async detail(url: string, page = 0) {
    try {
      const wb = await this.requestWithRetry('get', url, { params: { page } })
      const $ = load(wb.data)

      const tp: any[] = []
      const episode: any[] = []
      const related: any[] = []
      const tags: string[] = []

      const detail: any = {
        title: $('.anime__details__title h3').text().trim(),
        alternativeTitle: $('.anime__details__title span').text().trim(),
        rating: $('.anime__details__pic__mobile .ep').text().trim(),
        img: $('.anime__details__pic__mobile').attr('data-setbg'),
        sinopsis: $('#synopsisField').text().trim(),
      }

      $('.anime__details__widget ul li .row').each((_, l) => {
        let t1 = $(l).find('.col-3 span').text().replace(/:/, '').toLowerCase()
        let t2 = $(l).find('.col-9')
        let t3: any
        if ($(t2).find('a').length >= 2) {
          t3 = []
          $(t2)
            .find('a')
            .each((_, h) => {
              t3.push($(h).text().trim())
            })
          if (t1 === 'tayang') t3 = t3.join(' ')
        } else {
          t3 = t2.text().trim()
        }
        detail[t1] = t3
      })

      const strEps = load($('#episodeLists').attr('data-content') || '')
      strEps('.btn-danger').each((_, el) => {
        const title = $(el).text().trim()
        const link = $(el).attr('href')
        tp.push({ title, episode: parseInt(title.replace(/\D/g, ''), 10), link })
      })

      tp.reverse().forEach((ep, id) =>
        episode.push({
          index: id + 1,
          ...ep,
        })
      )

      $('.anime__details__review .breadcrumb__links__v2 div a').each((_, l) => {
        related.push({ title: $(l).text().slice(2).trim(), url: $(l).attr('href') })
      })

      $('#tagSection .breadcrumb__links__v2__tags a').each((_, l) => {
        tags.push($(l).text().trim().replace(',', ''))
      })

      const nextPage = strEps.html()?.match(/page=(.*?)" (.*)fa-forward/)?.[1]

      return {
        id: $('input#animeId').attr('value'),
        detail,
        episode,
        related,
        tags,
        nextEpsode: !!nextPage,
        pageNextEpsode: nextPage,
      }
    } catch (error) {
      throw error
    }
  }

  async ex(a: string, b: any) {
    try {
      const c = load(b.data)(`.row div[${this.targetEnv}]`).attr(this.targetEnv)
      const d = await this.requestWithRetry('get', `/assets/js/${c}.js`)
      const e = d.data.match(/= ({[\s\S]*?});/)?.[1]
      const j1 = e?.match(/MIX_AUTH_ROUTE_PARAM: '(.*?)',/)?.[1]
      const j2 = e?.match(/MIX_PAGE_TOKEN_KEY: '(.*?)',/)?.[1]
      const j3 = e?.match(/MIX_STREAM_SERVER_KEY: '(.*?)',/)?.[1]
      const f = await this.requestWithRetry('get', `/assets/${j1}`)
      const param: [string, string][] = [[j2, f.data.trim()], [j3, 'kuramadrive'], ['page', '1']]
      const g = new URL(a)
      param.map((i) => g.searchParams.set(...i))
      return g.toString()
    } catch (e) {
      throw new Error('Failed to init url')
    }
  }

  async episode(url: string) {
    try {
      const t = await this.requestWithRetry('get', url)
      const k = await this.ex(url, t)
      const cookieHeader = (t.headers['set-cookie'] || []).map((i: string) => `${i};`).join('')
      const a = await this.requestWithRetry('get', k, { headers: { cookie: cookieHeader } })
      const $ = load(a.data)

      const result: any = {
        id: $('input#animeId').attr('value'),
        postId: $('input#postId').attr('value'),
        title: $('title').text(),
        lastUpdated: $('.breadcrumb__links__v2 > span:nth-child(2)').text().split('\n')[0],
        batch: $('a.ep-button[type="batch"]').attr('href') || null,
        episode: [],
        download: [],
        video: [],
      }

      $('a.ep-button[type="episode"]').each((_, l) => {
        if ($(l).text().trim())
          result.episode.push({ episode: $(l).text().trim(), url: $(l).attr('href') })
      })

      $('#animeDownloadLink')
        .find('h6')
        .each((_, l) => {
          let ne: any = $(l).next()
          let reso: any = { type: $(l).text().trim(), links: [] }
          while (ne.length && !ne.is('h6') && !ne.is('br')) {
            if (ne.is('a')) {
              reso.links.push({ name: ne.text().trim(), url: ne.attr('href'), recommended: ne.find('i.fa-fire').length > 0 })
            }
            ne = ne.next()
          }
          if (reso.links.length > 0) result.download.push(reso)
        })

      $('#player source').each((_, l) => {
        result.video.push({ quality: $(l).attr('size'), url: $(l).attr('src') })
      })

      return result
    } catch (e) {
      throw e
    }
  }

  async schedule(day: string, page = 1) {
    try {
      const f = (await this.requestWithRetry('get', '/schedule', { params: { scheduled_day: day, page, need_json: true } })).data
      return {
        animes: f.animes.data.map((p: any) => ({ url: this.u + `/anime/${p.id}/${p.slug}`, ...p })),
        hasNextPage: !!f.animes.next_page_url,
        nextPage: f.animes.next_page_url?.split('page=')?.[1],
      }
    } catch (e) {
      throw e
    }
  }

  async ongoing(page = 1) {
    try {
      const f = (await this.requestWithRetry('get', '/', { params: { page, need_json: true } })).data
      return {
        animes: f.ongoingAnimes.data.map((p: any) => ({ url: this.u + `/anime/${p.id}/${p.slug}`, ...p })),
        hasNextPage: !!f.ongoingAnimes.next_page_url,
        nextPage: f.ongoingAnimes.next_page_url?.split('page=')?.[1],
      }
    } catch (e) {
      throw e
    }
  }

  async finished(page = 1) {
    try {
      const f = (await this.requestWithRetry('get', '/', { params: { page, need_json: true } })).data
      return {
        animes: f.finishedAnimes.data.map((p: any) => ({ url: this.u + `/anime/${p.id}/${p.slug}`, ...p })),
        hasNextPage: !!f.finishedAnimes.next_page_url,
        nextPage: f.finishedAnimes.next_page_url?.split('page=')?.[1],
      }
    } catch (e) {
      throw e
    }
  }

  async movie(page = 1) {
    try {
      const f = (await this.requestWithRetry('get', '/', { params: { page, need_json: true } })).data
      return {
        animes: f.movieAnimes.data.map((p: any) => ({ url: this.u + `/anime/${p.id}/${p.slug}`, ...p })),
        hasNextPage: !!f.movieAnimes.next_page_url,
        nextPage: f.movieAnimes.next_page_url?.split('page=')?.[1],
      }
    } catch (e) {
      throw e
    }
  }
}

export default Kurama
