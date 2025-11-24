'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import dayjs from 'dayjs';
import { siteConfig } from '@/settings/config';

async function cariLoker(pekerjaan: string, kota: string, jumlah: number = 10) {
  if (!pekerjaan || !kota) throw new Error('Parameter "pekerjaan" dan "kota" harus diisi');

  const url = 'https://jobsearch-api.cloud.seek.com.au/v5/search';
  const params = {
    keywords: pekerjaan,
    where: kota,
    sitekey: 'ID',
    sourcesystem: 'houston',
    pageSize: jumlah,
    page: 1,
    locale: 'id-ID',
  };

  const res = await axios.get(url, { params, timeout: 10000 });
  const jobs = res.data?.data || [];

  if (!jobs || jobs.length === 0) {
    return { text: '❌ Tidak ada lowongan ditemukan.', jobs: [] };
  }

  let hasil = `📌 *Hasil Pencarian Lowongan*\n🔍 ${pekerjaan} di ${kota}\n\n`;
  jobs.forEach((job: any, i: number) => {
    const judul = job.title || '-';
    const perusahaan = job.companyName || '-';
    const lokasi = job.locations?.[0]?.label || '-';
    const tanggal = job.listingDate ? dayjs(job.listingDate).format('DD MMM YYYY') : '-';
    const gaji = job.salaryLabel || '❌ Tidak dicantumkan';
    const deskripsi = job.teaser || '-';
    const logo = job.branding?.serpLogoUrl || '-';
    const tautan = `https://id.jobstreet.com/job/${job.id}`;

    hasil += `*${i + 1}. ${judul}*\n`;
    hasil += `🏢 Perusahaan : ${perusahaan}\n`;
    hasil += `📍 Lokasi     : ${lokasi}\n`;
    hasil += `🗓️ Tanggal   : ${tanggal}\n`;
    hasil += `💰 Gaji      : ${gaji}\n`;
    hasil += `📄 Deskripsi : ${deskripsi}\n`;
    hasil += `🖼 Logo      : ${logo}\n`;
    hasil += `🔗 Link      : ${tautan}\n`;
    hasil += `───────────────────────────────\n`;
  });

  return { text: hasil, jobs };
}

async function handleRequest(req: NextRequest, body?: any) {
  const pekerjaan = (body?.pekerjaan ?? req.nextUrl.searchParams.get('pekerjaan') ?? body?.q ?? req.nextUrl.searchParams.get('q'))?.toString()?.trim();
  const kota = (body?.kota ?? req.nextUrl.searchParams.get('kota') ?? body?.city ?? req.nextUrl.searchParams.get('city'))?.toString()?.trim();
  const jumlahRaw = (body?.jumlah ?? req.nextUrl.searchParams.get('jumlah'))?.toString();
  const jumlah = jumlahRaw ? Number(jumlahRaw) : 10;

  if (!pekerjaan || !kota) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Parameters "pekerjaan" and "kota" are required.' }, { status: 400 });
  }

  try {
    const result = await cariLoker(pekerjaan, kota, jumlah);
    return NextResponse.json({ status: true, creator: siteConfig.api.creator, data: result });
  } catch (err: any) {
    console.error('CariLoker error:', err);
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return handleRequest(req, body);
  } catch (err: any) {
    return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Invalid JSON body' }, { status: 400 });
  }
}
