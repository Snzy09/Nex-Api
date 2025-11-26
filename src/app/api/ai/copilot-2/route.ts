"use server";

import { NextRequest, NextResponse } from 'next/server';
import Copilot from '@/lib/copilot';
import { siteConfig } from '@/settings/config';

async function handleRequest(req: NextRequest, body?: any) {
  const message = (body?.message ?? req.nextUrl.searchParams.get('message'))?.toString()?.trim();
  // this second endpoint uses a different default model to differentiate the feature
  const model = (body?.model ?? req.nextUrl.searchParams.get('model'))?.toString() ?? 'think-deeper';

  if (!message) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'Parameter "message" is required.' }, { status: 400 });
  }

  try {
    const cp = new Copilot();
    const result = await cp.chat(message, { model });
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: result }, { status: 200 });
  } catch (err: any) {
    console.error('❌ Copilot-2 Error:', err?.message || err);
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'Failed to get response from Copilot-2.', error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleRequest(req, body);
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}
