'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger';

async function getChapter(url: string) {
    if (!url) {
        throw new Error('URL parameter is required.');
    }
    let { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $("div.dtlx").text().trim().split('\n')[1].replace(/^\s+/g, '');
    const nextCh = $("div.nextprev > a[rel='next']").attr('href');
    let result: { title: string, nextCh?: string, image: (string | undefined)[] } = {
        title,
        nextCh,
        image: []
    };

    $("div.chapter-image > div.img-landmine").find("img").each((i, e) => {
        const image = $(e).attr('src');
        result.image.push(image);
    });

    return result;
}

async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing url' }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await getChapter(url);
        const resp = NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return resp
    } catch (err: any) {
        console.error('Komikindo Chapter error:', err);
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
