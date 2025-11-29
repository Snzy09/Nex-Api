'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function fluxAIDescribe(imageUrl: string) {
  if (!imageUrl) {
    throw new Error('Image URL is required.');
  }
  
  const payload = {
    url: imageUrl,
    type: 'simple'
  };

  const headers = { 'Content-Type': 'application/json' };

  try {
    const { data } = await axios.post("https://fluxai.pro/api/prompts/describe", payload, { headers });
    return data;
  } catch (error: any) {
    console.error('Flux AI error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch from Flux AI API.');
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing url' }).catch(()=>{})
      return NextResponse.json({ creator: siteConfig.api.creator, error: 'URL parameter is required.' }, { status: 400 });
    }
        
    const result = await fluxAIDescribe(url);
    const resp = NextResponse.json({ 
      status: true,
      creator: siteConfig.api.creator,
      data: result
    });
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return resp

  } catch (error: any) {
    console.error('Flux AI main error:', error);
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
    return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
