import axios from 'axios'
import { Buffer } from 'buffer'

class GeminiAPI {
  baseUrl: string
  headers: Record<string, string>

  constructor() {
    this.baseUrl = 'https://us-central1-infinite-chain-295909.cloudfunctions.net/gemini-proxy-staging-v1'
    this.headers = {
      accept: '*/*',
      'accept-language': 'id-ID,id;q=0.9',
      'content-type': 'application/json',
      priority: 'u=1, i',
      'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24", "Microsoft Edge Simulate";v="131", "Lemur";v="131"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    }
  }

  async getImage(imgUrl: string) {
    try {
      const response = await axios.get(imgUrl, { responseType: 'arraybuffer' })
      return {
        mime_type: response.headers['content-type'],
        data: Buffer.from(response.data, 'binary').toString('base64'),
      }
    } catch (error) {
      throw new Error('Failed to fetch image')
    }
  }

  async chat({ prompt, model = 'gemini-2.0-flash-lite', imgUrl }: { prompt: string; model?: string; imgUrl?: string }) {
    try {
      const parts = imgUrl
        ? [{ inline_data: await this.getImage(imgUrl) }, { text: prompt }]
        : [{ text: prompt }]

      const requestData = {
        model,
        contents: [{ parts }],
      }

      const response = await axios.post(this.baseUrl, requestData, { headers: this.headers, timeout: 30000 })

      return response.data.candidates?.[0]?.content ?? response.data
    } catch (error: any) {
      throw new Error(error?.response?.data?.error?.message ?? 'Failed to get response from API')
    }
  }
}

export async function AiGeminiLite(prompt: string, options: { model?: string; imgUrl?: string } = {}) {
  const { model = 'gemini-2.0-flash-lite', imgUrl } = options

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Prompt is required')
  }

  if (model && (typeof model !== 'string' || model.trim().length === 0)) {
    throw new Error('Model must be a string')
  }

  if (imgUrl && (typeof imgUrl !== 'string' || imgUrl.trim().length === 0)) {
    throw new Error('Image URL must be a string')
  }

  try {
    const params = {
      prompt: prompt.trim(),
      ...(model && { model: model.trim() }),
      ...(imgUrl && { imgUrl: imgUrl.trim() }),
    }

    const data = await new GeminiAPI().chat(params)

    return {
      status: true,
      data,
      timestamp: new Date().toISOString(),
    }
  } catch (error: any) {
    return {
      status: false,
      error: error?.message ?? String(error),
      code: 500,
    }
  }
}

export default AiGeminiLite
