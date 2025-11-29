'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function infoClub(url: string) {
    if (!url) {
        throw new Error('URL parameter is required.');
    }
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let matchHistory: any[] = [];
    $('#match-history').find('tr').each((i, e) => {
        matchHistory.push({
            date: $(e).find('.color-primary').text().trim(),
            versus: `${$(e).find('.team-short-name').first().text().trim()} vs ${$(e).find('.team-short-name').last().text().trim()}`,
            score: $(e).find('a:has(.label)').text().trim(),
            tournament: $(e).find('a:not(:has(.label))').text().trim(),
        });
    });
    let players: any[] = [];
    $('#players-list').find('tbody').find('tr').each((i, e) => {
        players.push({
            name: $(e).find('.color-primary').text().trim(),
            number: $(e).find('td').eq(1).text().trim(),
            position: $(e).find('td').last().text().trim(),
        });
    });
    return {
        name: $('.profile-header-title').find('h1').text().trim(),
        logo: $('.profile-user').find('.avatar').find('img').attr('src'),
        stadion: $('.profile-header-title').find('p').text().trim(),
        play: $('.widget-four').find('.col-xl-3').eq(0).find('p').text().trim(),
        win: $('.widget-four').find('.col-xl-3').eq(1).find('p').text().trim(),
        draw: $('.widget-four').find('.col-xl-3').eq(2).find('p').text().trim(),
        lose: $('.widget-four').find('.col-xl-3').eq(3).find('p').text().trim(),
        players,
        matchHistory,
    };
}

async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing url' }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await infoClub(url);
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Info Club error:', err);
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
