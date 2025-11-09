
'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';

const baseUrl = 'https://cookpad.com';

async function resep(q: string) {
  if (!q) {
    throw new Error('Query parameter is required.');
  }

  const { data } = await axios.get(`${baseUrl}/id/cari/${q}`);
  const $ = cheerio.load(data);
  const result: any[] = [];

  $("ul#search-recipes-list > li").each((i, e) => {
    const title = $(e).find("h2.text-cookpad-12 > a.block-link__main").text().trim();
    const time = $(e).find("li.inline > span.mise-icon-text").first().text().trim();
    const url = baseUrl + $(e).find("a.block-link__main").attr("href");
    const ingredients = $(e).find("div[data-ingredients-highlighter-target='ingredients']").text().trim();
    const creator = $(e).find("span.break-all").text().trim();
    const creatorImage = $(e).find("picture > .rounded-full").attr("src");

    result.push({
      title,
      time,
      url,
      ingredients,
      creator,
      creatorImage,
    });
  });
  
  const res = result.filter(item => item.creatorImage !== undefined);
  return res;
}

async function handleRequest(req: NextRequest, body?: any) {
    const query = body?.query?.trim() || req.nextUrl.searchParams.get('query')?.trim();
    if (!query) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Query parameter is required' }, { status: 400 });
    }

    try {
        const result = await resep(query);
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Cookpad Recipe Search error:', err);
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
