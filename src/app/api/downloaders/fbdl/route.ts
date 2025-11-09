import axios from 'axios'
import cheerio from 'cheerio'
import { NextResponse } from 'next/server'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const url = (body.url || new URL(req.url).searchParams.get('url') || '').trim()

    if (!/facebook\.|facebook\w*\/.+/(reel|watch|share)|facebook\./i.test(url) && !/facebook\.(com|watch)/i.test(url)) {
      // Validate loosely: ensure facebook in url
      return NextResponse.json({ error: true, message: 'Invalid URL, masukkan URL video Facebook yang valid.' }, { status: 400 })
    }

    // fetch initial page to extract tokens
    const res = await axios.get('https://fdownloader.net/id', {
      headers: { 'User-Agent': USER_AGENT }
    })

    const html = res.data as string
    const exMatch = html.match(/k_exp\s*=\s*"(\d+)"/i)
    const toMatch = html.match(/k_token\s*=\s*"([a-f0-9]+)"/i)
    const ex = exMatch ? exMatch[1] : null
    const to = toMatch ? toMatch[1] : null

    if (!ex || !to) {
      return NextResponse.json({ error: true, message: 'Gagal mengekstrak token dan exp dari halaman awal.' }, { status: 500 })
    }

    const params = new URLSearchParams({
      k_exp: ex,
      k_token: to,
      q: url,
      lang: 'id',
      web: 'fdownloader.net',
      v: 'v2',
      w: ''
    })

    const searchResponse = await axios.post('https://v3.fdownloader.net/api/ajaxSearch?lang=id', params.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://fdownloader.net'
      },
      responseType: 'json'
    })

    const data = searchResponse.data
    if (!data || data.status !== 'ok') {
      return NextResponse.json({ error: true, message: 'Gagal melakukan pencarian video melalui AJAX.' }, { status: 500 })
    }

    const $ = cheerio.load(data.data)

    const title = $('.thumbnail > .content > .clearfix > h3').text().trim() || ''
    const duration = $('.thumbnail > .content > .clearfix > p').text().trim() || ''
    const thumbnail = $('.thumbnail > .image-fb > img').attr('src') || ''
    const media = $('#popup_play > .popup-body > .popup-content > #vid').attr('src') || ''
    const music = $('#fbdownloader').find('#audioUrl').attr('value') || ''

    const videoList: Array<{ quality: string; url: string }> = []
    $('#fbdownloader')
      .find('.tab__content')
      .eq(0)
      .find('tr')
      .each((_, el) => {
        const quality = cheerio(el).find('.video-quality').text().trim() || ''
        const urlVal = cheerio(el).find('a').attr('href') || cheerio(el).find('button').attr('data-videourl') || null
        if (urlVal && urlVal !== '#note_convert') {
          videoList.push({ quality, url: urlVal })
        }
      })

    return NextResponse.json({ metadata: { title, duration, thumbnail }, download: { media, music, videos: videoList } })
  } catch (error: any) {
    return NextResponse.json({ error: true, message: error?.message || String(error) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  // Allow GET with ?url=... for simple testing
  return POST(req)
}
