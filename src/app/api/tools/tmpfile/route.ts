'use server'

import FormData from 'form-data'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = body?.buffer || body?.data || body?.base64
    const ext = body?.ext || '.bin'
    if (!data || typeof data !== 'string')
      return NextResponse.json({ status: false, message: 'No data provided' }, { status: 400 })

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
    const filename = html2.match(/Filename(?:.+?)<td>(.+?)<\/td>/s)?.[1] || null
    const size = html2.match(/Size(?:.+?)<td>(.+?)<\/td>/s)?.[1] || null
    const url = html2.match(/URL(?:.+?)href="(.+?)"/s)?.[1] || null
    const expiresAt = html2.match(/Expires at(?:.+?)<td>(.+?)<\/td>/s)?.[1] || null

    if (!url) return NextResponse.json({ status: false, message: 'gagal mendapatkan url download', html: html2 }, { status: 500 })

    const result = { filename, size, expiresAt, url }
    return NextResponse.json({ status: true, creator: 'sanzz', data: result })
  } catch (err: any) {
    return NextResponse.json({ status: false, error: String(err) }, { status: 500 })
  }
}
