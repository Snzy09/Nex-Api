'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';

async function fetchBratImage(text: string) {
  if (!text) throw new Error('Text parameter is required');

  const url = 'https://api-faa.my.id/faa/brathd';

  const response = await axios.get(url, {
    params: { text },
    responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Nex-Api/1.0)'
    }
  });

  const buffer = Buffer.from(response.data);
  const base64 = buffer.toString('base64');
  // external API returns PNG according to original usage
  const dataUrl = `data:image/png;base64,${base64}`;

  return {
    dataUrl,
    size: buffer.length,
  };
}

async function handleRequest(req: NextRequest, body?: any) {
  const text = (body?.text?.toString?.() ?? req.nextUrl.searchParams.get('text'))?.trim();
  if (!text) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Text parameter is required' }, { status: 400 });
  }

  try {
    const result = await fetchBratImage(text);
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: result });
  } catch (err: any) {
    console.error('Brat tool error:', err);
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
  } catch (err: any) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Invalid JSON body' }, { status: 400 });
  }
}
