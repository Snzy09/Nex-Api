import axios from 'axios'

function pickRandom<T>(list: T[]) {
  return list[Math.floor(list.length * Math.random())]
}

export async function openAI(prompt: string) {
  const apiKey = [
    '662413cf9b2e4a09b8175abf38853f1c',
    'e7956e69c5634672982005bde27e9223',
    '077cf44364ac4c32b8263482ef4371f1',
    '53f034d6af90448eb08b9fd57306ca15',
    '99fca1d1f66c49f19ff5d62a06c5469c',
    'ac21b13204694f70b66ba9241cbb1af1',
    '5cdd70a6fb774a598dec30f739aa7532',
    '002c22a49f5b44aa833a84d5953b48fe',
    '271124eea23d48608c5eabfee5b670ae',
    '662413cf9b2e4a09b8175abf38853f1c',
  ]

  try {
    const response = await axios.post(
      'https://api.aimlapi.com/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 512,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + pickRandom(apiKey),
        },
      },
    )

    const choices = response.data?.choices?.[0]
    const mes = choices?.message?.content ?? ''

    return {
      status: true,
      creator: 'Sanzzy',
      message: typeof mes === 'string' ? mes : String(mes),
    }
  } catch (err: any) {
    console.error('openAI error', err?.response?.data ?? err.message ?? err)
    throw new Error(err?.response?.data?.error ?? err?.message ?? 'openAI request failed')
  }
}

export default openAI
