import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { metrics } from './src/lib/metrics'

export function middleware(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname
    metrics.recordRequest(path)
    console.log(`[api-metrics] ${req.method} ${path}`)
  } catch (err) {
    // non-fatal
    console.error('middleware metrics error', err)
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
