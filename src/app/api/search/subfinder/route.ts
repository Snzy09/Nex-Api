'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

class PentestFinder {
  private ua: string;
  private baseHeaders: Record<string, string>;
  private scanResult: any;

  constructor() {
    this.ua =
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36';
    this.baseHeaders = {
      'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'user-agent': this.ua,
      'accept-language': 'ms-MY,ms;q=0.9,en-US;q=0.8,en;q=0.7',
    };
  }

  async finder(targetUrl: string) {
    try {
      const cookie1 = await this.getInitialCookie();
      const cookie2 = await this.getAuthCookie(cookie1);
      const fullCookie = `${cookie1}; ${cookie2}`;
      const scanId = await this.startScan(fullCookie, targetUrl);
      await this.waitForResult(scanId, fullCookie);
      return this.scanResult;
    } catch (error) {
      throw error;
    }
  }

  private async getInitialCookie() {
    const res = await axios.get('https://pentest-tools.com/information-gathering/find-subdomains-of-domain', {
      headers: {
        ...this.baseHeaders,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'upgrade-insecure-requests': '1',
      },
      timeout: 10000,
    });
    return (res.headers['set-cookie'] || []).map((c: string) => c.split(';')[0]).join('; ');
  }

  private async getAuthCookie(cookie1: string) {
    const res = await axios.post('https://pentest-tools.com/api/auth/token', '', {
      headers: {
        ...this.baseHeaders,
        cookie: cookie1,
        'origin': 'https://pentest-tools.com',
        'accept': '*/*',
        'content-length': '0',
      },
      timeout: 10000,
    });
    return (res.headers['set-cookie'] || []).map((c: string) => c.split(';')[0]).join('; ');
  }

  private async startScan(cookie: string, target: string) {
    const res = await axios.post(
      'https://pentest-tools.com/api/auth/scans',
      {
        redirect_level: 'same_domain',
        target_name: target,
        tool_id: 20,
        tool_params: {
          scan_type: 'light',
          web_details: true,
          whois_info: true,
        },
      },
      {
        headers: {
          ...this.baseHeaders,
          cookie,
          'origin': 'https://pentest-tools.com',
          'content-type': 'application/json',
          'accept': 'application/json',
        },
        timeout: 10000,
      }
    );
    const id = res.data?.data?.created_id;
    if (!id) throw new Error('Scan creation failed.');
    return id;
  }

  private async waitForResult(scanId: string, cookie: string, maxWait: number = 300000) {
    const startTime = Date.now();
    while (true) {
      if (Date.now() - startTime > maxWait) {
        throw new Error('Scan timeout: exceeded 5 minutes.');
      }
      const res = await axios.get(
        `https://pentest-tools.com/api/auth/scans_internal/${scanId}`,
        {
          headers: {
            ...this.baseHeaders,
            cookie,
            'accept': 'application/json',
          },
          timeout: 10000,
        }
      );
      const progress = res.data?.data?.progress;
      this.scanResult = res.data?.data;
      if (progress >= 100) break;
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function handleRequest(req: NextRequest, body?: any) {
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  const target = (body?.target ?? body?.url ?? req.nextUrl.searchParams.get('target') ?? req.nextUrl.searchParams.get('url'))?.toString()?.trim();

  if (!target) {
    await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing target' }).catch(()=>{})
    return NextResponse.json(
      { status: false, creator: siteConfig.api.creator, error: 'Target parameter is required (target or url).' },
      { status: 400 }
    );
  }

  try {
    const pentest = new PentestFinder();
    const result = await pentest.finder(target);
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: result });
  } catch (err: any) {
    console.error('Subfinder error:', err);
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
    return NextResponse.json(
      { status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return handleRequest(req, body);
  } catch (err: any) {
    return NextResponse.json(
      { status: false, creator: siteConfig.api.creator, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}
