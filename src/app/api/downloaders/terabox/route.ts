import axios from 'axios'
import https from 'https'
import FormData from 'form-data'
import { NextResponse } from 'next/server'
import { appendLog } from '@/lib/filelogger'

const httpsAgent = new https.Agent({ rejectUnauthorized: true })

function kyahhh(k: string) {
  return k.replace(/[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu, '').trim().replace(/\s+/g, '_')
}

function obj(x: any): any {
  if (Array.isArray(x)) return x.map((v) => obj(v))
  if (x && typeof x === 'object') {
    const out: any = {}
    for (const key in x) out[kyahhh(key)] = obj(x[key])
    return out
  }
  return x
}

async function getNonce(url: string) {
  const html = (await axios.get(url, { httpsAgent })).data
  const m = String(html).match(/var\s+terabox_ajax\s*=\s*(\{[\s\S]*?\});/m)
  if (!m) return null
  try {
    return JSON.parse(m[1]).nonce ?? null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const start = Date.now()
  const urlObj = new URL(req.url)
  const fullPath = urlObj.pathname + (urlObj.search || '')
  const method = req.method || 'POST'
  try {
    const body = await req.json().catch(() => ({}))
    const link = (body.link || new URL(req.url).searchParams.get('link') || '').toString()
    const parse = (body.parse_result === true) || new URL(req.url).searchParams.get('parse') === '1'

    if (!link) {
      await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing link' }).catch(()=>{})
      return NextResponse.json({ error: true, message: 'Missing `link` parameter.' }, { status: 400 })
    }

    const nonce = await getNonce('https://teradownloadr.com/')
    const form = new FormData()
    form.append('action', 'terabox_fetch')
    form.append('url', link)
    form.append('nonce', nonce)

    const { data } = await axios.post('https://teradownloadr.com/wp-admin/admin-ajax.php', form, {
      headers: form.getHeaders(),
      httpsAgent,
      responseType: 'json'
    })

    if (parse) {
      await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
      return NextResponse.json({ data: obj(data.data ?? data) })
    }

    await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
    return NextResponse.json({ data: data.data ?? data })
  } catch (error: any) {
    await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(error) }).catch(()=>{})
    return NextResponse.json({ error: true, message: error?.message || String(error) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  return POST(req)
}
