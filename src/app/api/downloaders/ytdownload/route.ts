'use server';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { siteConfig } from '@/settings/config';

const yt = {
  get baseUrl() {
    return { origin: 'https://v2.yt1s.biz' };
  },

  get baseHeaders() {
    return {
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      origin: this.baseUrl.origin,
    };
  },

  validateString: function (string: any, description: string) {
    if (typeof string !== 'string' || !string?.trim()?.length) throw Error(`${description} can't be empty`);
  },

  handleFormat: function (userFormat: string) {
    const validFormat = ['64kbps', '96kbps', '128kbps', '256kbps', '320kbps', '144p', '240p', '360p', '480p', '720p', '1080p'];
    if (!validFormat.includes(userFormat)) throw Error(`your format is invalid! just pick one of these. ${validFormat.join(', ')}`);
    const path = /p$/.test(userFormat) ? '/video' : '/audio';
    const quality = userFormat.match(/\d+/)![0];
    return { path, quality };
  },

  hit: async function (description: string, url: string, opts: any, returnType = 'text') {
    try {
      const r = await fetch(url, opts as any);
      if (!r.ok) throw Error(`${r.status} ${r.statusText} ${await r.text() || 'empty response'}`);
      let data;
      if (returnType == 'json') {
        data = await r.json();
      } else if (returnType == 'text') {
        data = await r.text();
      } else {
        throw Error('invalid return type');
      }
      return { data, headers: r.headers };
    } catch (e: any) {
      throw Error(`hit gagal. ${description}. ${e.message}`);
    }
  },

  getSessionToken: async function () {
    const headers = this.baseHeaders;
    const api = 'https://fast.dlsrv.online/';
    const { headers: h } = await this.hit('get session', api, { headers });
    const result = h.get('x-session-token');
    if (!result) throw Error('session kosong!');
    return result;
  },

  pow: function (session: string, path: string, startNonce = 0) {
    let nonce = startNonce;
    let powHash = '';
    while (true) {
      const data = `${session}:${path}:${nonce}`;
      powHash = crypto.createHash('SHA256').update(data).digest('hex');
      if (powHash.startsWith('0000')) {
        return { nonce: nonce.toString(), powHash: powHash };
      }
      nonce++;
    }
  },

  apiSignature: function (session: string, path: string, timestamp: string) {
    const dataToSign = `${session}:${path}:${timestamp}`;
    const secretKey = 'a8d4e2456d59b90c8402fc4f060982aa';
    const result = crypto.createHmac('SHA256', secretKey).update(dataToSign).digest('hex');
    return result;
  },

  download: async function (videoId: string, userFormat = '128kbps') {
    this.validateString(videoId, 'videoId');
    const { path, quality } = this.handleFormat(userFormat);
    const sessionToken = await this.getSessionToken();
    const timestamp = Date.now().toString();
    const signature = this.apiSignature(sessionToken, path, timestamp);
    const { nonce, powHash } = this.pow(sessionToken, path);

    const headers = {
      'content-type': 'application/json',
      'x-api-auth': "Ig9CxOQPYu3RB7GC21sOcgRPy4uyxFKTx54bFDu07G3eAMkrdVqXY9bBatu4WqTpkADrQ",
      'x-session-token': sessionToken,
      'x-signature': signature,
      'x-signature-timestamp': timestamp,
      nonce: nonce,
      powhash: powHash,
      ...this.baseHeaders,
    };

    const api = `https://fast.dlsrv.online/gateway${path}`;
    const body = JSON.stringify({ videoId, quality });

    const { data: result } = await this.hit('download', api, { headers, body, method: 'post' }, 'json');
    return result;
  },
};

async function handleRequest(req: NextRequest, body?: any) {
  const videoId = (body?.videoId ?? req.nextUrl.searchParams.get('videoId'))?.toString();
  const format = (body?.format ?? req.nextUrl.searchParams.get('format'))?.toString() ?? '128kbps';

  if (!videoId) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'Parameter "videoId" is required.' }, { status: 400 });
  }

  try {
    const result = await yt.download(videoId, format);
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: result }, { status: 200 });
  } catch (error: any) {
    console.error('YT Download error:', error?.message || error);
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'Failed to download.', error: error?.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleRequest(req, body);
}
