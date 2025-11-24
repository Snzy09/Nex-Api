'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';

const models = [
  'chatgpt41mini',
  'chatgpt',
  'chatgpto1p',
  'claude',
  'gemini',
  'mistral',
  'grok',
];

async function getCsrfToken() {
  const res = await axios.get('https://app.claila.com/api/v2/getcsrftoken', {
    headers: {
      authority: 'app.claila.com',
      accept: '*/*',
      'accept-language': 'ms-MY,ms;q=0.9,en-US;q=0.8,en;q=0.7',
      origin: 'https://www.claila.com',
      referer: 'https://www.claila.com/',
      'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
    },
  });

  return res.data;
}

async function sendMessageToModel(model: string, message: string = 'hai') {
  const csrfToken = await getCsrfToken();

  const res = await axios.post(
    `https://app.claila.com/api/v2/unichat1/${model}`,
    new URLSearchParams({
      calltype: 'completion',
      message: message,
      sessionId: Date.now().toString(),
    }),
    {
      headers: {
        authority: 'app.claila.com',
        accept: '*/*',
        'accept-language': 'ms-MY,ms;q=0.9,en-US;q=0.8,en;q=0.7',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        origin: 'https://app.claila.com',
        referer: 'https://app.claila.com/chat?uid=5044b9eb&lang=en',
        'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        'x-csrf-token': csrfToken,
        'x-requested-with': 'XMLHttpRequest',
      },
      timeout: 15000,
    }
  );

  return res.data;
}

async function handleRequest(req: NextRequest, body?: any) {
  const message = (body?.message ?? body?.text ?? req.nextUrl.searchParams.get('message') ?? req.nextUrl.searchParams.get('text'))?.toString()?.trim();
  const model = (body?.model ?? req.nextUrl.searchParams.get('model'))?.toString()?.trim() || 'grok';

  if (!message) {
    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: 'Parameter "message" or "text" is required.',
      },
      { status: 400 }
    );
  }

  if (!models.includes(model)) {
    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: `Invalid model. Available models: ${models.join(', ')}`,
        availableModels: models,
      },
      { status: 400 }
    );
  }

  try {
    const response = await sendMessageToModel(model, message);

    return NextResponse.json(
      {
        status: true,
        creator: siteConfig.api.creator,
        data: {
          model: model,
          message: message,
          response: response,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Claila AI Error:', error.message);

    return NextResponse.json(
      {
        status: false,
        creator: siteConfig.api.creator,
        message: 'Failed to get response from Claila AI.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleRequest(req, body);
}
