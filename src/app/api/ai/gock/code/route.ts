'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

const GOCK_API_BASE = 'https://ai.gock.net';
const GOCK_HEADERS = {
    'Content-Type': 'application/json',
    'Host': 'ai.gock.net',
    'Origin': 'https://ai.gock.net',
    'Referer': 'https://ai.gock.net/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
};

async function gockCode(prompt: string, model: string = 'google:gemini-2.5-flash') {
    if (!prompt) {
        throw new Error('Prompt is required');
    }
    try {
        const { data } = await axios.post(`${GOCK_API_BASE}/api/html-generator`, {
            "input": prompt,
            "options": {
                "model": model
            }
        }, { headers: GOCK_HEADERS });
        return data;
    } catch (err: any) {
        console.error('Gock AI Code error:', err.response?.data || err.message);
        throw new Error(err.response?.data?.message || err.message || 'Failed to generate code from Gock AI.');
    }
}

export async function POST(req: NextRequest) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    try {
        const body = await req.json();
        const { prompt, model } = body;

        if (!prompt) {
            await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing prompt' }).catch(()=>{})
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Prompt parameter is required.' }, { status: 400 });
        }
        
        const result = await gockCode(prompt, model);
        const resp = NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return resp

    } catch (error: any) {
        console.error('Gock AI Code main error:', error);
        await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
