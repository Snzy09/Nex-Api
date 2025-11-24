'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';

async function scrapeData(url: string) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });
    const $ = cheerio.load(data);
    const title = $('h1.post-title.entry-title').text().trim();
    const owner = $('.post-author .author-meta span[itemprop="name"]').text().trim();
    const waktu = $('.post-timestamp .published').text().trim();
    const cerita = $('.superarticle p').text().trim();
    const thumbnail = $('.superarticle img').attr('src');

    return { title, owner, waktu, cerita, thumbnail };
  } catch (error) {
    return null;
  }
}

async function handleRequest(req: NextRequest, body?: any) {
  const url = (body?.url ?? req.nextUrl.searchParams.get('url'))?.toString()?.trim();

  if (!url) {
    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: 'Parameter "url" is required.',
      },
      { status: 400 }
    );
  }

  // Validate URL is from 1000dongeng.com
  if (!url.includes('1000dongeng.com')) {
    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: 'URL must be from 1000dongeng.com domain.',
      },
      { status: 400 }
    );
  }

  try {
    const result = await scrapeData(url);

    if (!result) {
      return NextResponse.json(
        {
          status: false,
          creator: siteConfig.api.creator,
          message: 'Failed to scrape data from the provided URL.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: true,
        creator: siteConfig.api.creator,
        data: result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Dongeng Scraper Error:', error.message);

    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: 'An error occurred while scraping the dongeng story.',
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
