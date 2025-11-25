import { NextResponse } from 'next/server'
import { metrics } from '@/lib/metrics'
import packageJson from '../../../../package.json'

export async function GET() {
  const start = Date.now()
  try {
    const pkg: any = packageJson as any
    const payload = {
      status: true,
      name: pkg.name || null,
      version: pkg.version || null,
      description: pkg.description || null,
      time: new Date().toISOString(),
    }
    metrics.recordResponse('/api/version', Date.now() - start)
    return NextResponse.json(payload)
  } catch (err: any) {
    metrics.recordResponse('/api/version', Date.now() - start)
    return NextResponse.json({ status: false, error: String(err) }, { status: 500 })
  }
}
