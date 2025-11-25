export const metrics = {
  totalRequests: 0 as number,
  routes: {} as Record<string, number>,
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
    return {
      totalRequests: this.totalRequests,
      routes: this.routes,
      avgResponseTime,
      rawResponseTimes: this.responseTimes,
      now: new Date().toISOString(),
    }
  },
}

export default metrics
