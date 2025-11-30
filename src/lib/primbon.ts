import axios from 'axios'
import cheerio from 'cheerio'

export class Primbon {
  base_url: string
  constructor({ base_url }: { base_url?: string } = {}) {
    this.base_url = base_url || 'https://primbon.com/'
  }

  async nomer_hoki(nomor: string) {
    const res = await axios.post(this.base_url + 'no_hoki_bagua_shuzi.php', new URLSearchParams(Object.entries({ nomer: nomor, submit: ' Submit! ' })), { headers: { 'content-type': 'application/x-www-form-urlencoded' } })
    const $ = cheerio.load(res.data)
    const fetchText = $('#body').text().trim()
    try {
      return {
        status: true,
        result: {
          nomer_hp: fetchText.split('No. HP : ')[1].split('\n')[0],
          angka_shuzi: fetchText.split('Angka Bagua Shuzi : ')[1].split('\n')[0]
        }
      }
    } catch (e) {
      return { status: false, message: 'No. Handphone Tidak Valid' }
    }
  }

  async tafsir_mimpi(value: string) {
    const res = await axios.get('https://primbon.com/tafsir_mimpi.php?mimpi=' + encodeURIComponent(value) + '&submit=+Submit+')
    const $ = cheerio.load(res.data)
    const fetchText = $('#body').text()
    try {
      return { status: true, result: { mimpi: value, arti: fetchText.split(`Hasil pencarian untuk kata kunci: ${value}`)[1].split('\n')[0] } }
    } catch (e) {
      return { status: false, message: `Tidak ditemukan tafsir mimpi "${value}"` }
    }
  }

  async ramalan_jodoh(n1: string, d1: string, m1: string, y1: string, n2: string, d2: string, m2: string, y2: string) {
    const res = await axios.post(this.base_url + 'ramalan_jodoh.php', new URLSearchParams(Object.entries({ nama1: n1, tgl1: d1, bln1: m1, thn1: y1, nama2: n2, tgl2: d2, bln2: m2, thn2: y2, submit: '  RAMALAN JODOH »  ' })), { headers: { 'content-type': 'application/x-www-form-urlencoded' } })
    const $ = cheerio.load(res.data)
    const fetchText = $('#body').text()
    try {
      return { status: true, result: { nama_anda: n1, nama_pasangan: n2, result: fetchText.split('begitu pula sebaliknya.')[1].split('Konsultasi Hari Baik Akad Nikah >>>')[0].trim() } }
    } catch (e) {
      return { status: false, message: 'Input mungkin salah' }
    }
  }

  // For brevity implement a generic POST->parse pattern for many endpoints
  private async postAndText(path: string, params: Record<string, any>) {
    const res = await axios.post(this.base_url + path, new URLSearchParams(Object.entries(params)), { headers: { 'content-type': 'application/x-www-form-urlencoded' } })
    const $ = cheerio.load(res.data)
    return $('#body').text()
  }

  async ramalan_jodoh_bali(...args: string[]) {
    try {
      const txt = await this.postAndText('ramalan_jodoh_bali.php', { nama1: args[0], tgl1: args[1], bln1: args[2], thn1: args[3], nama2: args[4], tgl2: args[5], bln2: args[6], thn2: args[7], submit: ' Submit! ' })
      return { status: true, result: txt.split('HASILNYA MENURUT PAL SRI SEDANAI. ')[1].split('Konsultasi Hari Baik Akad Nikah >>>')[0].trim() }
    } catch { return { status: false, message: 'Error' } }
  }

  async suami_istri(...args: string[]) {
    try {
      const txt = await this.postAndText('suami_istri.php', { nama1: args[0], tgl1: args[1], bln1: args[2], thn1: args[3], nama2: args[4], tgl2: args[5], bln2: args[6], thn2: args[7], submit: ' Submit! ' })
      return { status: true, result: txt.split('HASIL RAMALAN MENURUT USIA PERNIKAHAN')[1].split('Konsultasi Hari Baik Akad Nikah >>>')[0].trim() }
    } catch { return { status: false, message: 'Error' } }
  }

  async ramalan_cinta(...args: string[]) {
    try {
      const txt = await this.postAndText('ramalan_cinta.php', { nama1: args[0], tanggal1: args[1], bulan1: args[2], tahun1: args[3], nama2: args[4], tanggal2: args[5], bulan2: args[6], tahun2: args[7], submit: ' Submit! ' })
      return { status: true, result: txt.split('Sisi Positif Anda: ')[1].split('Sisi Negatif Anda:')[0].trim() }
    } catch { return { status: false, message: 'Error' } }
  }

  async arti_nama(value: string) {
    try {
      const txt = await axios.get('https://primbon.com/arti_nama.php?nama1=' + encodeURIComponent(value) + '&proses=+Submit%21+')
      const $ = cheerio.load(txt.data)
      const fetchText = $('#body').text()
      return { status: true, result: fetchText.split('memiliki arti: ')[1].split('Nama:')[0].trim() }
    } catch { return { status: false, message: 'Not found' } }
  }

  // many other helpers can reuse postAndText; implement a few representative ones
  async kecocokan_nama(nama: string, tgl: string, bln: string, thn: string) {
    try {
      const txt = await this.postAndText('kecocokan_nama.php', { nama, tgl, bln, thn, kirim: ' Submit! ' })
      return { status: true, result: txt.split('Life Path Number : ')[1].split('\n')[0] }
    } catch { return { status: false, message: 'Error' } }
  }

  async zodiak(z: string) {
    try {
      const res = await axios.get(`https://primbon.com/zodiak/${z}.htm`)
      const $ = cheerio.load(res.data)
      const fetchText = $('#body').text()
      return { status: true, result: fetchText.split('Nomor Keberuntungan:')[0].trim() }
    } catch { return { status: false, message: 'Error' } }
  }

  async shio(s: string) {
    try {
      const res = await axios.get(`https://primbon.com/shio/${s}.htm`)
      const $ = cheerio.load(res.data)
      const fetchText = $('#body').text()
      return { status: true, result: fetchText.split('<<< Kembali')[0].trim() }
    } catch { return { status: false, message: 'Error' } }
  }
}

export default Primbon
