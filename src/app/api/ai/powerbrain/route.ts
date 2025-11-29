'use server';

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger';

async function powerbrainAI(text: string) {
  if (!text) {
    throw new Error('Text parameter is required.');
  }
  
  const response = await fetch("https://powerbrainai.com/chat.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `message=${encodeURIComponent(text)}&messageCount=1`,
  });

  if (!response.ok) {
    throw new Error(`Powerbrain AI request failed with status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export async function POST(req: NextRequest) {
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing text' }).catch(()=>{})
      return NextResponse.json({ creator: siteConfig.api.creator, error: 'Text parameter is required.' }, { status: 400 });
    }
        
    const result = await powerbrainAI(text);
    const resp = NextResponse.json({ 
      status: true,
      creator: siteConfig.api.creator,
      data: result
    });
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return resp

  } catch (error: any) {
    console.error('Powerbrain AI error:', error);
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
    return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
