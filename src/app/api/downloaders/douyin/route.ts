'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';

async function douyinDl(url: string) {
  if (!url) {
    throw new Error('Douyin URL parameter is required');
  }
  try {
    let form = new URLSearchParams({ 'url': url });
    let { data } = await axios.post(`https://savedouyin.net/proxy.php`, form, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'origin': 'https://savedouyin.net',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
      }
    });

    if (!data.api || !data.api.mediaItems || data.api.mediaItems.length < 2) {
        throw new Error('Failed to retrieve valid media items from the external API.');
    }

    let mp4req = await axios.get(data.api.mediaItems[0].mediaUrl);
    let mp3req = await axios.get(data.api.mediaItems[1].mediaUrl);

    return {
      info: data.api,
      media: {
        video: mp4req.data.fileUrl,
        audio: mp3req.data.fileUrl
      }
    };
  } catch (e: any) {
    console.error('Douyin DL error:', e);
    throw new Error(e.response?.data?.message || e.message || 'Failed to download from Douyin.');
  }
}

async function handleRequest(req: NextRequest, body?: any) {
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'A valid Douyin URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await douyinDl(url);
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
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
