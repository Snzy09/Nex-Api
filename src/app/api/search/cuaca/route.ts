'use server';

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/settings/config';
import { appendLog } from '@/lib/filelogger'

const cuaca = {
    url: {
        api_search_geo: `https://cuaca.bmkg.go.id/api/df/v1/adm/search`,
        api_search_geo_2: `https://www.gps-coordinates.net/geoproxy`,
        api_cuaca: `https://weather.bmkg.go.id/api/presentwx/coord`,
        api_cuaca_warning: `https://cuaca.bmkg.go.id/api/v1/public/weather/warning`,
    },
    string: {
        gps: '9416bf2c8b1d4751be6a9a9e94ea85ca',
        bmkg: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFjNWFkZWUxYzY5MzM0NjY2N2EzZWM0MWRlMjBmZWZhNDcxOTNjYzcyZDgwMGRiN2ZmZmFlMWVhYjcxZGYyYjQiLCJpYXQiOjE3MDE1ODMzNzl9.D1VNpMoTUVFOUuQW0y2vSjttZwj0sKBX33KyrkaRMcQ'
    },
    baseHeaders: {
        'accept-encoding': 'gzip, deflate, br, zstd',
    },
    validateCoordinate: function (what: string, input: number, startLimit: number, endLimit: number) {
        let lat = parseFloat(input.toString());
        if (isNaN(lat) || !(lat >= startLimit && lat <= endLimit)) throw new Error(`${what}`);
    },
    validasiString: function (deskripsi: string, variabel: any) {
        if (typeof (variabel) !== "string" || !variabel?.toString()?.trim().length) throw new Error(`param ${deskripsi} harus string/number dan gak boleh kosong!`);
    },
    mintaJson: async function (description: string, url: URL, fetchOptions: RequestInit) {
        try {
            const response = await fetch(url.toString(), fetchOptions);
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}\n${await response.text()}`);
            const json = await response.json();
            return json;
        } catch (error: any) {
            throw new Error(`gagal minta json: ${description}\nerror: ${error.message}`);
        }
    },
    cariKoordinat: async function (lokasiKamu: string): Promise<{ placeName: string, latitude: number, longitude: number }> {
        "use strict";
        this.validasiString(`lokasi`, lokasiKamu);
        const new_url = new URL(`https://www.google.com/s`);
        new_url.search = '?' + new URLSearchParams({
            "tbm": "map",
            "gs_ri": "maps",
            "suggest": "p",
            "authuser": "0",
            "hl": "en",
            "gl": "id",
            "psi": "2OKJaLzkJKOe4-EPttbSoQQ.1753866977195.1",
            "q": lokasiKamu,
            "ech": "22",
            "pb": "!2i22!4m12!1m3!1d130622.22!2d22.22!3d-22.22!2m3!1f0!2f0!3f0!3m2!1i477!2i636!4f13.1!7i20!10b1!12m24!1m5!18b1!30b1!31m1!1b1!34e1!2m3!5m1!6e2!20e3!10b1" +
                "!12b1!13b1!16b1!17m1!3e1!20m4!5e2!6b1!8b1!14b1!46m1!1b0!96b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m33" +
                "!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!1m3!1e9!2b1!3e2!2b1!9b0!15m8!1m7!1m2!1m1!1e2" +
                "!2m2!1i195!2i195!3i20!22m3!1s2OKJaLzkJKOe4-EPttbSoQQ!7e81!17s2OKJaLzkJKOe4-EPttbSoQQ:79!23m2!4b1!10b1!24m112!1m32!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m21" +
                "!3b1!4b1!5b1!6b1!9b1!12b1!13b1!14b1!17b1!20b1!21b1!22b1!25b1!27m1!1b0!28b0!32b1!33m1!1b1!34b1!36e2!10m1!8e3!11m1!3e1!14m1!3b0!17b1!20m2!1e3!1e6!24b1!25b1!26b1!27b1" +
                "!29b1!30m1!2b1!36b1!37b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m1!1b1!61m2!1m1!1e1!65m5!3m4!1m3!1m2!1i224!2i298!72m22!1m8!2b1!5b1!7b1!12m4!1b1!2b1!4m1!1e1!4b1!8m10" +
                "!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_google_review_posts__and__hotel_and_vr_partner_review_posts!6m1!1e1!9b1!89b1!98m3!1b1!2b1!3b1!103b1!113b1!114m3!1b1!2m1!1b1!117b1" +
                "!122m1!1b1!125b0!126b1!127b1!26m4!2m3!1i80!2i92!4i8!34m19!2b1!3b1!4b1!6b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!31b1!37m1!1e81!47m0!49m10!3b1!6m2!1b1!2b1!7m2!1e3!2b1!8b1!9b1!10e2!61b1!67m5!7b1!10b1!14b1!15m1!1b0!69i742"
        });
        const response = await fetch(new_url.toString(), { headers: this.baseHeaders as HeadersInit });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}. google maps not ok!`);
        const data = await response.text();
        const hasil = data.split("\n")[1]?.trim();
        if (!hasil) throw new Error(`Could not parse Google Maps response for ${lokasiKamu}`);

        const ar = eval(hasil);

        const flatArray = [...new Set(ar.flat(7).filter((v: any) => v))];
        const dumpKoordinat = flatArray.filter(v => typeof (v) != "string" && !Number.isInteger(v)) as number[];
        const latitude = dumpKoordinat[0];
        const longitude = dumpKoordinat[1];
        const dumpPlace = flatArray.filter(v => typeof (v) === "string") as string[];
        const placeName = dumpPlace[1]?.split(", ")[0];
        const result = { placeName, latitude, longitude };

        if (!longitude || !latitude) throw new Error(`gagal mendapatkan koordinat ${lokasiKamu}`);
        return result;
    },
    getWeatherByCoordinateBMKG: async function (latitude: number, longitude: number, placeName: string = "") {
        try {
            this.validateCoordinate(`latitude`, latitude, -12, 7);
            this.validateCoordinate(`longitude`, longitude, 93, 142);
        } catch (error: any) {
            throw new Error("aduh... gak ada data cuaca... " + error.message + "nya kejauhan wkwk");
        }

        const padEnd = 0;
        const namaTempat = placeName.trim().length ? "📌 nama: ".padEnd(padEnd) + placeName + '\n' : '';
        const cuacaApi = new URL(this.url.api_cuaca);
        cuacaApi.search = '?' + new URLSearchParams({ lon: longitude.toString(), lat: latitude.toString() }).toString();

        const cuacaWarningApi = new URL(this.url.api_cuaca_warning);
        cuacaWarningApi.search = '?' + new URLSearchParams({ lat: latitude.toString(), long: longitude.toString() }).toString();
        const cuacaWarningHeaders = { 'X-api-key': this.string.bmkg, ...this.baseHeaders };

        const allRequest = [
            this.mintaJson(`cuaca`, cuacaApi, { headers: this.baseHeaders as HeadersInit }),
            this.mintaJson(`cuaca warning`, cuacaWarningApi, { headers: cuacaWarningHeaders as HeadersInit })
        ];
        const [cuacaJson, cuacaWarningJson] = await Promise.all(allRequest);

        const { provinsi, kotkab, kecamatan, desa, adm4 } = cuacaJson.data.lokasi;
        const lokasi = `${desa}, ${kecamatan}, ${kotkab}, ${provinsi}`;
        const { weather_desc, weather_desc_en, local_datetime, t, tcc, wd_deg, wd, wd_to, ws, hu, vs, vs_text } = cuacaJson.data.cuaca;
        const arahAngin: Record<string, string> = { N: 'utara', NE: "timur laut", E: 'timur', SE: 'tenggara', S: 'selatan', SW: 'barat daya', W: 'barat', NW: 'barat laut' };
        const angin = `angin bertiup dari ${arahAngin[wd]} ke ${arahAngin[wd_to]} dengan kecepatan ${ws} km/jam. sudut arah ${wd_deg}°`;
        const cuacaText = "📍 lokasi: ".padEnd(padEnd) + lokasi + "\n" +
            "🕒 waktu: ".padEnd(padEnd) + local_datetime.split(" ")[1] + " (waktu setempat)\n" +
            "🌄 cuaca: ".padEnd(padEnd) + weather_desc + "/" + weather_desc_en + "\n" +
            "🔥 suhu: ".padEnd(padEnd) + t + "°C\n" +
            "💧 kelembapan: ".padEnd(padEnd) + hu + "%\n" +
            "🌁 tutupan awan: ".padEnd(padEnd) + tcc + "%\n" +
            "👓 jarak pandang: ".padEnd(padEnd) + vs_text + " (" + vs + " m)" + "\n" +
            "💨 angin: ".padEnd(padEnd) + angin;

        let dampak = cuacaWarningJson.data?.today?.kategoridampak;
        const peringatan = cuacaWarningJson.data?.today?.description?.description?.trim() || `(tidak ada)`;
        dampak = dampak ? JSON.parse(dampak.replaceAll(`'`, `"`))?.join(", ") : `(tidak ada)`;
        const cuacaWarning = "😱 dampak: ".padEnd(padEnd) + dampak + "\n" +
            "🚨 peringatan: ".padEnd(padEnd) + peringatan;

        const bmkgUrl = "🔗 bmkg: ".padEnd(padEnd) + `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${adm4}`;
        const gmapUrl = "🔗 google map: ".padEnd(padEnd) + `https://www.google.com/maps?q=${latitude},${longitude}`;

        return namaTempat + cuacaText + '\n\n' + cuacaWarning + '\n\n' + bmkgUrl + '\n' + gmapUrl;
    },
    run: async function (lokasiKamu: string) {
        const wolep = await this.cariKoordinat(lokasiKamu);
        const { latitude, longitude, placeName } = wolep;
        const result = await this.getWeatherByCoordinateBMKG(latitude, longitude, placeName);
        return result;
    }
};


async function handleRequest(req: NextRequest, body?: any) {
    const start = Date.now()
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '')
    const method = req.method
    const query = body?.query?.trim() || req.nextUrl.searchParams.get('query')?.trim();
    if (!query) {
        await appendLog({ method, path: fullPath, status: 400, responseTimeMs: Date.now() - start, message: 'missing query' }).catch(()=>{})
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Query parameter is required' }, { status: 400 });
    }

    try {
        const result = await cuaca.run(query);
        await appendLog({ method, path: fullPath, status: 200, responseTimeMs: Date.now() - start }).catch(()=>{})
        return NextResponse.json({
            status: true,
            creator: siteConfig.api.creator,
            data: result,
        });
    } catch (err: any) {
        console.error('Cuaca error:', err);
        await appendLog({ method, path: fullPath, status: 500, responseTimeMs: Date.now() - start, error: String(err) }).catch(()=>{})
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
    } catch (err) {
        return NextResponse.json({ status: false, creator: siteConfig.api.creator, error: 'Invalid JSON body' }, { status: 400 });
    }
}
