'use server';

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

class SoundCloudDownloader {
    private tools = {
        async hit(hitDescription: string, url: string, options: RequestInit, returnType: "text" | "json" | "buffer" = "text"): Promise<{ data: any; response: Response; }> {
            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`${response.status} ${response.statusText} ${(errorText || `(respond body kosong)`).substring(0, 100)}...`);
                }
                try {
                    if (returnType === "text") {
                        const data = await response.text();
                        return { data, response };
                    } else if (returnType === "json") {
                        const data = await response.json();
                        return { data, response };
                    } else if (returnType === "buffer") {
                        const ab = await response.arrayBuffer();
                        const data = Buffer.from(ab);
                        return { data, response };
                    } else {
                        throw new Error(`invalid param return type. pilih text/json`);
                    }
                } catch (error: any) {
                    throw new Error(`gagal mengubah response menjadi ${returnType}\n${error.message}`);
                }
            } catch (error: any) {
                throw new Error(`gagal hit. ${hitDescription}.\n${error.message}`);
            }
        },
        validateString: (description: string, variable: any) => {
            if (typeof variable !== "string" || variable?.trim()?.length === 0) {
                throw new Error(`${description} harus string dan gak boleh kosong!`);
            }
        },
    };

    private get baseHeaders() {
        return {
            'accept-encoding': 'gzip, deflate, br, zstd',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0'
        };
    }

    private async getTrackAuthAndStreamUrlAndKey(soundcloudTrackUrl: string) {
        const headers = this.baseHeaders;
        const { data: html } = await this.tools.hit(`homepage`, soundcloudTrackUrl, { headers });
        const m_json = html?.match(/<script>window.__sc_hydration = (.+?);<\/script>/)?.[1];
        if (!m_json) throw new Error(`fungsi download homepage fail. gak ada match untuk regex json`);
        const json = JSON.parse(m_json);

        const ddjsKey = html.match(/window\.ddjskey = '(.+?)';/)?.[1];
        const track_authorization = json?.[7]?.data?.track_authorization;
        const stream_url = json?.[7]?.data?.media?.transcodings?.[3]?.url;
        if (!ddjsKey || !track_authorization || !stream_url) throw new Error('payload return gk lengkap! fungsi getTrackAuthAndStreamUrlAndKey gagal');

        const title = json?.[7]?.data?.title || `no title`;
        const image = html.match(/og:image" content="(.+?)">/)?.[1];
        const username = json?.[7]?.data?.user?.username;
        const playbackCount = json?.[7]?.data?.playback_count || 0;
        const likesCount = json?.[7]?.data.likes_count || 0;
        const commentsCount = json?.[7]?.data.comment_count || 0;
        const displayDate = json?.[7].data.display_date;
        const soundMetadata = { title, image, username, playbackCount, likesCount, commentsCount, displayDate };
        const result = { ddjsKey, track_authorization, stream_url, soundMetadata };
        return result;
    }

    private async getDatadome(gtaasuakObj: { ddjsKey: string }) {
        const { ddjsKey } = gtaasuakObj;
        const headers = {
            "Referer": "https://soundcloud.com/",
            ...this.baseHeaders
        };
        const body = new URLSearchParams({
            "ddk": ddjsKey,
        });
        const url = 'https://dwt.soundcloud.com/js/';
        const { data: json } = await this.tools.hit(`get datadome`, url, { headers, body: body.toString(), "method": "post" }, `json`);
        const value = json?.cookie?.split("; ")?.[0]?.split('=')?.[1];
        if (!value) throw new Error(`hasil datadome kosong!`);
        return { datadome: value };
    }

    private async getClientId() {
        const headers = this.baseHeaders;
        const url = 'https://a-v2.sndcdn.com/assets/0-b9979956.js';
        const { data: js } = await this.tools.hit(`mendapatkan client id`, url, { headers });
        const client_id = js.match(/"client_id=(.+?)"\)/)?.[1];
        if (!client_id) throw new Error('match client id kosong!');
        const result = { client_id };
        return result;
    }

    private async getHls(gtaasuakObj: any, gciObj: any, gddObj: any) {
        const { stream_url, track_authorization } = gtaasuakObj;
        const { client_id } = gciObj;
        const { datadome } = gddObj;

        const headers = {
            "x-datadome-clientid": datadome,
            ...this.baseHeaders
        };

        const url = new URL(stream_url);
        url.search = new URLSearchParams({
            client_id,
            track_authorization
        }).toString();

        const { data: json } = await this.tools.hit(`mendapatkan hls`, url.toString(), { headers }, `json`);
        return json;
    }

    async download(soundcloudTrackUrl: string) {
        this.tools.validateString(`soundcloud track url`, soundcloudTrackUrl);
        
        const gtaasuakReq = this.getTrackAuthAndStreamUrlAndKey(soundcloudTrackUrl);
        const gciReq = this.getClientId();
        
        const [gtaasuakObj, gciObj] = await Promise.all([gtaasuakReq, gciReq]);
        
        const gddObj = await this.getDatadome(gtaasuakObj);
        const ghObj = await this.getHls(gtaasuakObj, gciObj, gddObj);

        const { soundMetadata } = gtaasuakObj;
        const { url } = ghObj;
        const result = { ...soundMetadata, url };
        return result;
    }
}

async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const url = body?.url?.trim() || req.nextUrl.searchParams.get('url')?.trim();
    if (!url || !url.includes('soundcloud.com')) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'invalid or missing soundcloud url' }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'A valid SoundCloud track URL is required' }, { status: 400 });
    }

    try {
        const scDownloader = new SoundCloudDownloader();
        const result = await scDownloader.download(url);
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('SoundCloud DL error:', err);
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
