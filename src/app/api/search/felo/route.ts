'use server';

import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function scrape(query: string) {
  const headers = {
    Accept: '*/*',
    'User-Agent': 'Postify/1.0.0',
    'Content-Encoding': 'gzip, deflate, br, zstd',
    'Content-Type': 'application/json',
  };

  const payload = {
    query,
    search_uuid: Date.now().toString(),
    search_options: { langcode: 'id-MM' },
    search_video: true,
  };

  const request = (badi: string) => {
    const result = { answer: '', source: [] as any[] };
    badi.split('\n').forEach((line) => {
      if (line.startsWith('data:')) {
        try {
          const data = JSON.parse(line.slice(5).trim());
          if (data.data) {
            if (data.data.text)
              result.answer = data.data.text.replace(/\d+/g, '');
            if (data.data.sources) result.source = data.data.sources;
          }
        } catch {}
      }
    });
    return result;
  };

  const res = await axios.post('https://api.felo.ai/search/threads', payload, {
    headers,
    timeout: 30000,
    responseType: 'text',
  });

  return request(res.data);
}

async function handleRequest(req: NextRequest, body?: any) {
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  const query = body?.query?.trim() || req.nextUrl.searchParams.get('query')?.trim();
  if (!query) {
    await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing query' }).catch(()=>{})
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Query parameter is required', code: 400 }, { status: 400 });
  }

  try {
    const result = await scrape(query);
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return NextResponse.json({
      status: true,
      creator: siteConfig.api.creator,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    if (err.isAxiosError && err.code === 'ECONNABORTED') {
      await appendLog({ method, path: fullPath, status: 504, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
      return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: "Request timed out", code: 504 }, { status: 504 });
    }
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error', code: 500 }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    return handleRequest(req);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        return handleRequest(req, body);
    } catch (err) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Invalid JSON body', code: 400 }, { status: 400 });
    }
}
