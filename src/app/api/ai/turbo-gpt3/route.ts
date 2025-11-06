'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from "axios";
import { siteConfig } from '@/settings/config';

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
    try {
        const body = await req.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Message parameter is required.' }, { status: 400 });
        }
        
        const result = await gpt3(message);
        
        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });

    } catch (error: any) {
        console.error('Turbo GPT-3.5 error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
