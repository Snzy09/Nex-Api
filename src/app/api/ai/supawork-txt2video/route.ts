'use server'

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import siteConfig from '@/settings/config'

// TokenGenerator and TextToVideo classes (lightweight usage)
class TokenGenerator {
  static async generate(): Promise<any> {
    try {
      // Try to get a token via supawork registration flow (may require email)
      const email = `temp-${Date.now()}@gmail.com`;
      const res = await axios.post('https://api.supawork.ai/auth/register', { email });
      const token = res.data?.token || res.data?.auth?.token || null;
      return { success: !!token, token, raw: res.data };
    } catch (e: any) {
      return { success: false, error: e?.message || String(e) };
    }
  }
}

class TextToVideo {
  token: string
  constructor(token: string) {
    this.token = token
  }

  async generateAndWait(prompt: string, model = 'wan-22') {
    try {
      const init = await axios.post('https://api.supawork.ai/v1/video/generate', { prompt, model }, {
        headers: { Authorization: `Bearer ${this.token}` }
      })
      const id = init.data?.id || init.data?.taskId || init.data?.jobId
      if (!id) return { ok: false, message: 'no job id from supawork', raw: init.data }

      // poll
      const start = Date.now()
      while (Date.now() - start < 1000 * 60 * 3) { // 3 minutes timeout
        await new Promise(r => setTimeout(r, 2000))
        try {
          const st = await axios.get(`https://api.supawork.ai/v1/video/status/${id}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          const status = st.data?.status || st.data?.state
          if (status === 'done' || status === 'succeeded' || status === 'finished') {
            return { ok: true, data: st.data }
          }
          if (status === 'failed') return { ok: false, message: 'generation failed', raw: st.data }
        } catch (e) {
          // continue polling
        }
      }
      return { ok: false, message: 'timeout waiting for supawork job' }
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const prompt = body.prompt || body.message || ''
    const model = body.model || 'wan-22'
    let token = body.token || ''

    if (!prompt) return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'prompt is required' }, { status: 400 })

    if (!token) {
      const gen = await TokenGenerator.generate()
      if (!gen.success) return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'failed to obtain token', error: gen.error || gen.raw }, { status: 500 })
      token = gen.token
    }

    const t2v = new TextToVideo(token)
    const res = await t2v.generateAndWait(prompt, model)
    if (!res.ok) return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: res.message || 'generation failed', raw: res }, { status: 500 })

    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: res.data })
  } catch (e: any) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: e?.message || String(e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const prompt = req.nextUrl.searchParams.get('prompt') || req.nextUrl.searchParams.get('q') || ''
    const model = req.nextUrl.searchParams.get('model') || 'wan-22'
    if (!prompt) return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'prompt is required' }, { status: 400 })

    // Try to generate token then run
    const gen = await TokenGenerator.generate()
    if (!gen.success) return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'failed to obtain token', error: gen.error || gen.raw }, { status: 500 })
    const t2v = new TextToVideo(gen.token)
    const res = await t2v.generateAndWait(prompt, model)
    if (!res.ok) return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: res.message || 'generation failed', raw: res }, { status: 500 })

    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: res.data })
  } catch (e: any) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: e?.message || String(e) }, { status: 500 })
  }
}
