import os from 'os';
import { NextResponse } from 'next/server';

function getCpuUsagePercent(): number {
  // Use 1-minute load average normalized by CPU count as an approximation
  const load = os.loadavg()[0];
  const cpus = os.cpus().length || 1;
  const percent = (load / cpus) * 100;
  // clamp
  return Math.max(0, Math.min(100, percent));
}

export async function GET() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const memoryUsage = (usedMem / totalMem) * 100;
    const ramUsedMB = Math.round(usedMem / 1024 / 1024);

    // bandwidth and ping are not directly available from Node standard lib in a portable way.
    // We'll provide simulated values here. For production, integrate a metrics agent
    // (node-exporter, netstat parsing, or in-host agent) and return real network stats.
    const bandwidthDownKB = Math.round(50 + Math.random() * 500); // KB/s
    const bandwidthUpKB = Math.round(20 + Math.random() * 200); // KB/s
    const pingMs = Math.round(10 + Math.random() * 200);

    const cpuUsage = Number(getCpuUsagePercent().toFixed(2));

    const payload = {
      timestamp: Date.now(),
      cpuUsage,
      memoryUsage: Number(memoryUsage.toFixed(2)),
      ramUsedMB,
      bandwidthDownKB,
      bandwidthUpKB,
      pingMs,
    };

    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
