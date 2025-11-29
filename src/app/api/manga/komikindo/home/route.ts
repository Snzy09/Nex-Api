'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger';

const baseUrl = 'https://komikindo.ch/';

async function getHome() {
    let { data } = await axios.get(baseUrl);
    const $ = cheerio.load(data);
    let result: { popular: any[], newest: any[] } = {
        popular: [],
        newest: []
    };

    $("div.odadingslider > div.animepost").each((i, e) => {
        const title = $(e).find("div.bigor > a").text().trim();
        const url = $(e).find("div.bigor > a").attr('href');
        const img = $(e).find("div.limit > img").attr('src');
        const lastChapter = $(e).find("div.lsch > a").text().trim().replace(/\s+/g, '');
        const uploaded = $(e).find("div.lsch > span.datech").text().trim();

        result.popular.push({
            title,
            url,
            img,
            lastChapter,
            uploaded
        });
    });
    
    $("div.listupd > div.animepost").each((i, e) => {
        const title = $(e).find("div.animepostxx-top-bottom > a").attr("title")?.split('Komik ')[1];
        const url = $(e).find("div.animepostxx-top-bottom > a").attr('href');
        const img = $(e).find("div.limietles > img").attr('src');
        const lastChapter = $(e).find("div.lsch > a").first().text().trim().replace(/\s+/g, '');
        const rating = $(e).find("div.flex-skroep").eq(0).text().trim();
        const type = $(e).find("div.flex-skroep").eq(1).text().trim();
        const views = $(e).find("div.flex-skroep").eq(2).text().trim();
        const status = $(e).find("div.flex-skroep").eq(4).text().trim();

        if (title && url && img) {
            result.newest.push({
                title,
                url,
                img,
                lastChapter,
                rating,
                views,
                type,
                status
            });
        }
    });
    return result;
}

export async function GET(req: NextRequest) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    try {
        const result = await getHome();
        const resp = NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return resp
    } catch (err: any) {
        console.error('Komikindo Home error:', err);
        await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
