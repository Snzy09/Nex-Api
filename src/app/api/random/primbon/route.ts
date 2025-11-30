import { NextResponse } from 'next/server'
import { Primbon } from '@/lib/primbon'

const p = new Primbon()

const featureMap: Record<string, { fn: string; params: string[] }> = {
  nh: { fn: 'nomer_hoki', params: ['nomor'] },
  tm: { fn: 'tafsir_mimpi', params: ['q'] },
  rj: { fn: 'ramalan_jodoh', params: ['n1', 'd1', 'm1', 'y1', 'n2', 'd2', 'm2', 'y2'] },
  rjb: { fn: 'ramalan_jodoh_bali', params: ['n1', 'd1', 'm1', 'y1', 'n2', 'd2', 'm2', 'y2'] },
  sj: { fn: 'suami_istri', params: ['n1', 'd1', 'm1', 'y1', 'n2', 'd2', 'm2', 'y2'] },
  rc: { fn: 'ramalan_cinta', params: ['n1', 'd1', 'm1', 'y1', 'n2', 'd2', 'm2', 'y2'] },
  an: { fn: 'arti_nama', params: ['q'] },
  kn: { fn: 'kecocokan_nama', params: ['nama', 'd', 'm', 'y'] },
  zodiac: { fn: 'zodiak', params: ['q'] },
  shio: { fn: 'shio', params: ['q'] },
}

// Extended short codes for additional Primbon features
Object.assign(featureMap, {
  knp: { fn: 'kecocokan_nama_pasangan', params: ['n1', 'n2'] },
  tjp: { fn: 'tanggal_jadian_pernikahan', params: ['d', 'm', 'y'] },
  sub: { fn: 'sifat_usaha_bisnis', params: ['d', 'm', 'y'] },
  rhw: { fn: 'rejeki_hoki_weton', params: ['d', 'm', 'y'] },
  pwl: { fn: 'pekerjaan_weton_lahir', params: ['d', 'm', 'y'] },
  rn: { fn: 'ramalan_nasib', params: ['d', 'm', 'y'] },
  cpp: { fn: 'cek_potensi_penyakit', params: ['d', 'm', 'y'] },
  akt: { fn: 'arti_kartu_tarot', params: ['d', 'm', 'y'] },
  pfs: { fn: 'perhitungan_feng_shui', params: ['nama', 'gender', 'tahun'] },
  phb: { fn: 'petung_hari_baik', params: ['d', 'm', 'y'] },
  hst: { fn: 'hari_sangar_taliwangke', params: ['d', 'm', 'y'] },
  phn: { fn: 'primbon_hari_naas', params: ['d', 'm', 'y'] },
  rnh: { fn: 'rahasia_naga_hari', params: ['d', 'm', 'y'] },
  par: { fn: 'primbon_arah_rejeki', params: ['d', 'm', 'y'] },
  rper: { fn: 'ramalan_peruntungan', params: ['nama', 'd', 'm', 'y', 'untuk'] },
  wj: { fn: 'weton_jawa', params: ['d', 'm', 'y'] },
  skt: { fn: 'sifat_karakter_tanggal_lahir', params: ['nama', 'd', 'm', 'y'] },
  pke: { fn: 'potensi_keberuntungan', params: ['nama', 'd', 'm', 'y'] },
  pmi: { fn: 'primbon_memancing_ikan', params: ['d', 'm', 'y'] },
  msb: { fn: 'masa_subur', params: ['dateday', 'datemonth', 'dateyear', 'siklus'] },
})

function getParam(source: URLSearchParams, name: string) {
  return source.get(name) || ''
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const params = url.searchParams
    const f = params.get('f') || params.get('feature')
    if (!f) return NextResponse.json({ status: false, message: 'feature required (f=nh|tm|rj|...)' }, { status: 400 })
    const entry = featureMap[f]
    if (!entry) return NextResponse.json({ status: false, message: 'unknown feature' }, { status: 400 })
    const args = entry.params.map((k) => getParam(params, k))
    // call mapped function
    // @ts-ignore dynamic
    const res = await (p as any)[entry.fn](...args)
    return NextResponse.json({ status: true, category: 'random', feature: f, data: res })
  } catch (err: any) {
    return NextResponse.json({ status: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const f = body.f || body.feature
    if (!f) return NextResponse.json({ status: false, message: 'feature required (f)' }, { status: 400 })
    const entry = featureMap[f]
    if (!entry) return NextResponse.json({ status: false, message: 'unknown feature' }, { status: 400 })
    const args = entry.params.map((k) => body[k] || '')
    // @ts-ignore
    const res = await (p as any)[entry.fn](...args)
    return NextResponse.json({ status: true, category: 'random', feature: f, data: res })
  } catch (err: any) {
    return NextResponse.json({ status: false, error: String(err) }, { status: 500 })
  }
}

export const runtime = 'edge'
