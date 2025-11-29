import axios from 'axios'
import { load } from 'cheerio'
import { NextResponse } from 'next/server'
import { appendLog } from '@/lib/filelogger'

export async function GET(req: Request) {
  const start = Date.now()
  const url = new URL(req.url)
  const fullPath = url.pathname + (url.search || '')
  const method = req.method
  try {
    const action = url.searchParams.get('action') || url.searchParams.get('a')

    if (!action) {
      await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing action' }).catch(()=>{})
      return NextResponse.json({ error: true, message: 'Missing action parameter. Use ?action=cekEmail|inbox|getInbox' }, { status: 400 })
    }

    if (action === 'cekEmail') {
      const recipient = url.searchParams.get('recipient')
      if (!recipient) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing recipient' }).catch(()=>{})
        return NextResponse.json({ error: true, message: 'Missing recipient parameter' }, { status: 400 })
      }

      const apiUrl = `https://akunlama.com/api/v1/mail/list?recipient=${encodeURIComponent(recipient)}`
      const response = await axios.get(apiUrl)
      if (Array.isArray(response.data) && response.data.length === 0) {
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({ status: 'available', email: `${recipient}@akunlama.com` })
      }
      await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
      return NextResponse.json({ status: 'already taken', message: 'coba yang lain lek, ini bisa sih tapi udh pernah di pake org' })
    }

    if (action === 'inbox') {
      const recipient = url.searchParams.get('recipient')
      if (!recipient) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing recipient' }).catch(()=>{})
        return NextResponse.json({ error: true, message: 'Missing recipient parameter' }, { status: 400 })
      }

      const apiUrl = `https://akunlama.com/api/v1/mail/list?recipient=${encodeURIComponent(recipient)}`
      const response = await axios.get(apiUrl)
      const messages = response.data
      if (!Array.isArray(messages) || messages.length === 0) {
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json([])
      }

      const formatted = messages.map((item: any) => ({
        region: item.storage?.region,
        key: item.storage?.key,
        timestamp: item.timestamp,
        sender: item.sender,
        subject: item.message?.headers?.subject,
        from: item.message?.headers?.from
      }))
      await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
      return NextResponse.json(formatted)
    }

    if (action === 'getInbox') {
      const region = url.searchParams.get('region')
      const key = url.searchParams.get('key')
      if (!region || !key) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing region or key' }).catch(()=>{})
        return NextResponse.json({ error: true, message: 'Missing region or key' }, { status: 400 })
      }

      const apiUrl = `https://akunlama.com/api/v1/mail/getHtml?region=${encodeURIComponent(region)}&key=${encodeURIComponent(key)}`
      const response = await axios.get(apiUrl)
      const html = response.data
      if (!html || typeof html !== 'string') {
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({ plainText: '', links: [] })
      }

      const $ = load(html)
      $('script, style').remove()
      const plainText = $('body').text().replace(/\s+/g, ' ').trim()
      const links: Array<{ href: string; text: string }> = []
      $('a').each((i: any, el: any) => {
        const href = $(el).attr('href')
        if (href) links.push({ href, text: $(el).text().trim() })
      })

      await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
      return NextResponse.json({ plainText, links })
    }

    await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'unknown action' }).catch(()=>{})
    return NextResponse.json({ error: true, message: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
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
