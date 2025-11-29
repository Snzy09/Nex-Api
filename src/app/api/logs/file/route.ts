import { NextResponse } from 'next/server'
import { tailLogs } from '@/lib/filelogger'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Math.min(1000, Number(limitParam) || 100)) : 100

    const data = tailLogs(limit)
    // detect requester IP from headers
    const requesterIp = req.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || req.headers.get('fastly-client-ip') || null
    return NextResponse.json({ status: true, data, requesterIp })
  } catch (e: any) {
    return NextResponse.json({ status: false, error: String(e) }, { status: 500 })
  }
}
