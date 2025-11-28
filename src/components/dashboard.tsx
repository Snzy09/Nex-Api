'use client';
import { apiEndpoints } from "@/settings/config";
import { TypingText } from "./dashboard/typing-text";
import { InfoCard } from "./dashboard/info-card";
import { Database, List, Cpu, Server, Wifi, Activity, Zap, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';

type MetricSample = {
    timestamp: number;
    cpuUsage: number; // percent
    memoryUsage: number; // percent
    ramUsedMB: number;
    bandwidthDownKB: number;
    bandwidthUpKB: number;
    pingMs: number;
};

function useServerMetrics(pollInterval = 3000) {
    const [current, setCurrent] = useState<MetricSample | null>(null);
    const [history, setHistory] = useState<MetricSample[]>([]);
    const [rawMetrics, setRawMetrics] = useState<any>(null);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;

        const fetchMetrics = async () => {
            try {
                const res = await fetch('/api/monitor/metrics');
                if (!res.ok) return;
                const json = await res.json();
                // expect server to return MetricSample-shaped object
                // Normalize server response: some endpoints return a flat shape
                // while others return { system: { ... } }. Provide numeric defaults
                const cpu = Number(json.cpuUsage ?? json.system?.cpuUsage ?? 0);
                const memory = Number(json.memoryUsage ?? json.system?.memoryUsage ?? 0);
                const ramUsed = Number(json.ramUsedMB ?? json.system?.ramUsedMB ?? 0);
                const down = Number(json.bandwidthDownKB ?? json.system?.bandwidthDownKB ?? 0);
                const up = Number(json.bandwidthUpKB ?? json.system?.bandwidthUpKB ?? 0);
                const ping = Number(json.pingMs ?? json.system?.pingMs ?? 0);

                const sample: MetricSample = {
                    timestamp: Number(json.timestamp ?? Date.now()),
                    cpuUsage: Number.isFinite(cpu) ? cpu : 0,
                    memoryUsage: Number.isFinite(memory) ? memory : 0,
                    ramUsedMB: Number.isFinite(ramUsed) ? ramUsed : 0,
                    bandwidthDownKB: Number.isFinite(down) ? down : 0,
                    bandwidthUpKB: Number.isFinite(up) ? up : 0,
                    pingMs: Number.isFinite(ping) ? ping : 0,
                };
                if (!mounted.current) return;
                setCurrent(sample);
                setRawMetrics(json);
                setHistory((prev) => {
                    const next = [...prev, sample];
                    // keep last 30 samples (~90s if pollInterval=3s)
                    return next.slice(-30);
                });
            } catch (e) {
                // silently ignore
            }
        };

        fetchMetrics();
        const id = setInterval(fetchMetrics, pollInterval);
        return () => {
            mounted.current = false;
            clearInterval(id);
        };
    }, [pollInterval]);

    return { current, history, rawMetrics };
}


export function Dashboard() {
    const totalCategories = Object.keys(apiEndpoints).length;
    const totalEndpoints = Object.values(apiEndpoints).reduce((acc, category) => acc + category.endpoints.length, 0);

    const { current, history, rawMetrics } = useServerMetrics(3000 as any);

    const recentLogs = rawMetrics?.metrics?.recentLogs ?? [];
    const ipCounts = rawMetrics?.metrics?.ipCounts ?? {};

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nex Api 〽️</h1>
                    <TypingText />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="card p-4 bg-card rounded-md">
                    <h3 className="text-sm font-medium mb-2">Recent API Requests</h3>
                    <div className="overflow-auto max-h-64">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-muted-foreground">
                                    <th className="p-2">Time</th>
                                    <th className="p-2">Method</th>
                                    <th className="p-2">Path</th>
                                    <th className="p-2">IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLogs.slice(0, 50).map((log: any, idx: number) => (
                                    <tr key={idx} className="border-t">
                                        <td className="p-2">{new Date(log.ts).toLocaleTimeString()}</td>
                                        <td className="p-2 font-mono">{log.method}</td>
                                        <td className="p-2 font-mono truncate">{log.path}</td>
                                        <td className="p-2 font-mono">{log.ip}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card p-4 bg-card rounded-md">
                    <h3 className="text-sm font-medium mb-2">Top Requesters (IPs)</h3>
                    <div className="space-y-2">
                        {Object.entries(ipCounts).sort((a: any, b: any) => (b[1] as number) - (a[1] as number)).slice(0, 20).map(([ip, cnt]: any) => (
                            <div key={ip} className="flex items-center justify-between p-2 border rounded">
                                <div className="font-mono truncate">{ip}</div>
                                <div className="text-sm font-semibold">{cnt}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoCard
                    title="Total Categories"
                    icon={Database}
                    content={<div className="text-2xl font-bold">{totalCategories}</div>}
                />
                <InfoCard
                    title="Total Features"
                    icon={List}
                    content={<div className="text-2xl font-bold">{totalEndpoints}</div>}
                />
                {/* Server metrics quick cards */}
                <InfoCard
                    title="CPU Usage"
                    icon={Cpu}
                    content={<div className="text-2xl font-bold">{current ? `${current.cpuUsage.toFixed(1)}%` : '—'}</div>}
                />
                <InfoCard
                    title="Memory Usage"
                    icon={Server}
                    content={<div className="text-2xl font-bold">{current ? `${current.memoryUsage.toFixed(1)}%` : '—'}</div>}
                />
                <InfoCard
                    title="Bandwidth Down"
                    icon={Wifi}
                    content={<div className="text-2xl font-bold">{current ? `${current.bandwidthDownKB.toFixed(0)} KB/s` : '—'}</div>}
                />
                <InfoCard
                    title="Ping"
                    icon={Clock}
                    content={<div className="text-2xl font-bold">{current ? `${current.pingMs.toFixed(0)} ms` : '—'}</div>}
                />
            </div>

            {/* Charts area */}
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="card p-4 bg-card rounded-md">
                    <h3 className="text-sm font-medium mb-2">CPU & Memory (last samples)</h3>
                    <div style={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer>
                            <LineChart data={history.map(h => ({
                                name: new Date(h.timestamp).toLocaleTimeString(),
                                cpu: h.cpuUsage,
                                memory: h.memoryUsage,
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="cpu" stroke="#8884d8" dot={false} />
                                <Line type="monotone" dataKey="memory" stroke="#82ca9d" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card p-4 bg-card rounded-md">
                    <h3 className="text-sm font-medium mb-2">Network Bandwidth (KB/s)</h3>
                    <div style={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer>
                            <LineChart data={history.map(h => ({
                                name: new Date(h.timestamp).toLocaleTimeString(),
                                down: h.bandwidthDownKB,
                                up: h.bandwidthUpKB,
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="down" stroke="#8884d8" dot={false} />
                                <Line type="monotone" dataKey="up" stroke="#ff7300" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
