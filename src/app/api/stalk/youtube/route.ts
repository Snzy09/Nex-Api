'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from "axios";
import { siteConfig } from '@/settings/config';

function checkMonetization(sub?: string, view?: string): boolean {
    const subs = parseInt(sub || '0', 10);
    const views = parseInt(view || '0', 10);
    const watchHours = views * 0.1; // Approximation
    return subs >= 1000 && watchHours >= 4000;
}

async function channelStats(url: string) {
    if (!url) {
        throw new Error("YouTube channel URL is required");
    }

    let channelIdResponse;
    try {
        channelIdResponse = await axios.post(`https://api.evano.com/api/youtube/search`, {
            query: url,
            type: 'url'
        }, {
            headers: {
                "Content-Type": "application/json",
                Origin: "https://evano.com",
                Referer: "https://evano.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
            }
        });
    } catch (err: any) {
        throw new Error(`Failed to get channel ID: ${err.response?.data?.message || err.message}`);
    }
    
    const channelId = channelIdResponse.data?.channelId;
    if (!channelId) {
        throw new Error("Could not find a channel ID for the provided URL.");
    }
    
    let analyticsResponse;
    try {
        analyticsResponse = await axios.get(`https://api.evano.com/api/youtube/channel/${channelId}/analytics`, {
            headers: {
                Origin: "https://evano.com",
                Referer: "https://evano.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
            }
        });
    } catch (err: any) {
        throw new Error(`Failed to get channel analytics: ${err.response?.data?.message || err.message}`);
    }

    const data = analyticsResponse.data;
    if (data && data.channel) {
        data.isMonetized = checkMonetization(data.channel.subscriberCount, data.channel.viewCount);
    }
    
    return data;
}

async function handleRequest(req: NextRequest, body?: any) {
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'YouTube channel URL (url) parameter is required' }, { status: 400 });
    }

    try {
        const result = await channelStats(url);
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Youtube Analyzer error:', err);
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
