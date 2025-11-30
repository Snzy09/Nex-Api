
'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

class Wallpaper {
    private base = 'https://4kwallpapers.com';
    private headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    };

    async download(url: string) {
        if (!url || !url.startsWith(this.base)) {
            throw new Error('A valid 4kwallpapers.com URL is required.');
        }
        try {
            const { data } = await axios.get(url, { headers: this.headers });
            const $ = cheerio.load(data);
            const main = $('#main-pic');
            const right = $('.pic-right div');
            const list = $('#res-list');
            const res: any = {
                title: $('.main-id .selected').text().trim(),
                keywords: $(main).find('meta[itemprop="keywords"]').attr('content'),
                thumbnail: $(main).find('img').attr('src'),
                category: [],
                tags: [],
                image: {
                    desktop: [],
                    mobile: [],
                    tablet: []
                }
            };
            $(right).find('.tags').first().find('a').each((i, e) => res.category.push($(e).text().trim()));
            $(right).find('.tags').eq(1).find('a').each((i, e) => res.tags.push($(e).text().trim()));
            $(list).find('span').eq(0).find('a').each((i, e) => {
                $(e).find('span').remove();
                res.image.desktop.push({
                    res: $(e).text().trim(),
                    url: this.base + $(e).attr('href')
                });
            });
            $(list).find('span').eq(1).find('a').each((i, e) => {
                $(e).find('span').remove();
                res.image.mobile.push({
                    res: $(e).text().trim(),
                    url: this.base + $(e).attr('href')
                });
            });
            $(list).find('span').eq(2).find('a').each((i, e) => {
                $(e).find('span').remove();
                res.image.tablet.push({
                    res: $(e).text().trim(),
                    url: this.base + $(e).attr('href')
                });
            });
            return res;
        } catch (e: any) {
            throw new Error(e.message);
        }
    }
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
        const wallpaper = new Wallpaper();
        const result = await wallpaper.download(url);
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Wallpaper Download error:', err);
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
