'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { createHash, randomUUID } from 'crypto';
import { siteConfig } from '@/settings/config';

const translapp = {
  api: {
    base: 'https://translapp.info',
    endpoint: '/ai/g/ask',
  },

  headers: {
    'user-agent': 'Postify/1.0.0',
    'content-type': 'application/json',
    'accept-language': 'en',
  },

  modules: [
    'SUMMARIZE',
    'PARAPHRASE',
    'EXPAND',
    'TONE',
    'TRANSLATE',
    'REPLY',
    'GRAMMAR',
  ],

  tones: [
    'Friendly',
    'Romantic',
    'Sarcastic',
    'Humour',
    'Social',
    'Angry',
    'Sad',
    'Other',
  ],

  replies: ['Short', 'Medium', 'Long'],

  _shorten: (input: string) => {
    if (input.length >= 5) return input.substring(0, 5);
    return 'O'.repeat(5 - input.length) + input;
  },

  _hashString: (str: string) => createHash('sha256').update(str, 'utf8').digest('hex'),

  request: async (text: string, module = 'SUMMARIZE', to = '', customTone = '') => {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        success: false,
        code: 400,
        result: { error: 'Text input is required.' },
      };
    }

    if (!module || !translapp.modules.includes(module)) {
      return {
        success: false,
        code: 400,
        result: {
          error: `A valid module is required. Choose one of: ${translapp.modules.join(', ')}`,
        },
      };
    }

    if (module === 'TONE') {
      if (!to || !translapp.tones.includes(to)) {
        return {
          success: false,
          code: 400,
          result: {
            error: `The 'to' parameter for TONE is required. Choose one of: ${translapp.tones.join(', ')}`,
          },
        };
      }
      if (to === 'Other' && (!customTone || customTone.trim() === '')) {
        return {
          success: false,
          code: 400,
          result: {
            error: "If TONE is 'Other', customTone is required (e.g., 'Shy').",
          },
        };
      }
    } else if (module === 'TRANSLATE') {
      if (!to || typeof to !== 'string' || to.trim() === '') {
        return {
          success: false,
          code: 400,
          result: {
            error: "The 'to' parameter for TRANSLATE is required (e.g., 'English').",
          },
        };
      }
    } else if (module === 'REPLY') {
      if (!to || !translapp.replies.includes(to)) {
        return {
          success: false,
          code: 400,
          result: {
            error: `The 'to' parameter for REPLY is required. Choose one of: ${translapp.replies.join(', ')}`,
          },
        };
      }
    }

    try {
      const inputx = translapp._shorten(text);
      const prefix = `${inputx}ZERO`;
      const key = translapp._hashString(prefix);
      const userId = `GALAXY_AI${randomUUID()}`;
      const toValue = module === 'TONE' && to === 'Other' ? customTone : to;

      const payload = {
        k: key,
        module,
        text,
        to: toValue,
        userId,
      };

      const response = await axios.post(
        `${translapp.api.base}${translapp.api.endpoint}`,
        payload,
        { headers: translapp.headers }
      );

      const { data } = response;

      return {
        success: true,
        code: 200,
        result: {
          module,
          input: text,
          to: toValue,
          output: data.message,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        code: error.response?.status || 500,
        result: {
          error: error.response?.data?.message || error.message || 'An unexpected error occurred.',
        },
      };
    }
  },
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, module, to, customTone } = body;
        
        const result = await translapp.request(text, module, to, customTone);

        if (!result.success) {
            return NextResponse.json({ creator: siteConfig.api.creator, error: result.result.error }, { status: result.code });
        }

        return NextResponse.json({ 
            status: true,
            creator: siteConfig.api.creator,
            data: result.result
        });

    } catch (error: any) {
        return NextResponse.json({ creator: siteConfig.api.creator, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
