'use server';

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/settings/config';

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
    try {
        const body = await req.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Text parameter is required.' }, { status: 400 });
        }
        
        const result = await powerbrainAI(text);
        
        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });

    } catch (error: any) {
        console.error('Powerbrain AI error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
