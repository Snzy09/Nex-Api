'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function handleRequest(req: NextRequest, body?: any) {
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  const imageBase64 = body?.image ?? req.nextUrl.searchParams.get('image');
  const imageUrl = body?.imageUrl ?? req.nextUrl.searchParams.get('imageUrl');

  if (!imageBase64 && !imageUrl) {
    await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing image' }).catch(()=>{})
    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: 'Provide `image` (base64) or `imageUrl` parameter.',
      },
      { status: 400 }
    );
  }

  try {
    let buffer: Buffer;

    if (imageBase64) {
      // remove data url prefix if present
      const cleaned = imageBase64.toString().replace(/^data:\w+\/[a-zA-Z]+;base64,/, '');
      buffer = Buffer.from(cleaned, 'base64');
    } else {
      const resp = await axios.get(imageUrl as string, { responseType: 'arraybuffer', timeout: 15000 });
      buffer = Buffer.from(resp.data);
    }

    const form = new FormData();
    form.append('image', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' } as any);
    form.append('scale', '2');

    const headers = {
      accept: 'application/json',
      'x-client-version': 'web',
      ...form.getHeaders(),
    };

    const response = await axios.post('https://api2.pixelcut.app/image/upscale/v1', form as any, {
      headers,
      maxBodyLength: Infinity,
      timeout: 30000,
    });

    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return NextResponse.json(
      {
        status: true,
        creator: siteConfig.api.creator,
        data: response.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('ImgUpscaler2 error:', error?.message || error);
    if (error.response) {
      await appendLog({ method, path: fullPath, status: error.response.status || 500, responseTimeMs: Date.now() - start, error: String(error.response.data || error.response.statusText) }).catch(()=>{})
      return NextResponse.json(
        {
          status: false,
          creator: siteConfig.api.creator,
          message: `Upscale API error: ${error.response.status}`,
          error: error.response.data || error.response.statusText,
        },
        { status: error.response.status || 500 }
      );
    }

    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: 'Failed to process image.',
        error: error?.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleRequest(req, body);
}
