import axios from 'axios'

class ExaAIChat {
  baseURL: string
  session: any | null

  constructor() {
    this.baseURL = 'https://chat.exa.ai'
    this.session = null
  }

  async initialize() {
    this.session = axios.create({
      baseURL: this.baseURL,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: '*/*',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })
  }

  async sendMessage(message: string) {
    if (!this.session) await this.initialize()

    try {
      const response = await this.session.post('/api/chat', {
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        chatId: Date.now().toString(36),
      })

      return this.decodeAIResponse(response.data)
    } catch (error: any) {
      // bubble a friendly error message
      throw new Error('Failed to get response from Exa AI')
    }
  }

  decodeAIResponse(data: any) {
    if (!data) return 'No response data'

    if (typeof data === 'string') {
      return this.parseStreamData(data)
    }

    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content
    }

    if (data.messages && Array.isArray(data.messages)) {
      const aiMsg = data.messages.find((m: any) => m.role === 'assistant')
      return aiMsg?.content || 'No AI message found'
    }

    if (data.content) {
      return data.content
    }

    return JSON.stringify(data).substring(0, 500)
  }

  parseStreamData(data: string) {
    let result = ''
    let i = 0

    while (i < data.length) {
      if (data[i] === '"' && i > 0 && data[i - 1] === ':') {
        i++
        let content = ''
        while (i < data.length && data[i] !== '"') {
          content += data[i]
          i++
        }
        result += content
      }
      i++
    }

    return result || data
  }
}

export async function sendExa(message: string) {
  const chat = new ExaAIChat()
  return await chat.sendMessage(message)
}

export default sendExa
