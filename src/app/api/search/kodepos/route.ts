'use server';

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/settings/config';

async function cariKodePos(namaDaerah: string) {
  if (!namaDaerah) throw new Error('Nama daerah (query) is required');

  const url = 'https://www.nomor.net/_kodepos.php?_i=cari-kodepos&jobs=' + encodeURIComponent(namaDaerah);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Referer': 'https://www.nomor.net/',
      'accept-encoding': 'gzip, deflate, br'
    }
  });

  const d = await res.text();

  const regex = /class="ktw" title="(?:.+?)" rel="nofollow">(.+?)<\/a>/g;
  const matches = Array.from(d.matchAll(regex));
  const extracted = matches.map(m => m[1].replace(/<\/?.+?>/g, '')).slice(0, 5);

  if (extracted.length !== 5) throw new Error(`Tidak ditemukan hasil untuk pencarian kode pos: ${namaDaerah}`);

  const kodeWilayah = d.match(/class="ktw" rel="nofollow">(.+?)<\/a>/)?.[1] ?? null;

  return {
    kodePost: extracted[0],
    desa: extracted[1],
    kecamatan: extracted[2],
    kabupaten: extracted[3],
    provinsi: extracted[4],
    kodeWilayah
  };
}

async function handleRequest(req: NextRequest, body?: any) {
  const query = (body?.query ?? body?.nama ?? req.nextUrl.searchParams.get('query') ?? req.nextUrl.searchParams.get('nama'))?.toString()?.trim();
  if (!query) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Query parameter is required (query or nama).' }, { status: 400 });
  }

  try {
    const result = await cariKodePos(query);
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: result });
  } catch (err: any) {
    console.error('Kodepos search error:', err);
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
  } catch (err: any) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Invalid JSON body' }, { status: 400 });
  }
}
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/settings/config';

async function cariKodePost(namaDaerah: string) {
    if (!namaDaerah) {
        throw new Error('A location name is required.');
    }
    
    const response = await fetch("https://www.nomor.net/_kodepos.php?_i=cari-kodepos&jobs=" + encodeURIComponent(namaDaerah), {
        headers: {
            "Referer": "https://www.nomor.net/",
            "accept-encoding": "gzip, deflate, br"
        },
        method: "POST"
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch data from nomor.net. Status: ${response.status}`);
    }

    const htmlText = await response.text();
    const matches = htmlText.matchAll(/class="ktw" title="(?:.+?)" rel="nofollow">(.+?)<\/a>/g);
    const allMatches = Array.from(matches);
    const extractedData = allMatches.map(match => match[1].replace(/<\/?b>/g, '')).slice(0, 5);

    if (extractedData.length < 5) {
        throw new Error(`No results found for the postal code search: ${namaDaerah}`);
    }
    
    const kodeWilayah = htmlText.match(/class="ktw" rel="nofollow">(.+?)<\/a>/)?.[1];

    const result = {
        kodePost: extractedData[0],
        desa: extractedData[1],
        kecamatan: extractedData[2],
        'use server';

        import { NextRequest, NextResponse } from 'next/server';
        import axios from 'axios';
        import { siteConfig } from '@/settings/config';

        async function cariKodePos(namaDaerah: string, useProxy: boolean = false) {
          if (!namaDaerah) throw new Error('Nama daerah (query) is required');

          const targetUrl = 'https://www.nomor.net/_kodepos.php?_i=cari-kodepos&jobs=' + encodeURIComponent(namaDaerah);

          const headers = {
            Referer: 'https://www.nomor.net/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            Connection: 'keep-alive'
          };

          try {
            let resp;

            if (useProxy) {
              // Use AllOrigins as a simple proxy fallback
              const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
              resp = await axios.get(proxyUrl, { headers, timeout: 10000 });
            } else {
              resp = await axios.get(targetUrl, { headers, timeout: 10000 });
            }

            if (!resp || (resp.status && resp.status >= 400)) {
              const status = resp?.status ?? 'unknown';
              throw new Error(`Failed to fetch data from nomor.net. Status: ${status}`);
            }

            const d = resp.data as string;

            const regex = /class=\"ktw\"[^>]*>(?:<[^>]*?>)?(.+?)<\/a>/g;
            const matches = Array.from(d.matchAll(regex));
            const extracted = matches.map(m => m[1].replace(/<\/?.+?>/g, '')).slice(0, 5);

            if (extracted.length < 5) {
              throw new Error(`Tidak ditemukan hasil untuk pencarian kode pos: ${namaDaerah}`);
            }

            const kodeWilayahMatch = d.match(/class=\"ktw\" rel=\"nofollow\">(.+?)<\/a>/);
            const kodeWilayah = kodeWilayahMatch?.[1] ?? null;

            return {
              kodePost: extracted[0],
              desa: extracted[1],
              kecamatan: extracted[2],
              kabupaten: extracted[3],
              provinsi: extracted[4],
              kodeWilayah
            };

          } catch (err: any) {
            // If remote blocked with 403, provide actionable message
            if (err?.response?.status === 403 && !useProxy) {
              throw new Error('Remote server returned 403. Try again with query param `useProxy=true` to fetch via a proxy.');
            }
            // bubble other errors
            throw new Error(err.message || 'Unknown error while fetching kodepos');
          }
        }

        async function handleRequest(req: NextRequest, body?: any) {
          const query = (body?.query ?? body?.nama ?? req.nextUrl.searchParams.get('query') ?? req.nextUrl.searchParams.get('nama'))?.toString()?.trim();
          const useProxyRaw = (body?.useProxy ?? req.nextUrl.searchParams.get('useProxy'))?.toString();
          const useProxy = useProxyRaw === 'true' || useProxyRaw === '1' || useProxyRaw === true;

          if (!query) {
            return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Query parameter is required (query or nama).' }, { status: 400 });
          }

          try {
            const result = await cariKodePos(query, useProxy);
            return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: result });
          } catch (err: any) {
            console.error('Kodepos search error:', err);
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
          } catch (err: any) {
            return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Invalid JSON body' }, { status: 400 });
          }
        }
