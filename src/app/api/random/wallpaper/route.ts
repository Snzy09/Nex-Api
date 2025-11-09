
'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';

class Wallpaper {
    private base = 'https://4kwallpapers.com';
    private headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    };

    async main(type = 'home') {
        try {
            let url = this.base;
            switch (type) {
                case 'popular':
                    url += '/most-popular-4k-wallpapers/';
                    break;
                case 'featured':
                    url += '/best-4k-wallpapers/';
                    break;
                case 'random':
                    url += '/random-wallpapers/';
                    break;
                case 'collection':
                    url += '/collections-packs/';
                    break;
                default:
                    url += '/';
                    break;
            }
            const { data } = await axios.get(url, { headers: this.headers });
            const $ = cheerio.load(data);
            const res: any[] = [];
            $('div#pics-list .wallpapers__item').each((i, e) => {
                res.push({
                    thumbnail: $(e).find('img').attr('src'),
                    title: $(e).find('.title2').text().trim(),
                    keywords: $(e).find('meta').attr('content'),
                    url: this.base + $(e).find('a').attr('href')
                });
            });
            return res;
        } catch (e: any) {
            throw new Error(e.message);
        }
    }
}

async function handleRequest(req: NextRequest, body?: any) {
    const type = body?.type?.trim() || req.nextUrl.searchParams.get('type')?.trim() || 'home';

    try {
        const wallpaper = new Wallpaper();
        const result = await wallpaper.main(type);
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Wallpaper error:', err);
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
