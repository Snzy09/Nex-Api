import axios from 'axios'
import { load } from 'cheerio'

export class Kurama {
  u: string
  targetEnv: string
  is: any

  constructor() {
    this.u = 'https://v8.kuramanime.tel'
    this.targetEnv = 'data-kk'
    this.is = axios.create({
      baseURL: this.u,
      headers: {
        'user-agent': 'Mozilla/5.0 (Linux; Android 16; NX729J) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.7499.34 Mobile Safari/537.36',
        origin: this.u,
        referer: this.u,
      },
    })
  }

  async detail(url: string, page = 0) {
    try {
      const wb = await this.is.get(url, { params: { page } })
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
      const d = await this.is.get(`/assets/js/${c}.js`)
      const e = d.data.match(/= ({[\s\S]*?});/)?.[1]
      const j1 = e?.match(/MIX_AUTH_ROUTE_PARAM: '(.*?)',/)?.[1]
      const j2 = e?.match(/MIX_PAGE_TOKEN_KEY: '(.*?)',/)?.[1]
      const j3 = e?.match(/MIX_STREAM_SERVER_KEY: '(.*?)',/)?.[1]
      const f = await this.is.get(`/assets/${j1}`)
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
      const t = await this.is.get(url)
      const k = await this.ex(url, t)
      const a = await axios.get(k, {
        headers: {
          cookie: (t.headers['set-cookie'] || []).map((i: string) => `${i};`).join('')
        }
      })
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
      const f = await this.is.get('/schedule', { params: { scheduled_day: day, page, need_json: true } }).then((i: any) => i.data)
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
      const f = await this.is.get('/', { params: { page, need_json: true } }).then((i: any) => i.data)
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
      const f = await this.is.get('/', { params: { page, need_json: true } }).then((i: any) => i.data)
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
      const f = await this.is.get('/', { params: { page, need_json: true } }).then((i: any) => i.data)
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
