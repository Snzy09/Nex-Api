"use server";

import { NextRequest, NextResponse } from 'next/server';
import { laheluRecommendations, LAHELU_FIELDS } from '@/lib/lahelu';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function handleRequest(req: NextRequest, body?: any) {
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  const fieldRaw = (body?.field ?? req.nextUrl.searchParams.get('field'))?.toString();
  const cursorRaw = (body?.cursor ?? req.nextUrl.searchParams.get('cursor'))?.toString();
  const field = fieldRaw ? (parseInt(fieldRaw, 10) as number) : LAHELU_FIELDS.FOR_YOU;
  const cursor = cursorRaw ? parseInt(cursorRaw, 10) || 0 : 0;

  try {
    const data = await laheluRecommendations(field as any, cursor);
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data }, { status: 200 });
  } catch (err: any) {
    console.error('❌ Lahelu Recommendations Error:', err.message);
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'Failed to fetch Lahelu recommendations.', error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleRequest(req, body);
}
