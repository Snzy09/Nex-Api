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

async function dalle(prompt: string) {
  if (!prompt) {
    throw new Error('Prompt is required for DALL-E');
  }
  
  const payload = {
     language: "en",
     message: prompt
  }
  
  const { data } = await axios.post("https://theturbochat.com/dalle", payload, globalHeaders)
  return data
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Prompt parameter is required.' }, { status: 400 });
        }
        
        const result = await dalle(prompt);
        
        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });

    } catch (error: any) {
        console.error('Turbo DALL-E error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
