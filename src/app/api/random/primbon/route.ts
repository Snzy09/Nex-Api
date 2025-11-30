import { NextResponse } from 'next/server'
import { Primbon } from '@/lib/primbon'
import { featureMap } from '@/lib/primbon-features'

const p = new Primbon()

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
