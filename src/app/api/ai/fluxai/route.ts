'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';

async function fluxAIDescribe(imageUrl: string) {
  if (!imageUrl) {
    throw new Error('Image URL is required.');
  }
  
  const payload = {
    url: imageUrl,
    type: 'simple'
  };

  const headers = { 'Content-Type': 'application/json' };

  try {
    const { data } = await axios.post("https://fluxai.pro/api/prompts/describe", payload, { headers });
    return data;
  } catch (error: any) {
    console.error('Flux AI error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch from Flux AI API.');
  }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'URL parameter is required.' }, { status: 400 });
        }
        
        const result = await fluxAIDescribe(url);
        
        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });

    } catch (error: any) {
        console.error('Flux AI main error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
