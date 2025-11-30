import { NextResponse } from 'next/server'
import { Primbon } from '@/lib/primbon'

const p = new Primbon()

const featureMap: Record<string, { fn: string; params: string[] }> = {
  nh: { fn: 'nomer_hoki', params: ['nomor'] },
  tm: { fn: 'tafsir_mimpi', params: ['q'] },
  rj: { fn: 'ramalan_jodoh', params: ['n1', 'd1', 'm1', 'y1', 'n2', 'd2', 'm2', 'y2'] },
  rjb: { fn: 'ramalan_jodoh_bali', params: ['n1', 'd1', 'm1', 'y1', 'n2', 'd2', 'm2', 'y2'] },
  sj: { fn: 'suami_istri', params: ['n1', 'd1', 'm1', 'y1', 'n2', 'd2', 'm2', 'y2'] },
  rc: { fn: 'ramalan_cinta', params: ['n1', 'd1', 'm1', 'y1', 'n2', 'd2', 'm2', 'y2'] },
  an: { fn: 'arti_nama', params: ['q'] },
  kn: { fn: 'kecocokan_nama', params: ['nama', 'd', 'm', 'y'] },
  zodiac: { fn: 'zodiak', params: ['q'] },
  shio: { fn: 'shio', params: ['q'] },
}

function getParam(source: URLSearchParams, name: string) {
  return source.get(name) || ''
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const params = url.searchParams
    const f = params.get('f') || params.get('feature')
    if (!f) return NextResponse.json({ status: false, message: 'feature required (f=nh|tm|rj|...)' }, { status: 400 })
    const entry = featureMap[f]
    if (!entry) return NextResponse.json({ status: false, message: 'unknown feature' }, { status: 400 })
    const args = entry.params.map((k) => getParam(params, k))
    // call mapped function
    // @ts-ignore dynamic
    const res = await (p as any)[entry.fn](...args)
    return NextResponse.json({ status: true, category: 'random', feature: f, data: res })
  } catch (err: any) {
    return NextResponse.json({ status: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const f = body.f || body.feature
    if (!f) return NextResponse.json({ status: false, message: 'feature required (f)' }, { status: 400 })
    const entry = featureMap[f]
    if (!entry) return NextResponse.json({ status: false, message: 'unknown feature' }, { status: 400 })
    const args = entry.params.map((k) => body[k] || '')
    // @ts-ignore
    const res = await (p as any)[entry.fn](...args)
    return NextResponse.json({ status: true, category: 'random', feature: f, data: res })
  } catch (err: any) {
    return NextResponse.json({ status: false, error: String(err) }, { status: 500 })
  }
}

export const runtime = 'edge'
