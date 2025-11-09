import axios from 'axios'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    let { code, url } = body as { code?: string; url?: string }

    if (!code && !url) {
      return NextResponse.json({ error: true, message: 'Butuh code atau url nya lah bree...' }, { status: 400 })
    }

    if (url) {
      const lower = url.toLowerCase()
      const isRaw = lower.includes('/raw') || lower.includes('raw.githubusercontent') || lower.includes('pastebin.com/raw')
      if (!isRaw) {
        return NextResponse.json({ error: true, message: 'URL tidak mengarah ke RAW content. Tambahin /raw di URL bree...' }, { status: 400 })
      }

      try {
        const fetched = await axios.get(url)
        code = fetched.data
      } catch (err: any) {
        return NextResponse.json({ error: true, message: `Gagal mengambil konten dari URL: ${err.message}` }, { status: 500 })
      }
    }

    if (!code) {
      return NextResponse.json({ error: true, message: 'Code kosong bree...' }, { status: 400 })
    }

    const { data } = await axios.post('https://codedetector.io/api/analyze', { code })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: true, message: e?.message || String(e) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  return NextResponse.json({ message: 'Use POST with { code } or { url }' })
}
