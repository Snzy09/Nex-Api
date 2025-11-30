'use server'

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import FormData from 'form-data'
import { siteConfig } from '@/settings/config'
import { appendLog } from '@/lib/filelogger'

const apiKeys = [
  'pvmbuSzyrip1ksmj9otVSogd',
  'jGaBWNXPP8LXV6KW3ovBWozE',
  'kqWaDsZLxMk2kh9MJu5u7ceP',
  'kDhVMX7eoByik5hFomEdMDVs',
  'c7J5ityXePPqxARTMRpohJvj',
  'xu2pZRhdyddJx48BrN9ntvjD',
  'FAKQ7AtfrADtGmLsWVG9s9Yu',
  '3eoq8Bd1JUxEU3Gi5AAmtxZ1'
]

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function POST(req: NextRequest) {
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  try {
    const contentType = req.headers.get('content-type') || ''

    let imageBuffer: Buffer | null = null
    let imageUrl: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('image') as File | null
      const urlField = formData.get('imageUrl') as string | null
      if (file) {
        imageBuffer = Buffer.from(await file.arrayBuffer())
      } else if (urlField) {
        imageUrl = String(urlField)
      }
    } else {
      // try json body
      const body = await req.json().catch(() => ({}))
      if (body?.image) {
        const base64 = String(body.image).replace(/^data:.*;base64,/, '')
        imageBuffer = Buffer.from(base64, 'base64')
      } else if (body?.imageUrl || body?.url) {
        imageUrl = String(body.imageUrl || body.url)
      }
    }

    if (!imageBuffer && !imageUrl) {
      await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing image' }).catch(()=>{})
      return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Please provide an image file (form field `image`), base64 `image`, or `imageUrl`.' }, { status: 400 })
    }

    const apiKey = pickRandom(apiKeys)

    const form = new FormData()
    if (imageBuffer) {
      form.append('image_file', imageBuffer, { filename: `upload-${Date.now()}.png` } as any)
    } else if (imageUrl) {
      form.append('image_url', imageUrl)
    }
    form.append('size', 'regular')

    const resp = await axios.post('https://api.remove.bg/v1.0/removebg', form as any, {
      headers: {
        ...((form as any).getHeaders ? (form as any).getHeaders() : {}),
        'X-Api-Key': apiKey,
      },
      responseType: 'arraybuffer',
      timeout: 60000,
    })

    if (resp.status !== 200) {
      await appendLog({ method, path: fullPath, status: resp.status, responseTimeMs: Date.now() - start, message: 'remove.bg error' }).catch(()=>{})
      return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'remove.bg returned non-200 status', code: resp.status }, { status: 502 })
    }

    const contentTypeResp = resp.headers['content-type'] || 'image/png'
    const b64 = Buffer.from(resp.data).toString('base64')
    const dataUrl = `data:${contentTypeResp};base64,${b64}`

    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, image: dataUrl })
  } catch (err: any) {
    console.error('removebg error:', err?.response?.data || err)
    const statusCode = err?.response?.status || 500
    await appendLog({ method, path: fullPath, status: statusCode, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
    return NextResponse.json({ status: false, error: err?.response?.data || String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Support simple GET with imageUrl query param
  const start = Date.now()
  const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
  const method = req.method
  const imageUrl = req.nextUrl.searchParams.get('imageUrl') || req.nextUrl.searchParams.get('url')
  if (!imageUrl) {
    await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing imageUrl' }).catch(()=>{})
    return NextResponse.json({ status: false, error: 'imageUrl query parameter is required' }, { status: 400 })
  }

  try {
    const apiKey = pickRandom(apiKeys)
    const form = new FormData()
    form.append('image_url', imageUrl)
    form.append('size', 'regular')

    const resp = await axios.post('https://api.remove.bg/v1.0/removebg', form as any, {
      headers: {
        ...((form as any).getHeaders ? (form as any).getHeaders() : {}),
        'X-Api-Key': apiKey,
      },
      responseType: 'arraybuffer',
      timeout: 60000,
    })

    if (resp.status !== 200) {
      await appendLog({ method, path: fullPath, status: resp.status, responseTimeMs: Date.now() - start, message: 'remove.bg error' }).catch(()=>{})
      return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'remove.bg returned non-200 status', code: resp.status }, { status: 502 })
    }

    const contentTypeResp = resp.headers['content-type'] || 'image/png'
    const b64 = Buffer.from(resp.data).toString('base64')
    const dataUrl = `data:${contentTypeResp};base64,${b64}`

    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, image: dataUrl })
  } catch (err: any) {
    console.error('removebg error:', err?.response?.data || err)
    const statusCode = err?.response?.status || 500
    await appendLog({ method, path: fullPath, status: statusCode, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
    return NextResponse.json({ status: false, error: err?.response?.data || String(err) }, { status: 500 })
  }
}

export const runtime = 'edge'
