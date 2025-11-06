
export const siteConfig = {
    name: "Nex API",
    description: "A modern API for web scraping with tiered access.",
    api: {
      creator: "Sanzzy",
    },
    maintenance: {
      enabled: false,
      apiResponse: {
        status: false,
        message: "API is currently under maintenance. Please try again later.",
      },
    },
  };
  
  export type ApiEndpoint = {
    name: string;
    path: string;
    description: string;
    methods: ('GET' | 'POST')[];
    status: 'online' | 'offline';
    parameters: {
      name: string;
      type: string;
      description: string;
      required: boolean;
      options?: string[];
    }[];
  };
  
  export type ApiCategory = {
    name: string;
    description: string;
    endpoints: ApiEndpoint[];
  };
  
  export const apiEndpoints: Record<string, ApiCategory> = {
    ai: {
      name: 'AI',
      description: 'Endpoints for AI-powered features.',
      endpoints: [
        {
          name: 'Felo AI Search',
          path: '/api/search/felo',
          description: 'Get search results from Felo AI.',
          methods: ['GET', 'POST'],
          status: 'online',
          parameters: [
            {
              name: 'query',
              type: 'string',
              description: 'The search query.',
              required: true,
            },
          ],
        },
        {
          name: "Hydromind",
          path: "/api/ai/hydromind",
          description: "Chat with the Hydromind AI.",
          methods: ["POST"],
          status: "online",
          parameters: [
            {
              name: "text",
              type: "string",
              description: "The input text for the AI.",
              required: true,
            },
            {
              name: "model",
              type: "select",
              description: "The AI model to use.",
              required: true,
              options: [
                "gemini",
                "gemini-pro",
                "gpt-4",
                "gpt-3.5-turbo",
              ],
            },
            {
              name: "responses",
              type: "string",
              description: "Number of responses to generate.",
              required: false,
            },
          ],
        },
        {
            name: 'Bible AI',
            path: '/api/ai/bible',
            description: 'Chat with Bible AI.',
            methods: ['POST'],
            status: 'online',
            parameters: [
                {
                    name: 'text',
                    type: 'string',
                    description: 'Your question or message for the Bible AI.',
                    required: true,
                },
            ],
        },
        {
            name: 'Powerbrain AI',
            path: '/api/ai/powerbrain',
            description: 'Chat with Powerbrain AI.',
            methods: ['POST'],
            status: 'online',
            parameters: [
                {
                    name: 'text',
                    type: 'string',
                    description: 'Your question for Powerbrain AI.',
                    required: true,
                },
            ],
        },
        {
          name: 'Turbo DALL-E',
          path: '/api/ai/turbo-dalle',
          description: 'Generate images with TurboChat DALL-E.',
          methods: ['POST'],
          status: 'online',
          parameters: [
            {
              name: 'prompt',
              type: 'string',
              description: 'The prompt for image generation.',
              required: true,
            },
          ],
        },
        {
          name: 'Turbo GPT-3.5',
          path: '/api/ai/turbo-gpt3',
          description: 'Chat with TurboChat GPT-3.5.',
          methods: ['POST'],
          status: 'online',
          parameters: [
            {
              name: 'message',
              type: 'string',
              description: 'Your message for GPT-3.5.',
              required: true,
            },
          ],
        },
        {
          name: 'Turbo Gemini',
          path: '/api/ai/turbo-gemini',
          description: 'Chat with TurboChat Gemini.',
          methods: ['POST'],
          status: 'online',
          parameters: [
            {
              name: 'prompt',
              type: 'string',
              description: 'Your prompt for Gemini.',
              required: true,
            },
          ],
        },
        {
          name: 'Muslim AI',
          path: '/api/ai/muslimai',
          description: 'Get answers from a Muslim AI assistant.',
          methods: ['POST'],
          status: 'online',
          parameters: [
            {
              name: 'query',
              type: 'string',
              description: 'Your question for the Muslim AI.',
              required: true,
            },
          ],
        },
        {
          name: 'Flux AI Image Describe',
          path: '/api/ai/fluxai',
          description: 'Describe an image using Flux AI.',
          methods: ['POST'],
          status: 'online',
          parameters: [
            {
              name: 'url',
              type: 'string',
              description: 'The URL of the image to describe.',
              required: true,
            },
          ],
        },
        {
            name: 'Gock AI Prompt',
            path: '/api/ai/gock/prompt',
            description: 'Generate a prompt for an image or video.',
            methods: ['POST'],
            status: 'online',
            parameters: [
                { name: 'prompt', type: 'string', description: 'The description to generate a prompt from.', required: true },
                { name: 'type', type: 'select', description: 'Type of prompt to generate.', required: false, options: ['flux', 'video'] },
                { name: 'model', type: 'select', description: 'The AI model to use.', required: false, options: ['google:gemini-2.0-flash', 'google:gemini-2.0-flash-lite', 'google:gemini-2.5-flash', 'together:meta-llama/Llama-3.3-70B-Instruct-Turbo-Free'] },
                { name: 'number', type: 'string', description: 'Number of prompts to generate.', required: false },
            ],
        },
        {
            name: 'Gock AI Review',
            path: '/api/ai/gock/review',
            description: 'Enhance text with a specific style.',
            methods: ['POST'],
            status: 'online',
            parameters: [
                { name: 'prompt', type: 'string', description: 'The text to review and enhance.', required: true },
                { name: 'style', type: 'select', description: 'The writing style to apply.', required: false, options: ['technical', 'business', 'marketing', 'buzzword'] },
                { name: 'model', type: 'select', description: 'The AI model to use.', required: false, options: ['google:gemini-2.0-flash', 'google:gemini-2.0-flash-lite', 'google:gemini-2.5-flash', 'together:meta-llama/Llama-3.3-70B-Instruct-Turbo-Free'] },
                { name: 'system', type: 'string', description: 'Optional system prompt.', required: false },
            ],
        },
        {
            name: 'Gock AI Code',
            path: '/api/ai/gock/code',
            description: 'Generate HTML code from a prompt.',
            methods: ['POST'],
            status: 'online',
            parameters: [
                { name: 'prompt', type: 'string', description: 'The description of the HTML to generate.', required: true },
                { name: 'model', type: 'select', description: 'The AI model to use.', required: false, options: ['google:gemini-2.0-flash', 'google:gemini-2.0-flash-lite', 'google:gemini-2.5-flash', 'together:meta-llama/Llama-3.3-70B-Instruct-Turbo-Free'] },
            ],
        },
        {
          name: 'AI Copilot',
          path: '/api/ai/copilot',
          description: 'A versatile AI tool for text manipulation.',
          methods: ['POST'],
          status: 'online',
          parameters: [
            { name: 'text', type: 'string', description: 'The input text to process.', required: true },
            {
              name: 'module',
              type: 'select',
              description: 'The AI module to use.',
              required: true,
              options: ['SUMMARIZE', 'PARAPHRASE', 'EXPAND', 'TONE', 'TRANSLATE', 'REPLY', 'GRAMMAR'],
            },
            { name: 'to', type: 'string', description: 'The target for the module (e.g., language, tone, reply length).', required: false },
            { name: 'customTone', type: 'string', description: "Custom tone if module is 'TONE' and 'to' is 'Other'.", required: false },
          ],
        },
      ],
    },
    manga: {
        name: 'Manga',
        description: 'Endpoints for fetching manga and comic data.',
        endpoints: [
            {
                name: 'Komikindo Home',
                path: '/api/manga/komikindo/home',
                description: 'Get popular and newest comics from Komikindo.',
                methods: ['GET'],
                status: 'online',
                parameters: [],
            },
            {
                name: 'Komikindo Search',
                path: '/api/manga/komikindo/search',
                description: 'Search for comics on Komikindo.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'query',
                        type: 'string',
                        description: 'The search query for the comic.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Komikindo Detail',
                path: '/api/manga/komikindo/detail',
                description: 'Get details of a specific comic from Komikindo.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The URL of the comic.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Komikindo Chapter List',
                path: '/api/manga/komikindo/chapterlist',
                description: 'Get the list of chapters for a comic from Komikindo.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The URL of the comic to get the chapter list from.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Komikindo Chapter',
                path: '/api/manga/komikindo/chapter',
                description: 'Get all images for a specific chapter from Komikindo.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The URL of the chapter to read.',
                        required: true,
                    },
                ],
            },
        ],
    },
    anime: {
        name: 'Anime',
        description: 'Endpoints for fetching anime-related data.',
        endpoints: [
            {
                name: 'Livechart',
                path: '/api/anime/livechart',
                description: 'Get anime release schedule from Livechart.me.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'date',
                        type: 'string',
                        description: 'The date to get schedule for (YYYY-MM-DD). Defaults to today.',
                        required: false,
                    },
                ],
            },
        ],
    },
    news: {
        name: 'News',
        description: 'Endpoints for fetching news from various sources.',
        endpoints: [
            {
                name: 'Kompas News',
                path: '/api/news/kompas',
                description: 'Get the latest and popular news from Kompas.com.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [],
            },
        ],
    },
    resep: {
        name: 'Resep',
        description: 'Endpoints for searching and getting recipes.',
        endpoints: [
            {
                name: 'Cari Resep (FatSecret)',
                path: '/api/resep/search',
                description: 'Search for recipes on mobile.fatsecret.co.id.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'query',
                        type: 'string',
                        description: 'The recipe to search for.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Detail Resep (FatSecret)',
                path: '/api/resep/detail',
                description: 'Get details for a specific recipe from mobile.fatsecret.co.id.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The recipe URL from FatSecret.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Update Resep (FatSecret)',
                path: '/api/resep/updated',
                description: 'Get the latest updated recipes from mobile.fatsecret.co.id.',
                methods: ['GET'],
                status: 'online',
                parameters: [],
            },
        ],
    },
    search: {
        name: 'Search',
        description: 'Endpoints for searching various content.',
        endpoints: [
            {
              name: 'Cuaca',
              path: '/api/search/cuaca',
              description: 'Get weather information for a specific location in Indonesia from BMKG.',
              methods: ['GET', 'POST'],
              status: 'online',
              parameters: [
                {
                  name: 'query',
                  type: 'string',
                  description: 'The location name to get weather for.',
                  required: true,
                },
              ],
            },
            {
                name: 'Sfile Search',
                path: '/api/search/sfile',
                description: 'Search for files on sfile.mobi.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'query',
                        type: 'string',
                        description: 'The search query.',
                        required: true,
                    },
                    {
                        name: 'page',
                        type: 'string',
                        description: 'The page number to search.',
                        required: false,
                    },
                ],
            },
            {
                name: 'Lyrics Search',
                path: '/api/search/lyrics',
                description: 'Search for song lyrics by title.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'title',
                        type: 'string',
                        description: 'The title of the song to search for.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Resep (Cookpad)',
                path: '/api/search/resep',
                description: 'Search for recipes on cookpad.com.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'query',
                        type: 'string',
                        description: 'The recipe to search for.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Search Club',
                path: '/api/search/club',
                description: 'Search for a football club.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'query',
                        type: 'string',
                        description: 'The name of the club to search for.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Info Club',
                path: '/api/search/club-info',
                description: 'Get information about a specific football club.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The URL of the club from the search results.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Anime Finder',
                path: '/api/search/animefinder',
                description: 'Find anime from an image.',
                methods: ['POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'image',
                        type: 'file',
                        description: 'The image file to search for.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Kode Pos',
                path: '/api/search/kodepos',
                description: 'Search for Indonesian postal codes.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'query',
                        type: 'string',
                        description: 'The location name to search for.',
                        required: true,
                    },
                ],
            }
        ],
    },
    downloaders: {
        name: 'Downloaders',
        description: 'Endpoints for downloading content from various sources.',
        endpoints: [
            {
                name: 'Sfile Downloader',
                path: '/api/downloaders/sfile',
                description: 'Download files from sfile.mobi.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The sfile.mobi URL.',
                        required: true,
                    },
                ],
            },
            {
                name: 'TikTok Downloader v1',
                path: '/api/downloaders/tiktok/v1',
                description: 'Download TikTok videos without watermark (method 1).',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The TikTok video URL.',
                        required: true,
                    },
                ],
            },
            {
                name: 'TikTok Downloader v2',
                path: '/api/downloaders/tiktok/v2',
                description: 'Download TikTok videos without watermark (method 2).',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The TikTok video URL.',
                        required: true,
                    },
                ],
            },
             {
                name: 'Capcut Downloader',
                path: '/api/downloaders/capcut',
                description: 'Download Capcut videos without watermark.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The Capcut video URL.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Mediafire Downloader',
                path: '/api/downloaders/mediafire',
                description: 'Download files from Mediafire.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The Mediafire URL.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Spotify Downloader',
                path: '/api/downloaders/spotify',
                description: 'Download tracks from Spotify.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The Spotify track URL.',
                        required: true,
                    },
                ],
            },
             {
                name: 'X Downloader',
                path: '/api/downloaders/x',
                description: 'Download videos from X (Twitter).',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The X (Twitter) post URL.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Douyin Downloader',
                path: '/api/downloaders/douyin',
                description: 'Download videos and audio from Douyin.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The Douyin video URL.',
                        required: true,
                    },
                ],
            },
            {
                name: 'SoundCloud Downloader',
                path: '/api/downloaders/soundcloud',
                description: 'Download audio from SoundCloud.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The SoundCloud track URL.',
                        required: true,
                    },
                ],
            },
        ],
    },
    tools: {
        name: 'Tools',
        description: 'Utility and tool-based endpoints.',
        endpoints: [
            {
                name: 'Image Upscaler',
                path: '/api/tools/imgupscaler',
                description: 'Upscale an image to a higher resolution (2x or 4x).',
                methods: ['POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'image',
                        type: 'file',
                        description: 'The image file to upscale.',
                        required: true,
                    },
                    {
                        name: 'scale',
                        type: 'select',
                        description: 'The upscaling ratio.',
                        required: true,
                        options: ['2', '4'],
                    },
                ],
            },
            {
              name: 'Short URL',
              path: '/api/tools/shorturl',
              description: 'Shorten a long URL.',
              methods: ['GET', 'POST'],
              status: 'online',
              parameters: [
                {
                  name: 'url',
                  type: 'string',
                  description: 'The URL to shorten.',
                  required: true,
                },
              ],
            },
            {
                name: 'Speed Test',
                path: '/api/tools/speedtest',
                description: 'Perform a network speed test.',
                methods: ['GET'],
                status: 'online',
                parameters: [],
            },
            {
                name: 'ToURL (Top4Top)',
                path: '/api/tools/tourl-top4top',
                description: 'Upload a file to Top4Top and get a direct link.',
                methods: ['POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'file',
                        type: 'file',
                        description: 'The file to upload.',
                        required: true,
                    },
                ],
            },
            {
                name: 'ToURL (Zenz)',
                path: '/api/tools/tourl-zenz',
                description: 'Upload a file to Zenz uploader and get a direct link.',
                methods: ['POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'file',
                        type: 'file',
                        description: 'The file to upload.',
                        required: true,
                    },
                ],
            },
            {
                name: 'OCR',
                path: '/api/tools/ocr',
                description: 'Extract text from an image using a URL.',
                methods: ['POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The URL of the image to process.',
                        required: true,
                    },
                    {
                        name: 'lang',
                        type: 'select',
                        description: 'The language of the text in the image.',
                        required: false,
                        options: ['eng', 'ind', 'ara', 'deu', 'spa', 'fra', 'jpn', 'kor', 'rus'],
                    },
                ],
            },
            {
                name: 'YouTube Summarizer',
                path: '/api/tools/ytsummarizer',
                description: 'Summarize a YouTube video from its URL.',
                methods: ['POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The URL of the YouTube video.',
                        required: true,
                    },
                    {
                        name: 'lang',
                        type: 'select',
                        description: 'The language for the summary.',
                        required: false,
                        options: ['id', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'it', 'pt', 'ru'],
                    },
                ],
            },
        ],
    },
    stalk: {
        name: 'Stalk',
        description: 'Endpoints for stalking social media profiles.',
        endpoints: [
            {
                name: 'Twitter Stalk',
                path: '/api/stalk/twitter',
                description: 'Get profile and tweets from a Twitter user.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'usn',
                        type: 'string',
                        description: 'The Twitter username to stalk.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Youtube Analyzer',
                path: '/api/stalk/youtube',
                description: 'Get statistics for a YouTube channel.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The YouTube channel URL to analyze.',
                        required: true,
                    },
                ],
            },
            {
                name: 'IG Stalk',
                path: '/api/stalk/ig',
                description: 'Get profile information and posts for an Instagram user.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'username',
                        type: 'string',
                        description: 'The Instagram username to stalk.',
                        required: true,
                    },
                ],
            },
            {
                name: 'TikTok Stalk',
                path: '/api/stalk/tiktok',
                description: 'Get profile information and videos for a TikTok user.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'username',
                        type: 'string',
                        description: 'The TikTok username to stalk.',
                        required: true,
                    },
                    {
                        name: 'limit',
                        type: 'string',
                        description: 'The number of videos to fetch (default: 10).',
                        required: false,
                    },
                ],
            },
            {
                name: 'Playlist Analyzer',
                path: '/api/stalk/playlist-analyzer',
                description: 'Analyze a Spotify playlist.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The Spotify playlist URL.',
                        required: true,
                    },
                ],
            },
        ]
    },
    random: {
        name: 'Random',
        description: 'Endpoints for getting random data like wallpapers.',
        endpoints: [
            {
                name: 'Wallpaper',
                path: '/api/random/wallpaper',
                description: 'Get a list of wallpapers.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'type',
                        type: 'select',
                        description: 'The type of wallpapers to fetch.',
                        required: true,
                        options: ['home', 'popular', 'featured', 'random', 'collection'],
                    },
                ],
            },
            {
                name: 'Wallpaper Search',
                path: '/api/random/wallpaper-search',
                description: 'Search for wallpapers.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'query',
                        type: 'string',
                        description: 'The search query.',
                        required: true,
                    },
                ],
            },
            {
                name: 'Wallpaper Download',
                path: '/api/random/wallpaper-download',
                description: 'Get download links for a specific wallpaper.',
                methods: ['GET', 'POST'],
                status: 'online',
                parameters: [
                    {
                        name: 'url',
                        type: 'string',
                        description: 'The URL of the wallpaper page.',
                        required: true,
                    },
                ],
            },
        ]
    }
  };
  
  export const getApiStatus = (path: string) => {
    for (const category in apiEndpoints) {
      const endpoint = apiEndpoints[category].endpoints.find(e => e.path === path);
      if (endpoint) {
        return { status: endpoint.status };
      }
    }
    return { status: 'offline' };
  };
  
  export type SiteConfig = typeof siteConfig;
  
