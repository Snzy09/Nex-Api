"use server";

import { NextRequest, NextResponse } from 'next/server';
import UnrestrictedAI from '@/lib/unrestrictedai';
import { appendLog } from '@/lib/filelogger';
import { siteConfig } from '@/settings/config';

async function handleRequest(req: NextRequest, body?: any) {
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  const prompt = (body?.prompt ?? req.nextUrl.searchParams.get('prompt'))?.toString()?.trim();
  const style = (body?.style ?? req.nextUrl.searchParams.get('style'))?.toString()?.trim() ?? 'anime';

  if (!prompt) {
    await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing prompt' }).catch(()=>{})
    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: 'Parameter "prompt" is required.',
      },
      { status: 400 }
    );
  }

  try {
    const ai = new UnrestrictedAI();
    const imageUrl = await ai.generate(prompt, style);

    const resp = NextResponse.json(
      {
        status: true,
        creator: siteConfig.api.creator,
        data: {
          prompt,
          style,
          url: imageUrl,
        },
      },
      { status: 200 }
    );
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return resp
  } catch (error: any) {
    console.error('❌ UnrestrictedAI Error:', error.message);
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: 'Failed to generate image.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleRequest(req, body);
}
