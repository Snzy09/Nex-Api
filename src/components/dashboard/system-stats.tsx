'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Cpu, HardDrive, Wifi, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

// Mock data for system stats
const performanceData = [
  { time: '00:00', requests: 120, responseTime: 245 },
  { time: '04:00', requests: 98, responseTime: 267 },
  { time: '08:00', requests: 245, responseTime: 189 },
  { time: '12:00', requests: 387, responseTime: 156 },
  { time: '16:00', requests: 423, responseTime: 134 },
  { time: '20:00', requests: 298, responseTime: 178 },
];

const cpuData = [
  { time: '00:00', usage: 23 },
  { time: '04:00', usage: 18 },
  { time: '08:00', usage: 45 },
  { time: '12:00', usage: 67 },
  { time: '16:00', usage: 52 },
  { time: '20:00', usage: 34 },
];

const networkData = [
  { time: '00:00', upload: 2.3, download: 15.7 },
  { time: '04:00', upload: 1.8, download: 12.4 },
  { time: '08:00', upload: 4.2, download: 28.9 },
  { time: '12:00', upload: 6.1, download: 42.3 },
  { time: '16:00', upload: 5.8, download: 38.7 },
  { time: '20:00', upload: 3.9, download: 25.1 },
];

const systemMetrics = [
  { name: 'CPU Usage', value: 45, unit: '%', status: 'normal', icon: Cpu },
  { name: 'Memory Usage', value: 67, unit: '%', status: 'warning', icon: HardDrive },
  { name: 'Network I/O', value: 23, unit: 'MB/s', status: 'normal', icon: Wifi },
  { name: 'Active Connections', value: 1247, unit: '', status: 'normal', icon: Activity },
];

const chartConfig = {
  requests: {
    label: 'Requests',
    color: 'hsl(var(--primary))',
  },
  responseTime: {
    label: 'Response Time (ms)',
    color: 'hsl(var(--accent))',
  },
  usage: {
    label: 'CPU Usage (%)',
    color: 'hsl(var(--destructive))',
  },
  upload: {
    label: 'Upload (MB/s)',
    color: 'hsl(var(--primary))',
  },
  download: {
    label: 'Download (MB/s)',
    color: 'hsl(var(--accent))',
  },
};

export function SystemStats() {
  return (
    <div className="space-y-6">
      {/* Performance Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              API Performance
            </CardTitle>
            <CardDescription>Requests and response times over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <AreaChart data={performanceData}>
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stackId="1"
                  stroke="var(--color-requests)"
                  fill="var(--color-requests)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Response Time
            </CardTitle>
            <CardDescription>Average response time in milliseconds</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <LineChart data={performanceData}>
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="var(--color-responseTime)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-responseTime)' }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* CPU and Network Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              CPU Usage
            </CardTitle>
            <CardDescription>CPU utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart data={cpuData}>
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="usage"
                  fill="var(--color-usage)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Network Traffic
            </CardTitle>
            <CardDescription>Upload and download speeds</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <AreaChart data={networkData}>
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="upload"
                  stackId="1"
                  stroke="var(--color-upload)"
                  fill="var(--color-upload)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="download"
                  stackId="2"
                  stroke="var(--color-download)"
                  fill="var(--color-download)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
          <CardDescription>Current system resource usage and performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemMetrics.map((metric) => {
                const Icon = metric.icon;
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'normal': return 'bg-green-500';
                    case 'warning': return 'bg-yellow-500';
                    case 'critical': return 'bg-red-500';
                    default: return 'bg-gray-500';
                  }
                };

                return (
                  <TableRow key={metric.name}>
                    <TableCell className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {metric.name}
                    </TableCell>
                    <TableCell className="font-mono">
                      {metric.value}{metric.unit}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(metric.status)} text-white`}
                      >
                        {metric.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={metric.value} className="w-20" />
                        <span className="text-sm text-muted-foreground">
                          {metric.value}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}