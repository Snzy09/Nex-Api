'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';

async function getChapterList(url: string) {
    if (!url) {
        throw new Error('URL parameter is required.');
    }
    let { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let result: { chapter: string, url?: string }[] = [];

    $("#chapter_list").find("ul li").each((i, e) => {
        const chapter = $(e).find(".lchx").text().trim();
        const chapterUrl = $(e).find("a").attr('href');

        result.push({
            chapter,
            url: chapterUrl
        });
    });
    return result;
}

async function handleRequest(req: NextRequest, body?: any) {
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await getChapterList(url);
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Komikindo Chapter List error:', err);
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
