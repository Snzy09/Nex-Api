'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function searchLyrics(title: string) {
    if (!title) {
        throw new Error('Title parameter is required');
    }
    
    const { data } = await axios.get(`https://lrclib.net/api/search?q=${encodeURIComponent(title)}`, {
        headers: {
            'Referer': `https://lrclib.net/search/${encodeURIComponent(title)}`,
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
    });

    if (!data || data.length === 0) {
        throw new Error('No lyrics found for the given title.');
    }

    const song = data[0];
    const track = song.trackName || 'Unknown Track';
    const artist = song.artistName || 'Unknown Artist';
    const album = song.albumName || 'Unknown Album';
    const duration = song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : 'Unknown Duration';
    
    let plainLyrics = song.plainLyrics || song.syncedLyrics || 'No lyrics available';
    if (plainLyrics) {
        plainLyrics = plainLyrics.replace(/\[.*?\]/g, '').trim();
    }

    return {
        title: `${artist} - ${track}`,
        trackName: track,
        artistName: artist,
        albumName: album,
        duration,
        lyrics: plainLyrics
    };
}


async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const title = body?.title?.trim() || req.nextUrl.searchParams.get('title')?.trim();
    if (!title) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing title' }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Title parameter is required' }, { status: 400 });
    }

    try {
        const result = await searchLyrics(title);
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Lyrics search error:', err);
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
