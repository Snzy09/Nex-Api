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

async function gockReview(prompt: string, style: string = 'technical', model: string = 'google:gemini-2.5-flash', system: string = '') {
    if (!prompt) {
        throw new Error('Prompt is required');
    }
    try {
        const { data } = await axios.post(`${GOCK_API_BASE}/api/review`, {
            "input": prompt,
            "options": {
                "model": model,
                "style": style,
                "systemPrompt": system
            }
        }, { headers: GOCK_HEADERS });
        return data;
    } catch (err: any) {
        console.error('Gock AI Review error:', err.response?.data || err.message);
        throw new Error(err.response?.data?.message || err.message || 'Failed to review text with Gock AI.');
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt, style, model, system } = body;

        if (!prompt) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Prompt parameter is required.' }, { status: 400 });
        }
        
        const result = await gockReview(prompt, style, model, system);
        
        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });

    } catch (error: any) {
        console.error('Gock AI Review main error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
