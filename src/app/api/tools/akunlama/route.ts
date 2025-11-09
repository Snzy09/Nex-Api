import axios from 'axios'
import cheerio from 'cheerio'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || url.searchParams.get('a')

    if (!action) {
      return NextResponse.json({ error: true, message: 'Missing action parameter. Use ?action=cekEmail|inbox|getInbox' }, { status: 400 })
    }

    if (action === 'cekEmail') {
      const recipient = url.searchParams.get('recipient')
      if (!recipient) return NextResponse.json({ error: true, message: 'Missing recipient parameter' }, { status: 400 })

      const apiUrl = `https://akunlama.com/api/v1/mail/list?recipient=${encodeURIComponent(recipient)}`
      const response = await axios.get(apiUrl)
      if (Array.isArray(response.data) && response.data.length === 0) {
        return NextResponse.json({ status: 'available', email: `${recipient}@akunlama.com` })
      }
      return NextResponse.json({ status: 'already taken', message: 'coba yang lain lek, ini bisa sih tapi udh pernah di pake org' })
    }

    if (action === 'inbox') {
      const recipient = url.searchParams.get('recipient')
      if (!recipient) return NextResponse.json({ error: true, message: 'Missing recipient parameter' }, { status: 400 })

      const apiUrl = `https://akunlama.com/api/v1/mail/list?recipient=${encodeURIComponent(recipient)}`
      const response = await axios.get(apiUrl)
      const messages = response.data
      if (!Array.isArray(messages) || messages.length === 0) return NextResponse.json([])

      const formatted = messages.map((item: any) => ({
        region: item.storage?.region,
        key: item.storage?.key,
        timestamp: item.timestamp,
        sender: item.sender,
        subject: item.message?.headers?.subject,
        from: item.message?.headers?.from
      }))
      return NextResponse.json(formatted)
    }

    if (action === 'getInbox') {
      const region = url.searchParams.get('region')
      const key = url.searchParams.get('key')
      if (!region || !key) return NextResponse.json({ error: true, message: 'Missing region or key' }, { status: 400 })

      const apiUrl = `https://akunlama.com/api/v1/mail/getHtml?region=${encodeURIComponent(region)}&key=${encodeURIComponent(key)}`
      const response = await axios.get(apiUrl)
      const html = response.data
      if (!html || typeof html !== 'string') return NextResponse.json({ plainText: '', links: [] })

      const $ = cheerio.load(html)
      $('script, style').remove()
      const plainText = $('body').text().replace(/\s+/g, ' ').trim()
      const links: Array<{ href: string; text: string }> = []
      $('a').each((i, el) => {
        const href = $(el).attr('href')
        if (href) links.push({ href, text: $(el).text().trim() })
      })

      return NextResponse.json({ plainText, links })
    }

    return NextResponse.json({ error: true, message: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: true, message: err?.message || String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // Allow POST with JSON body { action, ... }
  try {
    const body = await req.json().catch(() => ({}))
    const action = body.action
    const url = new URL(req.url)
    // merge body into query format by delegating to GET-like logic
    if (action) {
      // Rebuild a fake URL with query params
      const search = new URLSearchParams()
      search.set('action', String(action))
      if (body.recipient) search.set('recipient', String(body.recipient))
      if (body.region) search.set('region', String(body.region))
      if (body.key) search.set('key', String(body.key))
      const fake = new Request(`${url.origin}${url.pathname}?${search.toString()}`)
      return GET(fake)
    }
    return NextResponse.json({ error: true, message: 'Missing action in POST body' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: true, message: err?.message || String(err) }, { status: 500 })
  }
}
