'use client'
import { useEffect, useRef, useState } from 'react'

type LogEntry = any

export function LogsPanel({ limit = 100 }: { limit?: number }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [requesterIp, setRequesterIp] = useState<string | null>(null)
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
        if (json.requesterIp) setRequesterIp(json.requesterIp)
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
        if (payload.type === 'initial') {
          setLogs(payload.items ?? [])
          if (payload.requesterIp) setRequesterIp(payload.requesterIp)
        } else if (payload.type === 'add') {
          setLogs((prev) => [payload.item, ...prev].slice(0, Math.max(200, limit)))
        }
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
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 200).map((log: any, idx: number) => {
              const isMe = requesterIp && log.ip && requesterIp === log.ip
              return (
                <tr key={idx} className={`border-t ${isMe ? 'bg-yellow-50' : ''}`}>
                  <td className="p-2">{new Date(log.timestamp ?? log.ts ?? Date.now()).toLocaleTimeString()}</td>
                  <td className="p-2 font-mono">{log.status ?? log.code ?? '-'}</td>
                  <td className="p-2 font-mono truncate">{log.path ?? log.request ?? log.url ?? '-'}</td>
                  <td className="p-2 font-mono">{log.ip ?? '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
