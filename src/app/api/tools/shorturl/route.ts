
'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import qs from 'qs';
import zlib from 'zlib';
import { siteConfig } from '@/settings/config';

async function kualatshort(url: string) {
  const res = await axios.post(
    'https://kua.lat/shorten',
    qs.stringify({ url }),
    {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'id-ID,id;q=0.9,en-AU;q=0.8,en;q=0.7,en-US;q=0.6',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://kua.lat',
        'Referer': 'https://kua.lat/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }
  );

  let decoded;
  const encoding = res.headers['content-encoding'];

  if (encoding === 'br') {
    decoded = zlib.brotliDecompressSync(res.data);
  } else if (encoding === 'gzip') {
    decoded = zlib.gunzipSync(res.data);
  } else if (encoding === 'deflate') {
    decoded = zlib.inflateSync(res.data);
  } else {
    decoded = res.data;
  }

  return JSON.parse(decoded.toString());
}

async function handleRequest(req: NextRequest, body?: any) {
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await kualatshort(url);
        if (result.status === 'error') {
            return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: result.message || 'Failed to shorten URL' }, { status: 400 });
        }
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Short URL error:', err);
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
