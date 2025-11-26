import { NextResponse } from 'next/server'
import { metrics } from '@/lib/metrics'
import Kurama from '@/lib/kurama'

export async function GET(req: Request) {
  const start = Date.now()
  try {
    const url = new URL(req.url).searchParams.get('url')
    if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 })
    const k = new Kurama()
    const res = await k.episode(url)
    metrics.recordResponse('/api/anime/kurama/episode', Date.now() - start)
    return NextResponse.json(res)
  } catch (e: any) {
    metrics.recordResponse('/api/anime/kurama/episode', Date.now() - start)
    const body = (e && (e as any).body) ? (e as any).body : undefined
    const status = (e && (e as any).status) ? (e as any).status : 500
    return NextResponse.json({ error: String(e), status, body }, { status })
  }
}
