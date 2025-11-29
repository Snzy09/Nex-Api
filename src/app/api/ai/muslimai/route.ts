'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger';

async function muslimai(query: string) {
    if (!query) {
        throw new Error('Query parameter is required.');
    }
    try {
        const { data } = await axios.get(`https://bf31jhdm60.execute-api.eu-west-2.amazonaws.com/dev/ask/${encodeURIComponent(query)}?question=${encodeURIComponent(query)}`, {
            headers: {
                'referer': 'https://www.askmuslim.app/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });
        return data;
    } catch (e: any) {
        console.error('Muslim AI error:', e);
        throw new Error(e.response?.data?.message || e.message || 'Failed to fetch from Muslim AI API.');
    }
}

export async function POST(req: NextRequest) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    try {
        const body = await req.json();
        const { query } = body;

        if (!query) {
            await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing query' }).catch(()=>{})
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Query parameter is required.' }, { status: 400 });
        }
        
        const result = await muslimai(query);
        const resp = NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result
        });
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return resp

    } catch (error: any) {
        console.error('Muslim AI main error:', error);
        await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
