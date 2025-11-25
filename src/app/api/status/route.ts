import { NextResponse } from 'next/server'
import { metrics } from '@/lib/metrics'

export async function GET() {
  const start = Date.now()
  try {
    const uptime = process.uptime ? Math.round(process.uptime()) : 0
    const payload = {
      status: true,
      uptime_seconds: uptime,
      time: new Date().toISOString(),
    }
    metrics.recordResponse('/api/status', Date.now() - start)
    return NextResponse.json(payload)
  } catch (err: any) {
    metrics.recordResponse('/api/status', Date.now() - start)
    return NextResponse.json({ status: false, error: String(err) }, { status: 500 })
  }
}
