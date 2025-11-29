'use server';

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function mediafireDl(url: string) {
    if (!/mediafire\.com/.test(url)) {
        throw new Error('Invalid Mediafire URL provided.');
    }

    const { data: html } = await axios.get(url, {
        headers: {
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
    });
    
    const $ = cheerio.load(html);

    const downloadLink = $('#downloadButton').attr('href');
    if (!downloadLink) {
        throw new Error('Failed to find the download button link.');
    }

    const fileName = $('div.filename').text().trim() || '(no file name)';
    const fileSize = $('ul.details > li:nth-child(1) > span').text().trim() || '(no file size)';
    const uploaded = $('ul.details > li:nth-child(2) > span').text().trim() || '(no date)';
    
    const filetypeSpan = $('div.filetype > span').text();
    const filetypeP = $('div.filetype > p').text();
    const fileType = `${filetypeSpan} ${filetypeP}`.trim() || '(no file type)';

    const titleExt = $('div.description > .subheading').text().trim() || '(no title extension)';
    const descriptionExt = $('div.description > p').text().trim() || '(no about extension)';

    const result = {
        fileName,
        fileSize,
        url: downloadLink,
        uploaded,
        fileType,
        titleExt,
        descriptionExt
    };

    return result;
}

async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing url' }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'A valid Mediafire URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await mediafireDl(url);
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Mediafire DL error:', err);
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
