import { NextResponse } from 'next/server'
import { featureMap } from '@/lib/primbon-features'

export async function GET(req: Request) {
  try {
    const items = Object.entries(featureMap).map(([code, { fn, params }]) => ({ code, fn, params }))
    return NextResponse.json({ status: true, features: items })
  } catch (err: any) {
    return NextResponse.json({ status: false, error: String(err) }, { status: 500 })
  }
}

export const runtime = 'edge'
