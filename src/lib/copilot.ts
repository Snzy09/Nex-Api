import axios from 'axios';
import { randomUUID } from 'crypto';

type ChatOptions = { model?: string };

export default class Copilot {
  conversationId: string | null;
  models: Record<string, string>;
  headers: Record<string, string>;

  constructor() {
    this.conversationId = null;
    this.models = {
      default: 'chat',
      'think-deeper': 'reasoning',
      'gpt-5': 'smart',
    };
    this.headers = {
      origin: 'https://copilot.microsoft.com',
      'user-agent':
        'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
    };
  }

  async createConversation() {
    const resp = await axios.post('https://copilot.microsoft.com/c/api/conversations', null, { headers: this.headers, timeout: 10000 });
    const data = resp.data as any;
    this.conversationId = data?.id || randomUUID();
    return this.conversationId;
  }

  async chat(message: string, opts: ChatOptions = {}) {
    if (!this.conversationId) await this.createConversation();
    const modelKey = opts.model || 'default';
    if (!this.models[modelKey]) throw new Error(`Available models: ${Object.keys(this.models).join(', ')}`);

    // Attempt to use WebSocket if available. If not, return a helpful error.
    try {
      // @ts-ignore - ws may not be installed in all environments; handle missing module at runtime
      const wsModule = await import('ws').catch(() => null) as any;
      const WebSocketImpl = wsModule?.default || wsModule;
      if (!WebSocketImpl) {
        throw new Error('WebSocket client (ws) is not available in this environment');
      }

      const wssUrl = `wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1`;
      return await new Promise<any>((resolve, reject) => {
        const ws = new WebSocketImpl(wssUrl, { headers: this.headers } as any);
        const response: { text: string; citations: any[] } = { text: '', citations: [] };

        ws.onopen = () => {
          try {
            ws.send(JSON.stringify({
              event: 'setOptions',
              supportedFeatures: ['partial-generated-images'],
              supportedCards: ['weather', 'local', 'image', 'sports', 'video', 'ads', 'safetyHelpline', 'quiz', 'finance', 'recipe'],
              ads: { supportedTypes: ['text', 'product', 'multimedia', 'tourActivity', 'propertyPromotion'] },
            }));

            ws.send(JSON.stringify({
              event: 'send',
              mode: this.models[modelKey],
              conversationId: this.conversationId,
              content: [{ type: 'text', text: message }],
              context: {},
            }));
          } catch (err) {
            reject(err);
          }
        };

        ws.onmessage = (ev: any) => {
          try {
            const chunk = ev.data?.toString ? ev.data.toString() : ev.data;
            const parsed = JSON.parse(chunk as string);
            switch (parsed.event) {
              case 'appendText':
                response.text += parsed.text || '';
                break;
              case 'citation':
                response.citations.push({ title: parsed.title, icon: parsed.iconUrl, url: parsed.url });
                break;
              case 'done':
                resolve(response);
                ws.close();
                break;
              case 'error':
                reject(new Error(parsed.message || 'Unknown error from Copilot WS'));
                ws.close();
                break;
            }
          } catch (err) {
            // ignore JSON parse errors for non-JSON frames
          }
        };

        ws.onerror = (err: any) => reject(err);
        ws.onclose = () => {
          // if closed before 'done', resolve with what we have
          resolve(response);
        };
      });
    } catch (err: any) {
      // Fallback: try a simple HTTP POST (best-effort). Many Copilot flows expect WS, so return clear error.
      try {
        const url = `https://copilot.microsoft.com/c/api/conversations/${this.conversationId}/messages`;
        const post = await axios.post(url, { text: message, mode: this.models[modelKey] }, { headers: this.headers, timeout: 15000 });
        return { text: post.data?.message || '', citations: post.data?.citations || [] };
      } catch (httpErr: any) {
        throw new Error(err?.message || httpErr?.message || 'Failed to contact Copilot service');
      }
    }
  }
}
