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

async function gpt3(message: string) {
  if (!message) {
    throw new Error('Message is required for GPT-3.5');
  }

   const payload = {
      language: "en", // CONSTANTS
      message: message,
      model: "gpt-3.5-turbo"
   }
  
  const { data } = await axios.post("https://theturbochat.com/chat", payload, globalHeaders)
  
  return data.choices;
}

export async function POST(req: NextRequest) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    try {
        const body = await req.json();
        const { message } = body;

        if (!message) {
            await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing message' }).catch(()=>{})
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Message parameter is required.' }, { status: 400 });
        }
        
        const result = await gpt3(message);
        const resp = NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return resp

    } catch (error: any) {
        console.error('Turbo GPT-3.5 error:', error);
        await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
