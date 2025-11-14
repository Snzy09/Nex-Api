'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { siteConfig } from '@/settings/config';

async function unlimitedai(question: string) {
  if (!question) {
    throw new Error('Question is required.');
  }

  const inst = axios.create({
    baseURL: 'https://app.unlimitedai.chat/api',
    headers: {
      referer: 'https://app.unlimitedai.chat/id',
      'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
    }
  });

  const { data: a } = await inst.get('/token');
  const { data } = await inst.post('/chat', {
    messages: [{
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      role: 'user',
      content: question,
      parts: [{
        type: 'text',
        text: question
      }]
    }],
    id: uuidv4(),
    selectedChatModel: 'chat-model-reasoning',
    selectedCharacter: null,
    selectedStory: null
  }, {
    headers: {
      'x-api-token': a.token
    }
  });

  const result = data.split('\n').find((line: string) => line.startsWith('0:')).slice(3, -1);
  if (!result) throw new Error('No result found.');

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body;

    if (!question) {
      return NextResponse.json({ 
        creator: siteConfig.api.creator, 
        error: 'Question parameter is required.' 
      }, { status: 400 });
    }

    const result = await unlimitedai(question);

    return NextResponse.json({
      status: true,
      creator: siteConfig.api.creator,
      data: result
    });

  } catch (error: any) {
    console.error('UnliAI error:', error);
    return NextResponse.json({ 
      creator: siteConfig.api.creator, 
      error: error.message || 'An unexpected error occurred.' 
    }, { status: 500 });
  }
}
