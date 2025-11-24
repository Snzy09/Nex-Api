'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';

async function handleRequest(req: NextRequest, body?: any) {
  const text = (body?.text ?? req.nextUrl.searchParams.get('text'))?.toString()?.trim();

  if (!text) {
    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: 'Parameter "text" is required.',
      },
      { status: 400 }
    );
  }

  const url = 'https://api.elrayyxml.web.id/api/maker/bratanime';

  console.log(`⏳ Creating Brat Anime for text: "${text}"...`);

  try {
    const response = await axios.get(url, {
      params: { text: text },
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 10000,
    });

    const contentType = response.headers['content-type'];

    if (contentType && contentType.includes('application/json')) {
      const jsonResponse = JSON.parse(response.data.toString());
      return NextResponse.json(
        {
          status: false,
          creator: siteConfig.api.creator,
          message: 'API returned an error.',
          data: jsonResponse,
        },
        { status: 500 }
      );
    }

    const imageBuffer = Buffer.from(response.data, 'binary');
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    return NextResponse.json(
      {
        status: true,
        creator: siteConfig.api.creator,
        data: {
          imageUrl: dataUrl,
          size: imageBuffer.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Failed to request API.');

    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status}`);
      if (error.response?.data) {
        console.error(`Data: ${error.response.data.toString()}`);
      }
      return NextResponse.json(
        {
          status: false,
          creator: siteConfig.api.creator,
          message: `Failed to generate Brat Anime. Status: ${error.response?.status || 'unknown'}`,
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: 'An error occurred while processing your request.',
        error: error.message,
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
