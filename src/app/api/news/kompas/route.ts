'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger';

async function kompas() {
    let { data } = await axios.get('https://www.kompas.com/');
    const $ = cheerio.load(data);
    let result: { updated: any[], popular: any[] } = {
        updated: [],
        popular: []
    };

    $('.hlItem').each((i, e) => {
        let title = $(e).find('.hlTitle').text().trim();
        let img = $(e).find('img').attr('src') || 'system cant get the image';
        let url = $(e).find('a').attr('href');

        if (title && url) {
            result.updated.push({
                title,
                img,
                url
            });
        }
    });

    $('.mostItem').each((i, e) => {
        let title = $(e).find('h2').text().trim();
        let url = $(e).find('a').attr('href');
        let channel = $(e).find('.mostChannel').text().trim();

        if (title && url) {
            result.popular.push({
                title,
                channel,
                url
            });
        }
    });
    result.popular = result.popular.slice(0, 5);

    return result;
}


async function handleRequest(req: NextRequest) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    try {
        const result = await kompas();
        const resp = NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return resp
    } catch (err: any) {
        console.error('Kompas News error:', err);
        await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    return handleRequest(req);
}

export async function POST(req: NextRequest) {
    return handleRequest(req);
}
