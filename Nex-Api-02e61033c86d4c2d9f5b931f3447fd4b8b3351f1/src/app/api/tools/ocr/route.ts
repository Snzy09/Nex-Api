'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { siteConfig } from '@/settings/config';

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
    try {
        const body = await req.json();
        const { url, lang } = body;

        if (!url) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'URL parameter is required.' }, { status: 400 });
        }
        
        const result = await ocr(url, lang);
        
        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });

    } catch (error: any) {
        console.error('OCR error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
