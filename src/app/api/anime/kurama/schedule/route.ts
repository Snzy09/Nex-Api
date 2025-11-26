import { NextResponse } from 'next/server'
import { metrics } from '@/lib/metrics'
import Kurama from '@/lib/kurama'

export async function GET(req: Request) {
  const start = Date.now()
  try {
    const params = new URL(req.url).searchParams
    const day = params.get('day')
    const page = Number(params.get('page') ?? 1)
    if (!day) return NextResponse.json({ error: 'missing day' }, { status: 400 })
    const k = new Kurama()
    const res = await k.schedule(day, page)
    metrics.recordResponse('/api/anime/kurama/schedule', Date.now() - start)
    return NextResponse.json(res)
  } catch (e: any) {
    metrics.recordResponse('/api/anime/kurama/schedule', Date.now() - start)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
