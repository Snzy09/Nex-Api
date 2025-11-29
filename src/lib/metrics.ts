import { apiEndpoints } from '@/settings/config'

let firebaseDb: any = null
let firebaseAvailable = false

async function initFirebaseIfNeeded() {
  if (firebaseAvailable || firebaseDb) return
  try {
    const { initializeApp } = await import('firebase/app')
    const { getFirestore } = await import('firebase/firestore')
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
    if (!apiKey || !projectId) return
    const app = initializeApp({
      apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
    })
    firebaseDb = getFirestore(app)
    firebaseAvailable = true
  } catch (e) {
    // If Firebase isn't configured or import fails, leave firebaseAvailable false
    firebaseAvailable = false
  }
}

type RouteCounts = Record<string, number>

export const metrics = {
  totalRequests: 0 as number,
  routes: {} as RouteCounts,
  // counts for the current day (resets at 00:00 Asia/Jakarta)
  routesDaily: {} as RouteCounts,
  responseTimes: {} as Record<string, number[]>,
  // recent request logs (most recent first)
  requestLogs: [] as { ts: number; path: string; method: string; ip: string; ua?: string }[],
  // counts per ip (all-time)
  ipCounts: {} as Record<string, number>,
  // counts per ip for the current day (resets at 00:00 Asia/Jakarta)
  ipCountsDaily: {} as Record<string, number>,
  // ISO timestamp when the current daily window started (Jakarta midnight)
  dailyWindowStart: null as string | null,

  recordRequest(path: string) {
    this.totalRequests++
    this.routes[path] = (this.routes[path] || 0) + 1
    this.routesDaily[path] = (this.routesDaily[path] || 0) + 1

    // Also persist increments to Firebase (if available)
    ;(async () => {
      try {
        await initFirebaseIfNeeded()
        if (!firebaseAvailable || !firebaseDb) return
        const { doc, updateDoc, setDoc, increment } = await import('firebase/firestore')
        const countersRef = doc(firebaseDb, 'api_metrics', 'counters')
        // Try update, if fails (doc missing), set with initial values
        try {
          await updateDoc(countersRef, {
            totalRequests: increment(1),
            [`routes.${path}`]: increment(1),
          })
        } catch (err) {
          await setDoc(countersRef, {
            totalRequests: 1,
            routes: { [path]: 1 },
          }, { merge: true })
        }
      } catch (err) {
        // ignore Firebase errors to avoid breaking metrics recording
      }
    })()

    // also update daily counters document (date-based) in Firestore so daily windows are shared
    ;(async () => {
      try {
        await initFirebaseIfNeeded()
        if (!firebaseAvailable || !firebaseDb) return
        const { doc, updateDoc, setDoc, increment } = await import('firebase/firestore')
        const offsetMs = 7 * 60 * 60 * 1000
        const jakarta = new Date(Date.now() + offsetMs)
        const y = jakarta.getUTCFullYear()
        const m = String(jakarta.getUTCMonth() + 1).padStart(2, '0')
        const d = String(jakarta.getUTCDate()).padStart(2, '0')
        const dateId = `${y}-${m}-${d}`
        const dailyRef = doc(firebaseDb, 'daily_counters', dateId)
        try {
          await updateDoc(dailyRef, {
            [`routes.${path}`]: increment(1),
            totalRequests: increment(1),
          })
        } catch (e) {
          await setDoc(dailyRef, { totalRequests: 1, routes: { [path]: 1 }, ips: {} }, { merge: true })
        }
      } catch (e) {
        // ignore
      }
    })()
  },

  logRequest(info: { path: string; method: string; ip?: string; ua?: string }) {
    const ts = Date.now()
    const ip = info.ip || 'unknown'
    this.requestLogs.unshift({ ts, path: info.path, method: info.method || 'GET', ip, ua: info.ua })
    // cap logs to last 500 entries
    if (this.requestLogs.length > 500) this.requestLogs.length = 500
    this.ipCounts[ip] = (this.ipCounts[ip] || 0) + 1
    this.ipCountsDaily[ip] = (this.ipCountsDaily[ip] || 0) + 1

    // persist to Firebase if possible (best-effort)
    ;(async () => {
      try {
        await initFirebaseIfNeeded()
        if (!firebaseAvailable || !firebaseDb) return
        const { collection, addDoc, doc, updateDoc, increment } = await import('firebase/firestore')
        // store recent log in a dedicated collection
        try {
          const col = collection(firebaseDb, 'api_logs')
          await addDoc(col, { ts, path: info.path, method: info.method || 'GET', ip, ua: info.ua })
        } catch (e) {
          // ignore
        }
        // update counters doc
        try {
          const countersRef = doc(firebaseDb, 'api_metrics', 'counters')
          await updateDoc(countersRef, {
            [`ips.${ip}`]: increment(1),
          })
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore firebase errors
      }
    })()
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

    // top endpoints by requests (all-time)
    const topEndpoints = Object.entries(this.routes)
      .map(([p, cnt]) => ({ path: p, requests: cnt, avgResponseMs: avgResponseTime[p] || 0 }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 20)

    // top endpoints in the current day (resets at Jakarta midnight)
    const topEndpoints24 = Object.entries(this.routesDaily)
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
      topEndpoints24,
      // request logs and ip aggregates
      recentLogs: this.requestLogs.slice(0, 100),
      ipCounts: this.ipCounts,
      // top requesters this day
      ipCountsDaily: this.ipCountsDaily,
      topRequesters24: Object.entries(this.ipCountsDaily).map(([ip, cnt]) => ({ ip, requests: cnt })).sort((a, b) => b.requests - a.requests).slice(0, 20),
      dailyWindowStart: this.dailyWindowStart,
      now: new Date().toISOString(),
    }
  },
}

export default metrics

// Schedule daily reset at 00:00 Asia/Jakarta (UTC+7)
function getNextJakartaMidnightMs() {
  const now = new Date()
  // Jakarta is UTC+7
  const offsetMs = 7 * 60 * 60 * 1000
  const jakartaNow = new Date(now.getTime() + offsetMs)
  const y = jakartaNow.getUTCFullYear()
  const m = jakartaNow.getUTCMonth()
  const d = jakartaNow.getUTCDate()
  // next midnight in Jakarta => (y,m,d+1 at 00:00 Jakarta) expressed in UTC ms
  const nextJakartaMidnightUtcMs = Date.UTC(y, m, d + 1, 0, 0, 0) - offsetMs
  // If already past, fallback to +24h
  if (nextJakartaMidnightUtcMs <= Date.now()) return nextJakartaMidnightUtcMs + 24 * 60 * 60 * 1000
  return nextJakartaMidnightUtcMs
}

function resetDailyCounters() {
  try {
    metrics.routesDaily = {}
    metrics.ipCountsDaily = {}
    // compute the Jakarta midnight start ISO for the window we just started
    try {
      const offsetMs = 7 * 60 * 60 * 1000
      const now = new Date()
      const jakartaNow = new Date(now.getTime() + offsetMs)
      const y = jakartaNow.getUTCFullYear()
      const m = jakartaNow.getUTCMonth()
      const d = jakartaNow.getUTCDate()
      const jakartaMidnightStartUtcMs = Date.UTC(y, m, d, 0, 0, 0) - offsetMs
      metrics.dailyWindowStart = new Date(jakartaMidnightStartUtcMs).toISOString()
    } catch (e) {
      metrics.dailyWindowStart = new Date().toISOString()
    }
    // Note: keep overall totals and recentLogs; we only clear the daily windows
    console.info('[metrics] reset daily counters at', new Date().toISOString())
    // Optionally persist reset to Firebase (best-effort)
    ;(async () => {
      try {
        await initFirebaseIfNeeded()
        if (!firebaseAvailable || !firebaseDb) return
        const { doc, setDoc } = await import('firebase/firestore')
        const countersRef = doc(firebaseDb, 'api_metrics', 'daily_counters')
        await setDoc(countersRef, { resetAt: new Date().toISOString() }, { merge: true })
      } catch (e) {
        // ignore firebase errors
      }
    })()
  } catch (e) {
    // ignore
  }
}

function scheduleDailyReset() {
  try {
    const nextMs = getNextJakartaMidnightMs()
    const delay = Math.max(0, nextMs - Date.now())
    setTimeout(() => {
      resetDailyCounters()
      // then schedule every 24h
      setInterval(resetDailyCounters, 24 * 60 * 60 * 1000)
    }, delay)
  } catch (e) {
    // ignore
  }
}

// start scheduler
scheduleDailyReset()
