import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { metrics } from './src/lib/metrics'

export function middleware(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname
    metrics.recordRequest(path)
    // determine client IP from headers (x-forwarded-for) or fall back to unknown
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || 'unknown')
    const ua = req.headers.get('user-agent') || undefined
    metrics.logRequest({ path, method: req.method, ip, ua })
    console.log(`[api-metrics] ${req.method} ${path} ip=${ip}`)
  } catch (err) {
    // non-fatal
    console.error('middleware metrics error', err)
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
