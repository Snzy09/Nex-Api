'use server';

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { siteConfig } from '@/settings/config';

const sfile = {
  createHeaders: function (referer: string) {
    return {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="137", "Google Chrome";v="137"',
      'dnt': '1',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'Referer': referer,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    };
  },
  makeRequest: async function (url: string, options: any) {
    try {
      return await axios.get(url, options);
    } catch (error: any) {
      if (error.response) {
        return error.response;
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  },
  search: async function(query: string, page = 1) {
    try {
      const url = `https://sfile.mobi/search.php?q=${query}&page=${page}`;
      let headers = sfile.createHeaders(url);
      const initialResponse = await sfile.makeRequest(url, { headers });
      let $ = cheerio.load(initialResponse.data);
      let result: { title: string; size: string; link: string; }[] = [];
      $('div.list').each(function() {
        let title = $(this).find('a').text();
        let size = $(this).text().trim().split('(')[1];
        let link = $(this).find('a').attr('href');
        if (link) {
          result.push({ title, size: size ? size.replace(')', '') : 'N/A', link });
        }
      });
      return result;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Request failed with status ${error.response.status}`);
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

async function handleRequest(req: NextRequest, body?: any) {
    const query = body?.query?.trim() || req.nextUrl.searchParams.get('query')?.trim();
    const page = body?.page || req.nextUrl.searchParams.get('page') || '1';

    if (!query) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Query parameter is required' }, { status: 400 });
    }

    try {
        const result = await sfile.search(query, parseInt(page, 10));
        if (result.length === 0) {
            return NextResponse.json({
                status: true,
                creator: siteConfig.api.creator,
                message: 'No results found for the given query.',
                data: [],
            });
        }
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Sfile Search error:', err);
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
