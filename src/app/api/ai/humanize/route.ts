'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { siteConfig } from '@/settings/config';

const unaiMytext = {
  api: {
    base: 'https://unaimytext.com',
    endpoints: {
      humanize: '/api/humanize'
    }
  },

  headers: {
    'authority': 'unaimytext.com',
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://unaimytext.com',
    'referer': 'https://unaimytext.com/',
    'user-agent': 'Postify/1.0.0'
  },

  humanize: async (codes: string, level: string = 'enhanced', settings: any = {}) => {
    if (typeof codes !== 'string' || !codes.trim()) {
      return {
        success: false,
        code: 400,
        result: {
          error: 'Text input is required.',
        }
      };
    }

    const isLevel = ['standard', 'enhanced', 'aggressive'];
    level = level.toLowerCase();
    if (!isLevel.includes(level)) {
      return {
        success: false,
        code: 400,
        result: {
          error: `Level "${level}" is not valid. Choose from: ${isLevel.join(', ')}`,
          validLevels: isLevel
        }
      };
    }

    try {
      const def = {
        removeUnicode: true,
        dashesToCommas: true,
        removeDashes: true,
        transformQuotes: true,
        removeWhitespace: true,
        removeEmDash: true,
        keyboardOnly: true
      };

      const response = await axios.post(
        `${unaiMytext.api.base}${unaiMytext.api.endpoints.humanize}`,
        {
          text: codes,
          recaptchaToken: '',
          level,
          settings: {
            ...def,
            ...settings
          }
        },
        {
          headers: unaiMytext.headers,
          timeout: 10000
        }
      );

      if (!response.data?.text) {
        return {
          success: false,
          code: 500,
          result: {
            error: 'Empty response from server.',
          }
        };
      }

      const originalLength = codes.length;
      const transformedLength = response.data.text.length;
      const reductionPercentage = ((originalLength - transformedLength) / originalLength * 100).toFixed(2);

      return {
        success: true,
        code: 200,
        level: level,
        result: {
          humanizedText: response.data.text,
          originalLength,
          transformedLength,
          reductionPercentage: `${reductionPercentage}%`
        }
      };

    } catch (err: any) {
      return {
        success: false,
        code: err.response?.status || 500,
        result: {
          error: err.message || 'An error occurred during humanization.'
        }
      };
    }
  }
};

async function handleRequest(req: NextRequest, body?: any) {
  const text = (body?.text ?? body?.prompt ?? req.nextUrl.searchParams.get('text') ?? req.nextUrl.searchParams.get('prompt'))?.toString()?.trim();
  const level = (body?.level ?? req.nextUrl.searchParams.get('level') ?? 'enhanced')?.toString()?.toLowerCase();
  const customSettings = body?.settings ?? {};

  if (!text) {
    return NextResponse.json(
      { status: false, creator: siteConfig.api.creator, error: 'Text parameter is required.' },
      { status: 400 }
    );
  }

  try {
    const result = await unaiMytext.humanize(text, level, customSettings);
    return NextResponse.json({
      status: result.success,
      creator: siteConfig.api.creator,
      data: result.success ? result.result : null,
      message: !result.success ? result.result.error : undefined
    });
  } catch (err: any) {
    console.error('Humanize error:', err);
    return NextResponse.json(
      { status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
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
    return NextResponse.json(
      { status: false, creator: siteConfig.api.creator, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}
