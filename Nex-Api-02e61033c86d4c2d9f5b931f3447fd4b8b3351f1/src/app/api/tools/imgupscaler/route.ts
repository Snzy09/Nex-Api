'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { siteConfig } from '@/settings/config';

const availableScaleRatio = [2, 4];

const imgupscale = {
  req: async (imagePath: string, scaleRatio: number) => {
    const form = new FormData();
    form.append('myfile', fs.createReadStream(imagePath));
    form.append('scaleRadio', scaleRatio.toString());

    const response = await axios.request({
      method: 'POST',
      url: 'https://get1.imglarger.com/api/UpscalerNew/UploadNew',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'origin': 'https://imgupscaler.com',
        'referer': 'https://imgupscaler.com/',
        ...form.getHeaders()
      },
      data: form
    });

    return response.data;
  },

  cek: async (code: string, scaleRatio: number) => {
    const response = await axios.request({
      method: 'POST',
      url: 'https://get1.imglarger.com/api/UpscalerNew/CheckStatusNew',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'origin': 'https://imgupscaler.com',
        'referer': 'https://imgupscaler.com/'
      },
      data: JSON.stringify({ code, scaleRadio: scaleRatio })
    });

    return response.data;
  },

  upscale: async (imagePath: string, scaleRatio: number, maxRetries = 30, retryDelay = 2000) => {
    const uploadResult = await imgupscale.req(imagePath, scaleRatio);
    if (uploadResult.code !== 200) {
      throw new Error(`Upload failed : ${uploadResult.msg}`);
    }

    const { code } = uploadResult.data;
    for (let i = 0; i < maxRetries; i++) {
      const statusResult = await imgupscale.cek(code, scaleRatio);

      if (statusResult.code === 200 && statusResult.data.status === 'success') {
        return {
          success: true,
          downloadUrls: statusResult.data.downloadUrls
        };
      }

      if (statusResult.data.status === 'error') {
        throw new Error('Processing failed on server');
      }

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    throw new Error('Processing timeout - maximum retries exceeded');
  }
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get('image') as File | null;
        const scale = formData.get('scale') as string | null;

        if (!imageFile) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Image file is required.' }, { status: 400 });
        }

        const scaleRatio = parseInt(scale || '2', 10);
        if (!availableScaleRatio.includes(scaleRatio)) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: 'Invalid scale ratio. Available ratios: 2, 4' }, { status: 400 });
        }
        
        const tempDir = os.tmpdir();
        const tempFileName = `upload_${Date.now()}_${imageFile.name}`;
        const tempFilePath = path.join(tempDir, tempFileName);

        const buffer = Buffer.from(await imageFile.arrayBuffer());
        await fs.promises.writeFile(tempFilePath, buffer);

        try {
            const result = await imgupscale.upscale(tempFilePath, scaleRatio);
            return NextResponse.json({ creator: siteConfig.api.creator, ...result });
        } finally {
            // Clean up the temporary file
            await fs.promises.unlink(tempFilePath);
        }

    } catch (error: any) {
        console.error('Image upscaling error:', error);
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
