
'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { siteConfig } from '@/settings/config';

async function findAnime(imagePath: string) {
    const data = new FormData();
    data.append('image', fs.createReadStream(imagePath));

    const api = await axios.post('https://www.animefinder.xyz/api/identify', data, {
        headers: {
            ...data.getHeaders(),
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
            'sec-ch-ua-platform': '"Android"',
            'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
            'dnt': '1',
            'sec-ch-ua-mobile': '?1',
            'origin': 'https://www.animefinder.xyz',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            'referer': 'https://www.animefinder.xyz/',
            'accept-language': 'id,en-US;q=0.9,en;q=0.8,ja;q=0.7',
            'priority': 'u=1, i'
        }
    });

    return api.data;
}


export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get('image') as File | null;

        if (!imageFile) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Image file is required.' }, { status: 400 });
        }
        
        const tempDir = os.tmpdir();
        const tempFileName = `upload_${Date.now()}_${imageFile.name}`;
        const tempFilePath = path.join(tempDir, tempFileName);

        const buffer = Buffer.from(await imageFile.arrayBuffer());
        await fs.promises.writeFile(tempFilePath, buffer);

        try {
            const result = await findAnime(tempFilePath);
            const teks = `*Judul :* ${result.animeTitle || '-'}
*Karakter :* ${result.character || '-'}
*Deskripsi :* ${result.description || '-'}
*Genre :* ${result.genres || '-'}
*Studio :* ${result.productionHouse || '-'}
*Tayang :* ${result.premiereDate || '-'}

*Sinopsis :*
${result.synopsis || '-'}`;

            return NextResponse.json({ 
                creator: siteConfig.api.creator,
                status: true,
                data: result,
                formatted: teks
            });
        } finally {
            // Clean up the temporary file
            await fs.promises.unlink(tempFilePath);
        }

    } catch (error: any) {
        console.error('Anime finder error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, status: false, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
