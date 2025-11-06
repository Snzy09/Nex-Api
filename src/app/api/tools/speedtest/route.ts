'use server';

import { NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';

async function runSpeedTest() {
  const startTime = performance.now();
  let uploadSpeed = 0;
  let ping = 0;
  let networkInfo = { location: 'N/A', org: 'N/A' };

  try {
    const url = 'https://speed.cloudflare.com/__up';
    // Using a smaller payload to reduce server load and improve response time. 
    // The original 10MB payload might cause timeouts or performance issues on the server.
    const data = '0'.repeat(5 * 1024 * 1024); // 5MB
    const response = await axios.post(url, data, {
      headers: { 'Content-Length': data.length },
      timeout: 30000
    });
    const duration = (performance.now() - startTime) / 1000;
    if (response.status === 200) {
      uploadSpeed = data.length / (duration || 1);
    }
  } catch (e: any) {
    // Gracefully handle upload test failure without stopping the entire function
    console.error(`Upload test failed: ${e.message}`);
  }

  try {
    const start = performance.now();
    await axios.get('https://www.google.com', { timeout: 10000 });
    ping = Math.round(performance.now() - start);
  } catch {
    ping = 0;
  }

  try {
    const response = await axios.get('https://ipinfo.io/json', { timeout: 10000 });
    if (response.status === 200) {
      const data = response.data;
      networkInfo.location = `${data.city || 'N/A'}, ${data.country || 'N/A'}`;
      networkInfo.org = (data.org || 'N/A').replace(/^AS\d+\s/, '');
    }
  } catch {
    networkInfo = { location: 'N/A', org: 'N/A' };
  }

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec <= 0) return '0 Mbps';
    const mbits = (bytesPerSec * 8) / (1024 * 1024);
    return mbits >= 1 ? `${mbits.toFixed(1)} Mbps` : `${(mbits * 1000).toFixed(1)} Kbps`;
  };

  return {
    upload: formatSpeed(uploadSpeed),
    ping: `${ping} ms`,
    server: networkInfo.location,
    provider: networkInfo.org,
    duration: `${((performance.now() - startTime) / 1000).toFixed(1)} sec`,
    time: new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(',', '')
  };
}

export async function GET() {
    try {
        const result = await runSpeedTest();
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error('Speed test error:', err);
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
