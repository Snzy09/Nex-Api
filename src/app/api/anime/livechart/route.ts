'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function getUpdate(date: string) {
    try {
        const url = `https://www.livechart.me/schedule?date=${date}`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const lc = $('.lc-timetable');
        let result: { day: string; anime: { title: string; time: string; eps: string; }[] }[] = [];
        
        lc.find('.lc-placeholder').remove();
        
        lc.find('.lc-timetable-day').each((i, el) => {
            const dayResult: { day: string; anime: { title: string; time: string; eps: string; }[] } = {
                day: $(el).find('.lc-timetable-day__heading').text().trim(),
                anime: []
            };

            $(el).find('.hidden').remove();
            
            $(el).find('.lc-timetable-timeslot').each((j, anime) => {
                const title = $(anime).find('.lc-tt-anime-title').text().trim();
                const time = $(anime).find('.lc-time').text().trim();
                const eps = $(anime).find('.lc-tt-release-label').text().trim();
                if(title && time && eps) {
                    dayResult.anime.push({ title, time, eps });
                }
            });
            
            if(dayResult.anime.length > 0) {
               result.push(dayResult);
            }
        });
        
        return result;
    } catch (e: any) {
        throw new Error(e.message);
    }
}


async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const defaultDate = new Date().toISOString().split('T')[0];
    const date = body?.date?.trim() || req.nextUrl.searchParams.get('date')?.trim() || defaultDate;

    try {
        const result = await getUpdate(date);
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Livechart error:', err);
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
