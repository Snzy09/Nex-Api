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
      const hasil = {
        status: true,
        message: {
          nomer_hp: fetchText.split('No. HP : ')[1].split('\n')[0],
          angka_shuzi: fetchText.split('Angka Bagua Shuzi : ')[1].split('\n')[0],
          energi_positif: {
            kekayaan: fetchText.split('Kekayaan = ')[1].split('\n')[0],
            kesehatan: fetchText.split('Kesehatan = ')[1].split('\n')[0],
            cinta: fetchText.split('Cinta/Relasi = ')[1].split('\n')[0],
            kestabilan: fetchText.split('Kestabilan = ')[1].split('\n')[0],
            persentase: fetchText.split('%ENERGI NEGATIF')[0].split('% = ')[1] + '%'
          },
          energi_negatif: {
            perselisihan: fetchText.split('Perselisihan = ')[1].split('\n')[0],
            kehilangan: fetchText.split('Kehilangan = ')[1].split('\n')[0],
            malapetaka: fetchText.split('Malapetaka = ')[1].split('\n')[0],
            kehancuran: fetchText.split('Kehancuran = ')[1].split('\n')[0],
            persentase: fetchText.split('Kehancuran = ')[1].split('= ')[1].split('\n')[0]
          },
          catatan: fetchText.split('* ')[1].split('Masukkan Nomor HP Anda')[0]
        }
      }
      return hasil
    } catch (e) {
      return { status: false, message: 'ERROR! No. Handphone Tidak Valid!' }
    }
  }

  async tafsir_mimpi(value: string) {
    const res = await axios.get('https://primbon.com/tafsir_mimpi.php?mimpi=' + encodeURIComponent(value) + '&submit=+Submit+')
    const $ = cheerio.load(res.data)
    const fetchText = $('#body').text()
    try {
      return {
        status: true,
        message: {
          mimpi: value,
          arti: fetchText.split(`Hasil pencarian untuk kata kunci: ${value}`)[1].split('\n')[0],
          solusi: fetchText.split('Solusi -')[1].trim()
        }
      }
    } catch (e) {
      return { status: false, message: `Tidak ditemukan tafsir mimpi "${value}" Cari dengan kata kunci yang lain.` }
    }
  }

  async ramalan_jodoh(n1: string, d1: string, m1: string, y1: string, n2: string, d2: string, m2: string, y2: string) {
    const res = await axios.post(this.base_url + 'ramalan_jodoh.php', new URLSearchParams(Object.entries({ nama1: n1, tgl1: d1, bln1: m1, thn1: y1, nama2: n2, tgl2: d2, bln2: m2, thn2: y2, submit: '  RAMALAN JODOH »  ' })), { headers: { 'content-type': 'application/x-www-form-urlencoded' } })
    const $ = cheerio.load(res.data)
    const fetchText = $('#body').text()
    try {
      const hasil = {
        status: true,
        message: {
          nama_anda: {
            nama: n1,
            tgl_lahir: fetchText.split('Tgl. Lahir: ')[1].split(n2)[0]
          },
          nama_pasangan: {
            nama: n2,
            tgl_lahir: fetchText.split(n2)[1].split('Tgl. Lahir: ')[1].split('Dibawah')[0]
          },
          result: fetchText.split('begitu pula sebaliknya.')[1].split('Konsultasi Hari Baik Akad Nikah >>>')[0].trim(),
          catatan: 'Untuk melihat kecocokan jodoh dengan pasangan, dapat dikombinasikan dengan Ramalan Jodoh (Jawa), numerologi Kecocokan Cinta, tingkat keserasian Nama Pasangan, Ramalan Perjalanan Hidup Suami Istri, dan makna dari Tanggal Jadian/Pernikahan.'
        }
      }
      return hasil
    } catch (e) {
      return { status: false, message: 'Error, Mungkin Input Yang Anda Masukkan Salah' }
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
      const hasil = {
        status: true,
        message: {
          nama_anda: {
            nama: args[0],
            tgl_lahir: txt.split('Hari Lahir: ')[1].split('Nama')[0]
          },
          nama_pasangan: {
            nama: args[4],
            tgl_lahir: txt.split(args[4] + 'Hari Lahir: ')[1].split('HASILNYA MENURUT PAL SRI SEDANAI')[0]
          },
          result: txt.split('HASILNYA MENURUT PAL SRI SEDANAI. ')[1].split('Konsultasi Hari Baik Akad Nikah >>>')[0],
          catatan: 'Untuk melihat kecocokan jodoh dengan pasangan, dapat dikombinasikan dengan Ramalan Jodoh (Jawa), numerologi Kecocokan Cinta, tingkat keserasian Nama Pasangan, Ramalan Perjalanan Hidup Suami Istri, dan makna dari Tanggal Jadian/Pernikahan.'
        }
      }
      return hasil
    } catch { return { status: false, message: 'Error, Mungkin Input Yang Anda Masukkan Salah' } }
  }

  async suami_istri(...args: string[]) {
    try {
      const txt = await this.postAndText('suami_istri.php', { nama1: args[0], tgl1: args[1], bln1: args[2], thn1: args[3], nama2: args[4], tgl2: args[5], bln2: args[6], thn2: args[7], submit: ' Submit! ' })
      const hasil = {
        status: true,
        message: {
          suami: {
            nama: args[0],
            tgl_lahir: txt.split('Tgl. Lahir: ')[1].split(args[4])[0]
          },
          istri: {
            nama: args[4],
            tgl_lahir: txt.split(args[4] + 'Tgl. Lahir: ')[1].split('HASIL RAMALAN MENURUT USIA PERNIKAHAN')[0]
          },
          result: txt.split('HASIL RAMALAN MENURUT USIA PERNIKAHAN')[1].split('Konsultasi Hari Baik Akad Nikah >>>')[0],
          catatan: 'Untuk melihat kecocokan jodoh dengan pasangan, dapat dikombinasikan dengan Ramalan Jodoh (Jawa), Ramalan Jodoh (Bali), numerologi Kecocokan Cinta, tingkat keserasian Nama Pasangan, dan makna dari Tanggal Jadian/Pernikahan.'
        }
      }
      return hasil
    } catch { return { status: false, message: 'Error, Mungkin Input Yang Anda Masukkan Salah' } }
  }

  async ramalan_cinta(...args: string[]) {
    try {
      const txt = await this.postAndText('ramalan_cinta.php', { nama1: args[0], tanggal1: args[1], bulan1: args[2], tahun1: args[3], nama2: args[4], tanggal2: args[5], bulan2: args[6], tahun2: args[7], submit: ' Submit! ' })
      const hasil = {
        status: true,
        message: {
          nama_anda: {
            nama: args[0],
            tgl_lahir: txt.split('Tgl. Lahir : ')[1].split(args[4])[0]
          },
          nama_pasangan: {
            nama: args[4],
            tgl_lahir: txt.split(args[4] + 'Tgl. Lahir : ')[1].split('Sisi Positif')[0]
          },
          sisi_positif: txt.split('Sisi Positif Anda: ')[1].split('Sisi Negatif Anda:')[0],
          sisi_negatif: txt.split('Sisi Negatif Anda: ')[1].split('< Hitung Kembali')[0].trim(),
          catatan: 'Untuk melihat kecocokan jodoh dengan pasangan, dapat dikombinasikan dengan primbon Ramalan Jodoh (Jawa), Ramalan Jodoh (Bali), tingkat keserasian Nama Pasangan, Ramalan Perjalanan Hidup Suami Istri, dan makna dari Tanggal Jadian/Pernikahan.'
        }
      }
      return hasil
    } catch { return { status: false, message: 'Error, Mungkin Input Yang Anda Masukkan Salah' } }
  }

  async arti_nama(value: string) {
    try {
      const res = await axios.get('https://primbon.com/arti_nama.php?nama1=' + encodeURIComponent(value) + '&proses=+Submit%21+')
      const $ = cheerio.load(res.data)
      const fetchText = $('#body').text()
      return {
        status: true,
        message: {
          nama: value,
          arti: fetchText.split('memiliki arti: ')[1].split('Nama:')[0].trim(),
          catatan: 'Gunakan juga aplikasi numerologi Kecocokan Nama, untuk melihat sejauh mana keselarasan nama anda dengan diri anda.'
        }
      }
    } catch { return { status: false, message: `Tidak ditemukan arti nama "${value}" Cari dengan kata kunci yang lain.` } }
  }

  // many other helpers can reuse postAndText; implement a few representative ones
  async kecocokan_nama(nama: string, tgl: string, bln: string, thn: string) {
    try {
      const txt = await this.postAndText('kecocokan_nama.php', { nama, tgl, bln, thn, kirim: ' Submit! ' })
      const fetchText = txt
      const hasil = {
        status: true,
        message: {
          nama: nama,
          tgl_lahir: fetchText.split('Tgl. Lahir: ')[1].split('\n')[0],
          life_path: fetchText.split('Life Path Number : ')[1].split('\n')[0],
          destiny: fetchText.split('Destiny Number : ')[1].split('\n')[0],
          destiny_desire: fetchText.split("Heart's Desire Number : ")[1].split('\n')[0],
          personality: fetchText.split('Personality Number : ')[1].split('\n')[0],
          persentase_kecocokan: fetchText.split('PERSENTASE KECOCOKAN')[1].split('< Hitung Kembali')[0].trim(),
          catatan: 'Gunakan juga aplikasi numerologi Arti Nama, untuk melihat arti dan karakter dari nama anda.'
        }
      }
      return hasil
    } catch {
      return { status: false, message: 'Error, Mungkin Input Yang Anda Masukkan Salah' }
    }
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
