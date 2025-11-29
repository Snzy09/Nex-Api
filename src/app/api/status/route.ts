import { NextResponse } from 'next/server'
import { metrics } from '@/lib/metrics'
import os from 'os'
import fs from 'fs'
import { appendLog } from '@/lib/filelogger'

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function getCpuUsagePercent(): number {
  const load = os.loadavg()[0]
  const cpus = os.cpus().length || 1
  const percent = (load / cpus) * 100
  return Math.max(0, Math.min(100, percent))
}

function readProcUptimeSeconds(): number | null {
  try {
    const data = fs.readFileSync('/proc/uptime', 'utf8')
    const parts = data.split(/\s+/)
    if (parts.length > 0) return Number(parts[0])
    return null
  } catch (e) {
    return null
  }
}

function getNetworkInterfacesSummary() {
  const ifaces = os.networkInterfaces()
  const summary: Record<string, any> = {}
  for (const [name, addrs] of Object.entries(ifaces)) {
    summary[name] = (addrs || []).map((a: any) => ({ address: a.address, family: a.family, internal: a.internal }))
  }
  return summary
}

export async function GET() {
  const start = Date.now()
  try {
    const now = Date.now()

    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memoryUsagePercent = totalMem > 0 ? (usedMem / totalMem) * 100 : 0

    const uptimeSeconds = readProcUptimeSeconds() ?? Math.floor(process.uptime ? process.uptime() : os.uptime())

    const payload: any = {
      status: true,
      time: new Date(now).toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        human: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${Math.floor(uptimeSeconds % 60)}s`,
      },
      system: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        cpus: os.cpus().length,
        cpuModel: os.cpus()[0]?.model ?? null,
        cpuLoadPercent: Number(getCpuUsagePercent().toFixed(2)),
        memory: {
          totalBytes: totalMem,
          freeBytes: freeMem,
          usedBytes: usedMem,
          totalHuman: formatBytes(totalMem),
          freeHuman: formatBytes(freeMem),
          usedHuman: formatBytes(usedMem),
          memoryUsagePercent: Number(memoryUsagePercent.toFixed(2)),
        },
        network: getNetworkInterfacesSummary(),
      },
      pingMs: null,
    }

    // Lightweight ping via DNS lookup timing
    try {
      const dns = await import('dns')
      const lookupStart = Date.now()
      await dns.promises.lookup('google.com').catch(() => {})
      payload.pingMs = Date.now() - lookupStart
    } catch (e) {
      payload.pingMs = null
    }

    metrics.recordResponse('/api/status', Date.now() - start)
    try {
      await appendLog({ method: 'GET', path: '/api/status', status: 200, responseTimeMs: Date.now() - start })
    } catch (e) {
      // best-effort
    }
    return NextResponse.json(payload)
  } catch (err: any) {
    metrics.recordResponse('/api/status', Date.now() - start)
    try {
      await appendLog({ method: 'GET', path: '/api/status', status: 500, responseTimeMs: Date.now() - start, error: String(err) })
    } catch (e) {
      // ignore
    }
    return NextResponse.json({ status: false, error: String(err) }, { status: 500 })
  }
}
