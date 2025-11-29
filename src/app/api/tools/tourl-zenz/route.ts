'use server';

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function uploadToZen(buffer: Buffer, filename: string) {
    const form = new FormData();
    form.append('file', new Blob([buffer]), filename);
    const res = await fetch('https://uploader.zenzxz.dpdns.org/upload', {
        method: 'POST',
        body: form
    });
    const html = await res.text();
    const match = html.match(/href="(https?:\/\/uploader\.zenzxz\.dpdns\.org\/uploads\/[^"]+)"/);
    if (!match) throw new Error('Error getting link from zenzxz');
    return match[1];
}

export async function POST(req: NextRequest) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing file' }).catch(()=>{})
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'File is required.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const resultUrl = await uploadToZen(buffer, file.name);
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: { url: resultUrl }
        });

    } catch (error: any) {
        console.error('Zenz upload error:', error);
        await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
