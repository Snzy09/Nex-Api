'use server';

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/settings/config';

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
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'File is required.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const resultUrl = await uploadToZen(buffer, file.name);
        
        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: { url: resultUrl }
        });

    } catch (error: any) {
        console.error('Zenz upload error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
