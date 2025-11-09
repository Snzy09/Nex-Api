'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';

const GOCK_API_BASE = 'https://ai.gock.net';
const GOCK_HEADERS = {
    'Content-Type': 'application/json',
    'Host': 'ai.gock.net',
    'Origin': 'https://ai.gock.net',
    'Referer': 'https://ai.gock.net/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
};

async function gockPrompt(prompt: string, type: string = 'flux', model: string = 'google:gemini-2.5-flash', number: number = 3) {
    if (!prompt) {
        throw new Error('Prompt is required');
    }

    try {
        const { data } = await axios.post(`${GOCK_API_BASE}/api/flux`, {
            "description": prompt,
            "options": {
                "model": model,
                "numberOfPrompts": number
            },
            "task": type
        }, { headers: GOCK_HEADERS });
        
        const prompts = Array.from(data.matchAll(/<prompt>([\s\S]*?)<\/prompt>/g), (m: any) => m[1].trim());
        return prompts;
    } catch (err: any) {
        console.error('Gock AI Prompt error:', err.response?.data || err.message);
        throw new Error(err.response?.data?.message || err.message || 'Failed to generate prompt from Gock AI.');
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt, type, model, number } = body;

        if (!prompt) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Prompt parameter is required.' }, { status: 400 });
        }
        
        const result = await gockPrompt(prompt, type, model, number ? parseInt(number) : undefined);
        
        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });

    } catch (error: any) {
        console.error('Gock AI Prompt main error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
