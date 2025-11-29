'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger';

async function igStalk(username: string) {
    if (!username) {
        throw new Error('Instagram username is required');
    }

    const { data } = await axios.get(`https://greatfon.io/v/${username}`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
            "priority": "u=0, i",
            "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": '1',
            "authority": "greatfon.io",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
        }
    });

    const $ = cheerio.load(data);

    if ($('h2.text-2xl.font-bold').text().trim() === 'User not found') {
        throw new Error(`User not found: ${username}`);
    }

    let name = $('div.items-top').find('h2').text().trim();
    let profileImg = $('figure').find('img').attr('src');
    let bio = $('div.items-top').find('div.text-sm').text().trim();
    let postValue = $('div.stats').find('.stat').eq(0).find('.stat-value').text().trim();
    let followers = $('div.stats').find('.stat').eq(1).find('.stat-value').text().trim();
    let following = $('div.stats').find('.stat').eq(2).find('.stat-value').text().trim();
    let post: { description: string; image?: string }[] = [];

    $('div.items-center:has(.card)').find('.card').each((i, e) => {
        let descriptionHtml = $(e).find('p').html();
        let description = descriptionHtml ? descriptionHtml.replace(/<br\s*\/?>/g, '\n').trim() : '';
        let image = $(e).find('img').attr('src');

        post.push({
            description,
            image
        });
    });

    return {
        username,
        profileImg,
        name,
        bio,
        postValue,
        followers,
        following,
        post
    };
}


async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const username = body?.username?.trim() || req.nextUrl.searchParams.get('username')?.trim();
    if (!username) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing username' }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Instagram username (username) parameter is required' }, { status: 400 });
    }

    try {
        const result = await igStalk(username);
        const resp = NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return resp
    } catch (err: any) {
        console.error('Instagram Stalk error:', err);
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
