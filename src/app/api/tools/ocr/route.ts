'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function ocr(url: string, lang: string = "ind") {
  if (!url) {
    throw new Error("Please input an image URL");
  }

  const worker = await createWorker(lang);
  const res = await worker.recognize(url);
  await worker.terminate();

  return {
    text: res.data.text
  };
}

export async function POST(req: NextRequest) {
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  try {
    const body = await req.json();
    const { url, lang } = body;

    if (!url) {
      await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing url' }).catch(()=>{})
      return NextResponse.json({ creator: siteConfig.api.creator, error: 'URL parameter is required.' }, { status: 400 });
    }
        
    const result = await ocr(url, lang);
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return NextResponse.json({ 
      status: true,
      creator: siteConfig.api.creator,
      data: result
    });

  } catch (error: any) {
    console.error('OCR error:', error);
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
    return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
