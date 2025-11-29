'use client'
import { useEffect, useRef, useState } from 'react'

type LogEntry = any

export function LogsPanel({ limit = 100 }: { limit?: number }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const load = async () => {
      try {
        const res = await fetch(`/api/logs/file?limit=${limit}`)
        if (!res.ok) return
        const json = await res.json()
        if (!mounted.current) return
        setLogs(json.data ?? [])
      } catch (e) {
        // ignore
      }
    }
    load()

    const es = new EventSource('/api/logs/stream')
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data)
        if (!mounted.current) return
        setLogs((prev) => [payload, ...prev].slice(0, Math.max(200, limit)))
      } catch (e) {
        // ignore
      }
    }
    es.onerror = () => {
      es.close()
    }

    return () => {
      mounted.current = false
      try { es.close() } catch (e) {}
    }
  }, [limit])

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Recent API Requests (file)</h3>
      <div className="overflow-auto max-h-64">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="p-2">Time</th>
              <th className="p-2">Status</th>
              <th className="p-2">Path</th>
              <th className="p-2">IP</th>
              <th className="p-2">Screenshot</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 200).map((log: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{new Date(log.timestamp ?? log.ts ?? Date.now()).toLocaleTimeString()}</td>
                <td className="p-2 font-mono">{log.status ?? log.code ?? '-'}</td>
                <td className="p-2 font-mono truncate">{log.path ?? log.request ?? log.url ?? '-'}</td>
                <td className="p-2 font-mono">{log.ip ?? '-'}</td>
                <td className="p-2">
                  {log.screenshotUrl ? (
                    <img src={log.screenshotUrl} alt="thumb" className="w-12 h-8 object-cover rounded" />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
