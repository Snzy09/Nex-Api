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
  
  extractCookies: function (responseHeaders: any) {
    return responseHeaders["set-cookie"]?.map((cookie: string) => cookie.split(";")[0]).join("; ") || "";
  },

  extractMetadata: function ($: cheerio.CheerioAPI) {
    const metadata: any = {};
  
    $(".file-content").eq(0).each((_, element) => {
      const $element = $(element);
    
      metadata.file_name = $element.find("img").attr("alt");
      metadata.mimetype = $element.find(".list").eq(0).text().trim().split("-")[1]?.trim();
      metadata.upload_date = $element.find(".list").eq(2).text().trim().split(":")[1]?.trim();
      metadata.download_count = $element.find(".list").eq(3).text().trim().split(":")[1]?.trim();
      metadata.author_name = $element.find(".list").eq(1).find("a").text().trim();
    });
  
    return metadata;
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

  download: async function (url: string, resultBuffer = false) {
    try {
      let headers = sfile.createHeaders(url);
      const initialResponse = await sfile.makeRequest(url, { headers });

      const cookies = sfile.extractCookies(initialResponse.headers);
      (headers as any)['Cookie'] = cookies;

      let $ = cheerio.load(initialResponse.data);
      const metadata = sfile.extractMetadata($);

      const downloadUrl = $("#download").attr("href");
      if (!downloadUrl) throw new Error("Download URL not found");

      (headers as any)['Referer'] = downloadUrl;
      const processResponse = await sfile.makeRequest(downloadUrl, { headers });

      const html = processResponse.data;
      $ = cheerio.load(html);

      const scripts = $("script").map((i, el) => $(el).html()).get().join("\n");

      const finalUrlRegex = /https:\\\/\\\/download\d+\.sfile\.mobi\\\/downloadfile\\\/\d+\\\/\d+\\\/[a-z0-9]+\\\/[^\s'"]+\.[a-z0-9]+(\?[^"']+)?/gi;
      const matches = scripts.match(finalUrlRegex);

      if (!matches || !matches.length) throw new Error("Final download link not found in script");

      const finalUrl = matches[0].replace(/\\\//g, '/');

      let download;
      if (resultBuffer) {
        const fileResponse = await sfile.makeRequest(finalUrl, {
          headers,
          responseType: "arraybuffer"
        });
        download = Buffer.from(fileResponse.data);
      } else {
        download = finalUrl;
      }

      return { metadata, download };
    } catch (error: any) {
      throw new Error(`Sfile download failed: ${error.message}`);
    }
  }
};


async function handleRequest(req: NextRequest, body?: any) {
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url || !url.includes('sfile.mobi')) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'A valid sfile.mobi URL parameter is required' }, { status: 400 });
    }

    try {
        const result = await sfile.download(url);
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Sfile DL error:', err);
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
