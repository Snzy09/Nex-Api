'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';

const baseUrl = 'https://komikindo.ch/';

async function getSearch(q: string) {
    if (!q) {
        throw new Error('Query parameter is required.');
    }
    let { data } = await axios.get(`${baseUrl}?s=${q}`);
    const $ = cheerio.load(data);
    let result: any[] = [];

    $("div.film-list > div.animepost").each((i, e) => {
        const title = $(e).find("div.bigors > a").text().trim();
        const url = $(e).find("div.bigors > a").attr('href');
        const img = $(e).find("div.limit > img").attr("src");
        const rating = $(e).find("div.adds > div.rating").text().trim();

        if(title && url && img) {
            result.push({
                title,
                url,
                img,
                rating
            });
        }
    });
    return result;
}

async function handleRequest(req: NextRequest, body?: any) {
    const query = body?.query?.trim() || req.nextUrl.searchParams.get('query')?.trim();
    if (!query) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Query parameter is required' }, { status: 400 });
    }

    try {
        const result = await getSearch(query);
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Komikindo Search error:', err);
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
