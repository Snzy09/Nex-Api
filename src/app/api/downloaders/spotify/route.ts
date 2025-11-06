'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';
import CryptoJS from 'crypto-js';

async function spotifyTrackDownloader(spotifyTrackUrl: string) {
    const client = axios.create({
        baseURL: 'https://spotisongdownloader.to',
        headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            'cookie': `PHPSESSID=${CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex)}; _ga=GA1.1.2675401.${Math.floor(Date.now() / 1000)}`,
            'referer': 'https://spotisongdownloader.to',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const { data: meta } = await client.get('/api/composer/spotify/xsingle_track.php', {
        params: { url: spotifyTrackUrl }
    });

    await client.post('/track.php');

    const { data: dl } = await client.post('/api/composer/spotify/ssdw23456ytrfds.php', {
        "url": spotifyTrackUrl,
        "zip_download": "false",
        "quality": "m4a"
    });

    const result = { ...dl, ...meta };
    return result;
}

async function handleRequest(req: NextRequest, body?: any) {
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url || !url.includes('spotify.com')) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'A valid Spotify track URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await spotifyTrackDownloader(url);
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Spotify DL error:', err);
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
