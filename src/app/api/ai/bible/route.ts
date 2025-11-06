'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';

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
    try {
        const body = await req.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Text parameter is required.' }, { status: 400 });
        }
        
        const bible = new BibleAI();
        bible.generateSession();
        const result = await bible.chat(text);
        
        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });

    } catch (error: any) {
        console.error('Bible AI error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    return handleRequest(req);
}
