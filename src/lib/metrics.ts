import { apiEndpoints } from '@/settings/config'

type RouteCounts = Record<string, number>

export const metrics = {
  totalRequests: 0 as number,
  routes: {} as RouteCounts,
  responseTimes: {} as Record<string, number[]>,

  recordRequest(path: string) {
    this.totalRequests++
    this.routes[path] = (this.routes[path] || 0) + 1
  },

  recordResponse(path: string, ms: number) {
    if (!this.responseTimes[path]) this.responseTimes[path] = []
    this.responseTimes[path].push(ms)
  },

  getMetrics() {
    const avgResponseTime: Record<string, number> = {}
    for (const k of Object.keys(this.responseTimes)) {
      const arr = this.responseTimes[k] || []
      const sum = arr.reduce((s, v) => s + v, 0)
      avgResponseTime[k] = arr.length ? Math.round(sum / arr.length) : 0
    }

    // Build per-category aggregations using apiEndpoints registry
    const categories: Record<string, { totalRequests: number; endpoints: Record<string, { requests: number; avgResponseMs: number }>; }> = {}

    for (const [catKey, cat] of Object.entries(apiEndpoints)) {
      const info = { totalRequests: 0, endpoints: {} as Record<string, { requests: number; avgResponseMs: number }> }
      for (const ep of cat.endpoints || []) {
        const p = ep.path
        const requests = this.routes[p] || 0
        const avg = avgResponseTime[p] || 0
        info.endpoints[p] = { requests, avgResponseMs: avg }
        info.totalRequests += requests
      }
      categories[catKey] = info
    }

    // top endpoints by requests
    const topEndpoints = Object.entries(this.routes)
      .map(([p, cnt]) => ({ path: p, requests: cnt, avgResponseMs: avgResponseTime[p] || 0 }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 20)

    return {
      totalRequests: this.totalRequests,
      routes: this.routes,
      avgResponseTime,
      rawResponseTimes: this.responseTimes,
      categories,
      topEndpoints,
      now: new Date().toISOString(),
    }
  },
}

export default metrics
