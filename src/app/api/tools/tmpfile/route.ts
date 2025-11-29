'use server'

import FormData from 'form-data'
import { NextResponse } from 'next/server'
import { appendLog } from '@/lib/filelogger'

export async function POST(req: Request) {
  const start = Date.now()
  const urlObj = new URL(req.url)
  const fullPath = urlObj.pathname + (urlObj.search || '')
  const method = req.method
  try {
    const body = await req.json()
    const data = body?.buffer || body?.data || body?.base64
    const ext = body?.ext || '.bin'
    if (!data || typeof data !== 'string'){
      await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'no data' }).catch(()=>{})
      return NextResponse.json({ status: false, message: 'No data provided' }, { status: 400 })
    }

    const base64 = data.replace(/^data:.*;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')

    const origin = 'https://tmpfiles.org'
    const r1 = await fetch(origin)

    const rawSetCookie = r1.headers.get('set-cookie') || ''
    // try to normalize multiple Set-Cookie values
    const cookie = rawSetCookie
      ? rawSetCookie
          .split(/,(?=[^ ;]+=)/)
          .map((v) => v.split(';')[0])
          .join('; ')
      : ''

    const html = await r1.text()
    const token = html.match(/token" value="(.+?)"/)?.[1] || html.match(/name="_token" value="(.+?)"/)?.[1] || ''

    const form = new FormData()
    form.append('_token', token)
    form.append('upload', 'Upload')
    form.append('file', buffer, { filename: `${Date.now()}${ext}` })

    const r2 = await fetch(origin, {
      method: 'POST',
      headers: {
        ...(cookie ? { cookie } : {}),
        ...((form as any).getHeaders ? (form as any).getHeaders() : {}),
      },
      body: form as any,
    })

    const html2 = await r2.text()
    const filename = html2.match(/Filename(?:[\s\S]+?)<td>(.+?)<\/td>/)?.[1] || null
    const size = html2.match(/Size(?:[\s\S]+?)<td>(.+?)<\/td>/)?.[1] || null
    const url = html2.match(/URL(?:[\s\S]+?)href="(.+?)"/)?.[1] || null
    const expiresAt = html2.match(/Expires at(?:[\s\S]+?)<td>(.+?)<\/td>/)?.[1] || null

    if (!url) {
      await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, message: 'no url returned' }).catch(()=>{})
      return NextResponse.json({ status: false, message: 'gagal mendapatkan url download', html: html2 }, { status: 500 })
    }

    const result = { filename, size, expiresAt, url }
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return NextResponse.json({ status: true, creator: 'sanzz', data: result })
  } catch (err: any) {
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
    return NextResponse.json({ status: false, error: String(err) }, { status: 500 })
  }
}
