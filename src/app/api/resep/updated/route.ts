
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

  async updated() {
    const html = await this.request(`/Default.aspx?pa=recsh`);
    const $ = cheerio.load(html);
    const result: any[] = [];
    $('table.list').first().find('tr:has(div.next-link)').each((i, e) => {
      result.push({
        title: $(e).find('a.inner-link').text().trim(),
        description: $(e).find('div.small-text').eq(0).text().trim(),
        image: $(e).find('img').attr('src'),
        url: this.baseUrl + $(e).find('a.inner-link').attr('href')
      });
    });
    return result;
  }
}

async function handleRequest(req: NextRequest) {
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  try {
    const resep = new Resep();
    const result = await resep.updated();
    const resp = NextResponse.json({
      status: true,
      creator: siteConfig.api.creator,
      data: result,
    });
    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return resp
  } catch (err: any) {
    console.error('FatSecret Updated Recipes error:', err);
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    return handleRequest(req);
}
