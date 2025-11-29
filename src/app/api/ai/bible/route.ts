'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger';

let SESI: number | string;

class BibleAI {
   constructor() {}
   
   generateSession() {
       const ress = Date.now() + Math.floor(Math.random() * 1000)
       SESI = ress
   }
   
   deleteSession() {
       SESI = "";
   }
   
   async chat(text: string) {
     if (!text) {
        throw new Error("Text is required");
     }
     
     const payload = {
        message: text,
        session_id: SESI
     }
     
     const { data } = await axios.post("https://chatbible.io/chat", payload)
     return data
   }
}

async function handleRequest(req: NextRequest) {
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
        
        const bible = new BibleAI();
        bible.generateSession();
        const result = await bible.chat(text);

        const resp = NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return resp

    } catch (error: any) {
        console.error('Bible AI error:', error);
        await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    return handleRequest(req);
}
