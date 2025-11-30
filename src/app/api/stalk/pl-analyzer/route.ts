'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger';

const headers = {
    origin: 'https://www.gadegetkit.com',
    referer: 'https://www.gadegetkit.com/ai-tools/playlistanalyzer',
    'User-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    'Content-Type': 'application/json',
};

async function analyzePlaylist(url: string) {
    if (!url) {
        throw new Error('Please provide a valid Spotify playlist URL');
    }
     if (!url.includes('spotify.com/playlist/')) {
        throw new Error('Invalid Spotify playlist URL format. Please use a URL like https://open.spotify.com/playlist/...');
    }
    try {
        const { data: authData } = await axios.post('https://www.gadegetkit.com/api/auth/spotify/client-credentials', {}, {
            headers
        });
        
        const access_token = authData.access_token;
        if (!access_token) {
            throw new Error('Failed to obtain access token from the external service.');
        }
        
        const playlistId = new URL(url).pathname.split("/")[2];
        if (!playlistId) {
            throw new Error('Could not extract playlist ID from the URL.');
        }

        const { data } = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}?market=US`, {
            headers: {
                ...headers,
                authorization: `Bearer ${access_token}`,
            }
        });
        return data;
    } catch (e: any) {
        throw new Error('Failed to analyze playlist: ' + (e.response?.data?.error?.message || e.message));
    }
}

async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing url' }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'A valid Spotify playlist URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await analyzePlaylist(url);
        const resp = NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return resp
    } catch (err: any) {
        console.error('Playlist Analyzer error:', err);
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
