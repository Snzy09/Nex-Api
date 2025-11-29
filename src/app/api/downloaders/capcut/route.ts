'use server';

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function capcutDl(url: string) {
    const token = '153d8f770cb72578abab74c2e257fb85a1fd60dcb0330e32706763c90448ae01';
    const hash = Buffer.from(url).toString('base64') + '1037YXBp';

    const body = new URLSearchParams({
        url,
        token,
        hash,
    });

    const response = await fetch('https://anydownloader.com/wp-json/api/download/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://anydownloader.com',
            'Referer': 'https://anydownloader.com/en/online-capcut-video-downloader-without-watermark/',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
        },
        body
    });

    if (!response.ok) {
        throw new Error(`Failed to download Capcut video. Status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.mess || 'Failed to get download links from the external API.');
    }
    
    return result;
}


async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url || !url.includes('capcut.com')) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'invalid or missing capcut url' }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'A valid Capcut URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await capcutDl(url);
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Capcut DL error:', err);
        await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    return handleRequest(req);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        return handleRequest(req, body);
    } catch (err) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Invalid JSON body' }, { status: 400 });
    }
}
