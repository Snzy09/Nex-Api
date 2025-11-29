
'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger';

class Resep {
  private baseUrl = 'https://mobile.fatsecret.co.id';

  private async request(path: string) {
    const { data } = await axios.get(this.baseUrl + path, {
      headers: {
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
      }
    });
    return data;
  }

  async detail(url: string) {
    if (!url || !url.includes('fatsecret.co.id')) {
        throw new Error('A valid Fatsecret recipe URL is required.');
    }
    const html = await this.request(url.split('fatsecret.co.id')[1]);
    const $ = cheerio.load(html);
    const res: any = {
      title: $('div.page-title > h1').text().trim(),
      image: $('div.recipe-image > img').attr('src'),
      rating: $('div.rating').text().trim(),
      description: $('.recipe-description').text().trim(),
      info: {
        result: $('.recipe-info').find('tr').eq(1).find('td').eq(0).text().trim(),
        timePreparation: $('.recipe-info').find('tr').eq(1).find('td').eq(1).text().trim(),
        timeCooking: $('.recipe-info').find('tr').eq(1).find('td').eq(2).text().trim()
      },
      ingredients: [],
      steps: [],
      nutrition: $('.section:has(h2)').eq(2).find('table').find('td').find('div').eq(0).text().trim() + ' ' + $('.section:has(h2)').eq(2).find('table').find('td').find('div').eq(1).text().trim()
    };
    $('table.recipe-ingredient-list').find('tr').each((i, e) => {
      res.ingredients.push($(e).find('a').text().trim());
    });
    $('div.recipe-steps > table').find('tr').each((i, e) => {
      res.steps.push($(e).find('td').first().text().trim() + ' ' + $(e).find('td').eq(1).text().trim());
    });
    return res;
  }
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
    const resep = new Resep();
    const result = await resep.detail(url);
    const resp = NextResponse.json({
      status: true,
      creator: siteConfig.api.creator,
      data: result,
    });
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return resp
  } catch (err: any) {
    console.error('FatSecret Recipe Detail error:', err);
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
