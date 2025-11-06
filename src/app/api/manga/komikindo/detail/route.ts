'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';

async function getDetail(url: string) {
    if (!url) {
        throw new Error('URL parameter is required.');
    }
    let { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $(".infoanime").find(".infox").find("span").eq(0).text().trim().split(':\n')[1].replace(/^\s+/g, '');
    const img = $(".infoanime").find(".thumb > img").attr('src');
    const status = $(".infoanime").find(".infox").find("span").eq(1).text().trim().split(':\n')[1].replace(/^\s+/g, '');
    const creator = $(".infoanime").find(".infox").find("span").eq(2).text().trim().split(':\n')[1].replace(/^\s+/g, '');
    const ilustrator = $(".infoanime").find(".infox").find("span").eq(3).text().trim().split(':\n')[1].replace(/^\s+/g, '');
    const grapich = $(".infoanime").find(".infox").find("span").eq(4).text().trim().split(':\n')[1].replace(/^\s+/g, '');
    const type = $(".infoanime").find(".infox").find("span").eq(5).text().trim().split(':\n')[1].replace(/^\s+/g, '');
    const genre: string[] = [];
    $(".infoanime").find(".genre-info > a").each((i, e) => {
        genre.push($(e).text().trim());
    });
    const lastCh = $("#chapter_list").find("ul li > .lchx").eq(0).text().trim().replace(/[\s\n]+/g, '').split('Chapter')[1];
    const lastUpload = $("#chapter_list").find("ul li > .dt").eq(0).text().trim();
    const sinopsis = $(".tabsarea").find("#sinopsis").find("p").text().trim();

    let result = {
        title,
        img,
        status,
        creator,
        ilustrator,
        grapich,
        type,
        genre,
        lastCh,
        lastUpload,
        sinopsis
    };
    return result;
}

async function handleRequest(req: NextRequest, body?: any) {
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await getDetail(url);
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Komikindo Detail error:', err);
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
