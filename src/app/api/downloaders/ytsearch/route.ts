'use server';

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/settings/config';

// Basic YouTube search scraping - extracts videoId and title from page HTML
async function searchYouTube(query: string, limit = 8) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`YouTube search failed: ${res.status}`);
  const html = await res.text();

  // Try to find initial data JSON
  const initialDataMatch = html.match(/var ytInitialData = (\{[\s\S]*?\});/) || html.match(/window\["ytInitialData"\] = (\{[\s\S]*?\});/);
  let items: any[] = [];

  if (initialDataMatch) {
    try {
      const json = JSON.parse(initialDataMatch[1]);
      const contents = json?.contents || json?.contents?.twoColumnSearchResultsRenderer?.primaryContents;
      // fallback deep walk to find videoRenderer nodes
      const renderers = JSON.stringify(json).match(/"videoRenderer":\{[\s\S]*?\}\}/g) || [];
      for (const r of renderers.slice(0, limit)) {
        const idMatch = r.match(/"videoId":"([^"]+)"/);
        const titleMatch = r.match(/"title":\{\"runs\":\[\{\"text\":\"([^\"]+)\"/);
        if (idMatch) {
          items.push({ videoId: idMatch[1], title: titleMatch ? titleMatch[1] : null });
        }
      }
    } catch (e) {
      // fallthrough to regex parsing
    }
  }

  if (items.length === 0) {
    // fallback simple regex parse
    const idMatches = Array.from(html.matchAll(/"videoId":"([^"]+)"/g)).map(m => m[1]);
    const unique = Array.from(new Set(idMatches)).slice(0, limit);
    items = unique.map(id => ({ videoId: id, title: null }));
  }

  return items;
}

async function handleRequest(req: NextRequest, body?: any) {
  const query = (body?.query ?? req.nextUrl.searchParams.get('query'))?.toString();
  const limit = Number((body?.limit ?? req.nextUrl.searchParams.get('limit')) ?? 8);

  if (!query) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'Parameter "query" is required.' }, { status: 400 });
  }

  try {
    const results = await searchYouTube(query, limit);
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: { query, results } }, { status: 200 });
  } catch (err: any) {
    console.error('YT Search error:', err?.message || err);
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'Failed to search YouTube.', error: err?.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleRequest(req, body);
}
