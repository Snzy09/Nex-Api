'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';

async function searchClub(q: string) {
    if (!q) {
        throw new Error('Query parameter is required.');
    }
    const { data } = await axios.get(`https://live.lapangbola.com/teams?q=${q}`);
    const $ = cheerio.load(data);
    const result: any[] = [];
    $('.panel-body').find('.col-lg-3').each((i, e) => {
        result.push({
            name: $(e).find('h5').text().trim(),
            logo: $(e).find('.avatar').find('img').attr('src'),
            stadion: $(e).find('span').text().trim(),
            url: 'https://live.lapangbola.com' + $(e).find('.panel-body').find('a').attr('href'),
        });
    });
    return result;
}

async function handleRequest(req: NextRequest, body?: any) {
    const query = body?.query?.trim() || req.nextUrl.searchParams.get('query')?.trim();
    if (!query) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Query parameter is required' }, { status: 400 });
    }

    try {
        const result = await searchClub(query);
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Search Club error:', err);
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
