'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function tiktokV1(query: string) {
  const encodedParams = new URLSearchParams();
  encodedParams.set('url', query);
  encodedParams.set('hd', '1');

  const { data } = await axios.post('https://tikwm.com/api/', encodedParams, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Cookie: 'current_language=en',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
    }
  });

  return data;
}

async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing url' }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await tiktokV1(url);
        if (result.code !== 0) {
            await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: result.msg || 'external error' }).catch(()=>{})
            return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: result.msg || 'Failed to download TikTok video' }, { status: 400 });
        }
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result.data,
        });
    } catch (err: any) {
        console.error('TikTok v1 error:', err);
        await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error' }, { status: 500 });
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
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Invalid JSON body' }, { status: 400 });
    }
}
