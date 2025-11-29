'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from "axios";
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger';

const headers = {
    "Content-Type": 'application/json',
    Origin: 'https://tokviewer.net',
    Referer: 'https://tokviewer.net/id',
    "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
};

async function ttStalk(username: string, limit: number = 10) {
    if (!username) {
        throw new Error('TikTok username is required');
    }
    try {
        const userResponse = await axios.post('https://tokviewer.net/api/check-profile', {
            "username": username
        }, {
            headers
        });

        if (userResponse.data.error) {
            throw new Error(userResponse.data.message || 'User not found or failed to fetch profile.');
        }

        const videoResponse = await axios.post('https://tokviewer.net/api/video', {
            "username": username,
            "offset": 0,
            "limit": limit
        }, {
            headers
        });

        return {
            profile: userResponse.data.data,
            videos: videoResponse.data.data
        };
    } catch (err: any) {
        throw new Error(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    }
}

async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const username = body?.username?.trim() || req.nextUrl.searchParams.get('username')?.trim();
    const limitParam = body?.limit || req.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (!username) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing username' }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'TikTok username (username) parameter is required' }, { status: 400 });
    }

    try {
        const result = await ttStalk(username, limit);
        const resp = NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return resp
    } catch (err: any) {
        console.error('TikTok Stalk error:', err);
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
