'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio';
import FormData from 'form-data';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

async function tiktokV2(query: string) {
  const form = new FormData();
  form.append('q', query);

  const { data } = await axios.post('https://savetik.co/api/ajaxSearch', form, {
    headers: {
      ...form.getHeaders(),
      'Accept': '*/*',
      'Origin': 'https://savetik.co',
      'Referer': 'https://savetik.co/en2',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  const rawHtml = data.data;
  if (!rawHtml) {
    throw new Error('Could not retrieve data. The video may be private or the URL is incorrect.');
  }
  
  const $ = load(rawHtml);
  const title = $('.thumbnail .content h3').text().trim();
  const thumbnail = $('.thumbnail .image-tik img').attr('src');
  const video_url = $('video#vid').attr('data-src');

  const slide_images: string[] = [];
  $('.photo-list .download-box li').each((_: any, el: any) => {
    const imgSrc = $(el).find('.download-items__thumb img').attr('src');
    if (imgSrc) slide_images.push(imgSrc);
  });
  
  if (!title && !video_url && slide_images.length === 0) {
      throw new Error('No video or images found. The URL might be invalid or the content is not available.');
  }

  return { title, thumbnail, video_url, slide_images };
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
    const result = await tiktokV2(url);
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return NextResponse.json({
      status: true,
      creator: siteConfig.api.creator,
      data: result,
    });
  } catch (err: any) {
    console.error('TikTok v2 error:', err);
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
