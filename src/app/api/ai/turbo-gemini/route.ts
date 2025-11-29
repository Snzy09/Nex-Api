'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from "axios";
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

const globalHeaders = {
   headers: {
      "Origin": "https://theturbochat.com",
      "Referer": "https://theturbochat.com/"
   }
}

async function gemini(prompt: string) {
  if (!prompt) {
    throw new Error('Prompt is required for Gemini');
  }

   const payload = {
      language: "id",
      prompt: prompt
   }
   
   const { data } = await axios.post("https://theturbochat.com/chatgemini", payload, globalHeaders)
   
   return data;
}

export async function POST(req: NextRequest) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing prompt' }).catch(()=>{})
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Prompt parameter is required.' }, { status: 400 });
        }
        
        const result = await gemini(prompt);
        const resp = NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return resp

    } catch (error: any) {
        console.error('Turbo Gemini error:', error);
        await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
