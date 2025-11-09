'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from "axios";
import { siteConfig } from '@/settings/config';

async function TwitterStalk(usn: string) {
   const { data: profile } = await axios.get(`https://www.twitter-viewer.com/api/x/user?username=${usn}`);
   const prf = profile.data;
   if (!prf.restId) {
       throw new Error(`User not found: ${usn}`);
   }
   const { data: twits } = await axios.get(`https://www.twitter-viewer.com/api/x/user-tweets?user=${prf.restId}&cursor=`);
   
   const ress = {
      profile: prf,
      tweets: twits.data.tweets
   };
   
   return ress;
}

async function handleRequest(req: NextRequest, body?: any) {
    const usn = body?.usn?.trim() || req.nextUrl.searchParams.get('usn')?.trim();
    if (!usn) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Twitter username (usn) parameter is required' }, { status: 400 });
    }

    try {
        const result = await TwitterStalk(usn);
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Twitter Stalk error:', err);
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
