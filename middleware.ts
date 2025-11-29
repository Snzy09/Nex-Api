import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { metrics } from './src/lib/metrics'
import { appendLog } from './src/lib/filelogger'

export function middleware(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname
    const search = req.nextUrl.search || ''
    const fullPath = `${pathname}${search}`

    // keep metrics aggregation by pathname (no query string)
    metrics.recordRequest(pathname)

    // determine client IP from headers (x-forwarded-for) or fall back to unknown
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || 'unknown')
    const ua = req.headers.get('user-agent') || undefined

    // decide whether this request is a real user access we want to log
    const accept = req.headers.get('accept') || ''
    const secFetchMode = req.headers.get('sec-fetch-mode')
    const secFetchUser = req.headers.get('sec-fetch-user')
    const referer = req.headers.get('referer') || undefined

    const isApi = pathname.startsWith('/api/')
    const isNextInternal = pathname.startsWith('/_next/') || pathname.startsWith('/_next/data')

    // Consider as user-access when:
    // - it's an API call (we want logs), OR
    // - the request accepts HTML (page navigation), OR
    // - the browser indicates a navigation via sec-fetch headers
    const isBrowserNavigation = accept.includes('text/html') || secFetchMode === 'navigate' || secFetchUser === '?1'

    // Only log real user interactions and API requests; exclude Next.js internal assets
    const shouldLog = !isNextInternal && (isApi || isBrowserNavigation)

    // metrics.requestLogs will contain the more detailed fullPath for visibility
    metrics.logRequest({ path: fullPath, method: req.method, ip, ua })

    if (shouldLog) {
      // write minimal log to file (middleware has no status/responseTime)
      appendLog({
        method: req.method,
        host: req.headers.get('host'),
        path: fullPath,
        pathname,
        query: search,
        ip,
        userAgent: ua,
        referer,
        isApi,
      })
      console.log(`[api-metrics] ${req.method} ${fullPath} ip=${ip}`)
    }
  } catch (err) {
    // non-fatal
    console.error('middleware metrics error', err)
  }
  return NextResponse.next()
}

export const config = {
  // run middleware for pages and api, but skip Next.js internals and static assets
  matcher: ['/:path*'],
}
