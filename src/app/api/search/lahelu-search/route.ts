"use server";

import { NextRequest, NextResponse } from 'next/server';
import { laheluSearch } from '@/lib/lahelu';
import { siteConfig } from '@/settings/config';

async function handleRequest(req: NextRequest, body?: any) {
  const query = (body?.query ?? req.nextUrl.searchParams.get('query'))?.toString()?.trim();
  const cursorRaw = (body?.cursor ?? req.nextUrl.searchParams.get('cursor'))?.toString();
  const cursor = cursorRaw ? parseInt(cursorRaw, 10) || 0 : 0;

  if (!query) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'Parameter "query" is required.' }, { status: 400 });
  }

  try {
    const data = await laheluSearch(query, cursor);
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data }, { status: 200 });
  } catch (err: any) {
    console.error('❌ Lahelu Search Error:', err.message);
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'Failed to fetch Lahelu search results.', error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleRequest(req, body);
}
