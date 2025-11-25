import { NextResponse } from 'next/server'
import { metrics } from '@/lib/metrics'

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Nex API (mini spec)',
    version: '1.0.0',
    description: 'Minimal OpenAPI spec exposing status, version and monitor endpoints.'
  },
  paths: {
    '/api/status': {
      get: { summary: 'Service status', responses: { '200': { description: 'OK' } } }
    },
    '/api/version': {
      get: { summary: 'Service version', responses: { '200': { description: 'OK' } } }
    },
    '/api/monitor/metrics': {
      get: { summary: 'Metrics', responses: { '200': { description: 'JSON metrics' } } }
    }
  }
}

export async function GET() {
  const start = Date.now()
  metrics.recordResponse('/api/openapi', Date.now() - start)
  return NextResponse.json(spec)
}
