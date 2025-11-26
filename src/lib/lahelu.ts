export const LAHELU_FIELDS = {
  FOR_YOU: 5,
  FRESH: 6,
  VIRAL: 7,
} as const;

export type LaheluField = typeof LAHELU_FIELDS[keyof typeof LAHELU_FIELDS];

async function _mintaJson(pathName: string, urlSearchParams: Record<string, any>) {
  const url = new URL('https://lahelu.com');
  url.pathname = pathName;
  url.search = new URLSearchParams(urlSearchParams as any).toString();

  const response = await fetch(url.toString());
  if (!response.ok) throw Error(`${response.status} ${response.statusText} on ${pathName}. payload from server:\n${await response.text() || '(kosong)'}`);
  const json = await response.json();
  return json;
}

function _serialize(json: any, onWhat: string, cursor: number) {
  const result = (json.postInfos || []).map((p: any) => {
    return {
      title: p.title || `(no title)`,
      hashtag: (p.hashtags || []).join(', ') || `(no hastag)`,
      media: p?.content?.[0] || null,
    };
  });
  if (!result.length) throw Error(`tidak ada data ${onWhat} di index cursor ${cursor}`);
  return result;
}

export async function laheluSearch(query: string, cursor = 0) {
  if (typeof query !== 'string' || !query.trim().length) throw Error(`query harus string dan gak boleh kosong ya!`);
  const json = await _mintaJson('/api/post/get-search', { query, cursor });
  return _serialize(json, 'search', cursor);
}

export async function laheluRecommendations(field: LaheluField = LAHELU_FIELDS.FOR_YOU, cursor = 0) {
  const allowed = Object.values(LAHELU_FIELDS) as number[];
  if (!allowed.includes(field as number)) throw Error(`invalid field value`);
  const json = await _mintaJson('/api/post/get-recommendations', { field, cursor });
  return _serialize(json, 'rekomendasi', cursor);
}

export default {
  LAHELU_FIELDS,
  laheluSearch,
  laheluRecommendations,
};
