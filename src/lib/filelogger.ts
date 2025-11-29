import fs from 'fs'
import path from 'path'

const LOG_DIR = path.join(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'access.log')

type LogEntry = Record<string, any>

// ensure directory
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  } catch (e) {
    // ignore
  }
}

// in-memory ring buffer for recent logs
const MAX_BUFFER = 1000
const buffer: LogEntry[] = []
const subscribers = new Set<(entry: LogEntry) => void>()

function pushToBuffer(entry: LogEntry) {
  buffer.unshift(entry)
  if (buffer.length > MAX_BUFFER) buffer.length = MAX_BUFFER
}

export async function appendLog(entry: LogEntry) {
  const ts = new Date().toISOString()
  const e = { timestamp: ts, ...entry }
  pushToBuffer(e)

  const line = JSON.stringify(e) + '\n'
  try {
    await fs.promises.appendFile(LOG_FILE, line, { encoding: 'utf8' })
  } catch (err) {
    // If append fails, still notify subscribers in-memory
  }

  // notify subscribers
  for (const s of Array.from(subscribers)) {
    try {
      s(e)
    } catch (err) {
      // ignore
    }
  }

  return e
}

export function tailLogs(limit = 100) {
  // return from buffer if available
  if (buffer.length) return buffer.slice(0, limit)

  // fallback: read file last lines
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8')
    const lines = content.trim().split('\n').filter(Boolean)
    const last = lines.slice(-limit).reverse().map(l => {
      try { return JSON.parse(l) } catch (e) { return { raw: l } }
    })
    return last
  } catch (err) {
    return []
  }
}

export function subscribeLogs(cb: (entry: LogEntry) => void) {
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}

export default { appendLog, tailLogs, subscribeLogs }
