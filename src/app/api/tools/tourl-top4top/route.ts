'use server';

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/settings/config';

async function uploadToTop4Top(buffer: Buffer) {
    const { fileTypeFromBuffer } = await import('file-type');
    const origin = 'https://top4top.io';
    const f = await fileTypeFromBuffer(buffer);
    if (!f) throw new Error('Failed to get file extension/buffer');
    
    const data = new FormData();
    data.append('file_1_', new Blob([buffer]), `zenn?-${Date.now()}.${f.ext}`);
    data.append('submitr', '[ رفع الملفات ]');
    
    const r = await fetch(origin + '/index.php', { method: 'POST', body: data });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}\n${await r.text()}`);
    
    const html = await r.text();
    const matches = html.matchAll(/<input readonly="readonly" class="all_boxes" onclick="this.select\(\);" type="text" value="(.+?)" \/>/g);
    const arr = Array.from(matches);
    const downloadUrl = arr.map(v => v[1]).find(v => v.endsWith(f.ext));
    
    if (!downloadUrl) throw new Error('Error getting Top4Top link');
    return downloadUrl;
}


export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'File is required.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const resultUrl = await uploadToTop4Top(buffer);
        
        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: { url: resultUrl }
        });

    } catch (error: any) {
        console.error('Top4Top upload error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
