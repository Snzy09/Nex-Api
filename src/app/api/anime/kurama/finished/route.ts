import { NextResponse } from 'next/server'
import { metrics } from '@/lib/metrics'
import Kurama from '@/lib/kurama'

export async function GET(req: Request) {
  const start = Date.now()
  try {
    const page = Number(new URL(req.url).searchParams.get('page') ?? 1)
    const k = new Kurama()
    const res = await k.finished(page)
    metrics.recordResponse('/api/anime/kurama/finished', Date.now() - start)
    return NextResponse.json(res)
  } catch (e: any) {
    metrics.recordResponse('/api/anime/kurama/finished', Date.now() - start)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
