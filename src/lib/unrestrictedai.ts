import axios from 'axios';
import cheerio from 'cheerio';

export default class UnrestrictedAI {
  baseUrl: string;

  constructor() {
    this.baseUrl = 'https://unrestrictedaiimagegenerator.com/';
  }

  async generate(prompt: string, style = 'anime') {
    if (!prompt) throw new Error('Prompt is required.');

    const styles = ['photorealistic', 'digital-art', 'impressionist', 'anime', 'fantasy', 'sci-fi', 'vintage'];
    if (!styles.includes(style)) throw new Error(`Available styles: ${styles.join(', ')}.`);

    try {
      const { data: html } = await axios.get(this.baseUrl, {
        headers: {
          origin: this.baseUrl,
          referer: this.baseUrl,
          'user-agent':
            'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(html);
      const nonce = $('input[name="_wpnonce"]').attr('value');
      if (!nonce) throw new Error('Nonce not found.');

      const body = new URLSearchParams({
        generate_image: 'true',
        image_description: prompt,
        image_style: style,
        _wpnonce: nonce,
      }).toString();

      const { data } = await axios.post(this.baseUrl, body, {
        headers: {
          origin: this.baseUrl,
          referer: this.baseUrl,
          'user-agent':
            'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
          'content-type': 'application/x-www-form-urlencoded',
        },
        timeout: 20000,
      });

      const $$ = cheerio.load(data);
      const img = $$('img#resultImage').attr('src');

      if (!img) throw new Error('No result found.');

      return img;
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to generate image.');
    }
  }
}
import axios from 'axios';
import cheerio from 'cheerio';

export const STYLES = ['photorealistic', 'digital-art', 'impressionist', 'anime', 'fantasy', 'sci-fi', 'vintage'] as const;

export async function generateUnrestrictedImage(prompt: string, style: string = 'anime') {
  if (!prompt) throw new Error('Prompt is required.');
  if (!STYLES.includes(style as any)) throw new Error(`Available styles: ${STYLES.join(', ')}.`);

  try {
    const { data: html } = await axios.get('https://unrestrictedaiimagegenerator.com/', {
      headers: {
        origin: 'https://unrestrictedaiimagegenerator.com',
        referer: 'https://unrestrictedaiimagegenerator.com/',
        'user-agent':
          'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);
    const nonce = $('input[name="_wpnonce"]').attr('value');
    if (!nonce) throw new Error('Nonce not found.');

    const body = new URLSearchParams({
      generate_image: 'true',
      image_description: prompt,
      image_style: style,
      _wpnonce: nonce,
    }).toString();

    const { data } = await axios.post('https://unrestrictedaiimagegenerator.com/', body, {
      headers: {
        origin: 'https://unrestrictedaiimagegenerator.com',
        referer: 'https://unrestrictedaiimagegenerator.com/',
        'user-agent':
          'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
        'content-type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000,
    });

    const $$ = cheerio.load(data);
    const img = $$('img#resultImage').attr('src') || null;
    if (!img) throw new Error('No result found.');

    return img;
  } catch (err: any) {
    throw new Error(err?.message || 'Failed to generate image.');
  }
}

export default generateUnrestrictedImage;
