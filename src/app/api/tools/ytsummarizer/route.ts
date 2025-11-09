
'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';

function generateRandomDeviceHash() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function getRandomOSName() {
    const osNames = [
        'HONOR', 'Samsung', 'Xiaomi', 'OnePlus', 'Huawei',
        'OPPO', 'Vivo', 'Realme', 'Google', 'LG',
        'Sony', 'Motorola', 'Nokia', 'TCL', 'ASUS'
    ];
    return osNames[Math.floor(Math.random() * osNames.length)];
}

function getRandomOSVersion() {
    const versions = ['8', '9', '10', '11', '12', '13', '14'];
    return versions[Math.floor(Math.random() * versions.length)];
}

function getRandomPlatform() {
    const platforms = [1, 2, 3];
    return platforms[Math.floor(Math.random() * platforms.length)];
}

async function ytsummarizer(url: string, { lang = 'id' } = {}) {
    if (!/youtube.com|youtu.be/.test(url)) throw new Error('Invalid youtube url');

    const randomDeviceHash = generateRandomDeviceHash();
    const randomOSName = getRandomOSName();
    const randomOSVersion = getRandomOSVersion();
    const randomPlatform = getRandomPlatform();

    const { data: a } = await axios.post('https://gw.aoscdn.com/base/passport/v2/login/anonymous', {
        brand_id: 29,
        type: 27,
        platform: randomPlatform,
        cli_os: 'web',
        device_hash: randomDeviceHash,
        os_name: randomOSName,
        os_version: randomOSVersion,
        product_id: 343,
        language: 'en'
    }, {
        headers: { 'content-type': 'application/json' }
    });

    const { data: b } = await axios.post('https://gw.aoscdn.com/app/gitmind/v3/utils/youtube-subtitles/overviews?language=en&product_id=343', {
        url: url,
        language: lang,
        deduct_status: 0
    }, {
        headers: {
            authorization: `Bearer ${a.data.api_token}`,
            'content-type': 'application/json'
        }
    });

    let retries = 30; // 30 retries, 1 second each
    while (retries > 0) {
        const { data } = await axios.get(`https://gw.aoscdn.com/app/gitmind/v3/utils/youtube-subtitles/overviews/${b.data.task_id}?language=en&product_id=343`, {
            headers: {
                authorization: `Bearer ${a.data.api_token}`,
                'content-type': 'application/json'
            }
        });
        if (data.data.sum_status === 1) return data.data;
        if (data.data.sum_status === 2) throw new Error('Summarization failed on the external service.');
        
        await new Promise(res => setTimeout(res, 1000));
        retries--;
    }
    
    throw new Error('Summarization timed out.');
}


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, lang } = body;

        if (!url) {
            return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'URL parameter is required' }, { status: 400 });
        }
        
        const result = await ytsummarizer(url, { lang });

        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });

    } catch (err: any) {
        console.error('YouTube Summarizer error:', err);
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
