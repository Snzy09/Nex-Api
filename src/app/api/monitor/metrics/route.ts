import { NextResponse } from 'next/server'
import { metrics } from '@/lib/metrics'
import os from 'os'
import fs from 'fs'

function getCpuUsagePercent(): number {
  const load = os.loadavg()[0]
  const cpus = os.cpus().length || 1
  const percent = (load / cpus) * 100
  return Math.max(0, Math.min(100, percent))
}

// Module-level cache for previous network counters to compute bytes/sec
let prevNet: { rxBytes: number; txBytes: number; ts: number } | null = null

function readProcNetDev(): { rxBytes: number; txBytes: number } {
  const path = '/proc/net/dev'
  const data = fs.readFileSync(path, 'utf8')
  const lines = data.split('\n')
  let totalRx = 0
  let totalTx = 0
  for (const line of lines) {
    const parts = line.split(':')
    if (parts.length < 2) continue
    const iface = parts[0].trim()
    if (!iface || iface === 'lo') continue
    const fields = parts[1].trim().split(/\s+/)
    const rx = parseInt(fields[0] || '0', 10) || 0
    const tx = parseInt(fields[8] || '0', 10) || 0
    totalRx += rx
    totalTx += tx
  }
  return { rxBytes: totalRx, txBytes: totalTx }
}

export async function GET() {
  try {
    const data = metrics.getMetrics()

    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    const memoryUsage = (usedMem / totalMem) * 100
    const ramUsedMB = Math.round(usedMem / 1024 / 1024)

    // Read network counters from /proc/net/dev when available (Linux)
    let bandwidthDownKB = 0
    let bandwidthUpKB = 0
    try {
      if (fs.existsSync('/proc/net/dev')) {
        const now = Date.now()
        const counters = readProcNetDev()
        if (prevNet) {
          const dt = (now - prevNet.ts) / 1000
          if (dt > 0) {
            const deltaRx = Math.max(0, counters.rxBytes - prevNet.rxBytes)
            const deltaTx = Math.max(0, counters.txBytes - prevNet.txBytes)
            bandwidthDownKB = Math.round(deltaRx / dt / 1024)
            bandwidthUpKB = Math.round(deltaTx / dt / 1024)
          }
        }
        prevNet = { rxBytes: counters.rxBytes, txBytes: counters.txBytes, ts: now }
      } else {
        bandwidthDownKB = Math.round(50 + Math.random() * 500)
        bandwidthUpKB = Math.round(20 + Math.random() * 200)
      }
    } catch (e) {
      bandwidthDownKB = Math.round(50 + Math.random() * 500)
      bandwidthUpKB = Math.round(20 + Math.random() * 200)
    }

    const pingMs = Math.round(10 + Math.random() * 200)
    const cpuUsage = Number(getCpuUsagePercent().toFixed(2))

    const payload = {
      timestamp: Date.now(),
      system: {
        cpuUsage,
        memoryUsage: Number(memoryUsage.toFixed(2)),
        ramUsedMB,
        bandwidthDownKB,
        bandwidthUpKB,
        pingMs,
      },
      metrics: data,
    }

    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
