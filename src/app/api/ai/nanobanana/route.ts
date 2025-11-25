'use server'

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import siteConfig from '@/settings/config'

class NanoBanana {
  base = 'https://api.supawork.ai'

  async getPresigned(filename: string) {
    const res = await axios.post(`${this.base}/v1/files/presign`, { filename })
    return res.data
  }

  async uploadLocal(filePath: string) {
    const name = path.basename(filePath)
    const pres = await this.getPresigned(name)
    const url = pres?.url || pres?.uploadUrl || pres?.presignedUrl
    if (!url) throw new Error('no presigned url')
    const data = await fs.readFile(filePath)
    await axios.put(url, data, { headers: { 'Content-Type': 'application/octet-stream' } })
    return pres
  }

  async create(imagePath: string, prompt: string) {
    // upload and request generation
    const pres = await this.uploadLocal(imagePath)
    const body = { image: pres?.fileKey || pres?.key || pres?.path, prompt }
    const res = await axios.post(`${this.base}/v1/image/gen`, body)
    return res.data
  }
}

async function downloadToTmp(url: string) {
  const res = await axios.get(url, { responseType: 'arraybuffer' })
  const ext = (url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/) || [])[1] || 'png'
  const tmpPath = path.join('/tmp', `nanobanana-${Date.now()}.${ext}`)
  await fs.writeFile(tmpPath, Buffer.from(res.data))
  return tmpPath
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const imageUrl = body.imageUrl || body.url || ''
    const prompt = body.prompt || ''
    if (!imageUrl) return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'imageUrl is required' }, { status: 400 })
    if (!prompt) return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'prompt is required' }, { status: 400 })

    const tmp = await downloadToTmp(imageUrl)
    const nano = new NanoBanana()
    const res = await nano.create(tmp, prompt)
    try { await fs.unlink(tmp) } catch (e) {}
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: res })
  } catch (e: any) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: e?.message || String(e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('imageUrl') || req.nextUrl.searchParams.get('url') || ''
    const prompt = req.nextUrl.searchParams.get('prompt') || ''
    if (!url) return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'imageUrl is required' }, { status: 400 })
    if (!prompt) return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: 'prompt is required' }, { status: 400 })

    const tmp = await downloadToTmp(url)
    const nano = new NanoBanana()
    const res = await nano.create(tmp, prompt)
    try { await fs.unlink(tmp) } catch (e) {}
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: res })
  } catch (e: any) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, message: e?.message || String(e) }, { status: 500 })
  }
}
