'use client';
import { SidebarPage } from '@/components/sidebar-page';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CodeBlock } from '@/components/dashboard/code-block';
import { TypingText } from '@/components/dashboard/typing-text';

const docTexts = [
    "Dokumentasi",
    "Semua yang perlu Anda ketahui",
    "Mulai dengan Nex API"
];

export default function DocumentationPage() {
  const breadcrumbs = [{ label: 'Dokumentasi' }];

  const getStartedCode = `fetch('https://yourapi.com/api/search/felo?query=halo')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;

  const tutorialCode = `const fetchFeloSearch = async (query) => {
  const url = \`https://yourapi.com/api/search/felo?query=\${encodeURIComponent(query)}\`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    console.log('Respons API:', data);
    return data;
  } catch (error) {
    console.error('Gagal mengambil dari Felo API:', error);
  }
};

// Contoh penggunaan:
fetchFeloSearch('Praktik terbaik Next.js');`;

  return (
    <SidebarPage breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <TypingText texts={docTexts} />
          </h1>
          <p className="text-muted-foreground mt-2">
            Semua yang perlu Anda ketahui untuk memulai dengan Nex API.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Pendahuluan</AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2 text-muted-foreground">
                    <p>Nex API menyediakan antarmuka yang kuat dan mudah digunakan untuk berbagai layanan berbasis AI. Tujuan kami adalah menyediakan API yang andal, cepat, dan dapat diskalakan yang terintegrasi dengan mulus ke dalam proyek apa pun.</p>
                    <p>Dokumentasi ini akan memandu Anda melalui endpoint yang tersedia dan memberikan contoh untuk membantu Anda memulai dalam waktu singkat.</p>
                </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Mulai</AccordionTrigger>
            <AccordionContent>
                <div className="space-y-6 pt-2 text-muted-foreground">
                    <div>
                        <h3 className="font-semibold mb-2 text-foreground">1. Jelajahi Kategori API</h3>
                        <p>Gunakan bilah sisi untuk menavigasi melalui kategori API yang tersedia. Setiap halaman kategori mencantumkan endpoint yang tersedia, deskripsinya, parameter yang diperlukan, dan metode HTTP.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2 text-foreground">2. Buat Permintaan Pertama Anda</h3>
                        <p>Anda dapat menggunakan fitur "Coba" di halaman endpoint mana pun untuk membuat permintaan langsung dari browser Anda. Atau, gunakan klien HTTP favorit Anda. Berikut adalah contoh dasar menggunakan <code className="bg-muted px-1 py-0.5 rounded-sm">fetch</code>:</p>
                        <CodeBlock text={getStartedCode} />
                    </div>
                </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Tutorial</AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2 text-muted-foreground">
                    <p>Endpoint Felo AI Search (<code className="bg-muted px-1 py-0.5 rounded-sm">/api/search/felo</code>) memungkinkan Anda melakukan pencarian berbasis AI yang kuat.</p>
                    <h3 className="font-semibold text-foreground">Rincian Fungsi</h3>
                    <p>Di bawah ini adalah fungsi asinkron yang mengambil kueri pencarian, membuat URL permintaan, dan mengambil hasilnya. Ini mencakup penanganan kesalahan dasar dan mencatat respons ke konsol.</p>
                    <CodeBlock text={tutorialCode} />
                    <h3 className="font-semibold mt-4 text-foreground">Poin Penting:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Endpoint mendukung permintaan GET dan POST. Untuk kesederhanaan, contoh ini menggunakan GET.</li>
                        <li>Tangani potensi kesalahan, seperti masalah jaringan atau respons server yang tidak valid, untuk memastikan aplikasi Anda kuat.</li>
                    </ul>
                </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Log Perubahan</AccordionTrigger>
            <AccordionContent>
                 <div className="space-y-6 pt-2">
                    <div>
                        <h3 className="font-semibold text-foreground">Versi 1.1.0 - Akses Publik</h3>
                        <p className="text-sm text-muted-foreground mb-2">26 Mei 2024</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            <li><span className="font-semibold text-primary">[Dihapus]</span> Sistem kunci API dan otentikasi pengguna.</li>
                            <li><span className="font-semibold text-primary">[Disederhanakan]</span> Dasbor dan fungsionalitas UI untuk menghapus fitur khusus pengguna.</li>
                            <li><span className="font-semibold text-primary">[Diperbarui]</span> Dokumentasi untuk mencerminkan akses publik tanpa kunci API.</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Versi 1.0.0 - Rilis Awal</h3>
                        <p className="text-sm text-muted-foreground mb-2">25 Mei 2024</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            <li><span className="font-semibold text-primary">[Ditambahkan]</span> Struktur API awal dengan endpoint Felo AI Search.</li>
                            <li><span className="font-semibold text-primary">[Ditambahkan]</span> Sistem kunci API berjenjang (Gratis, Premium, Pemilik).</li>
                            <li><span className="font-semibold text-primary">[Ditambahkan]</span> Pembatasan laju per jam untuk semua tingkatan.</li>
                            <li><span className="font-semibold text-primary">[Ditambahkan]</span> Panel admin untuk tingkat Pemilik untuk menghasilkan kunci baru.</li>
                            <li><span className="font-semibold text-primary">[Ditambahkan]</span> Dasbor untuk menampilkan penggunaan, IP, dan status baterai.</li>
                             <li><span className="font-semibold text-primary">[Ditambahkan]</span> Sistem kedaluwarsa untuk kunci Premium.</li>
                            <li><span className="font-semibold text-primary">[Ditambahkan]</span> Halaman dokumentasi dengan panduan dan contoh.</li>
                        </ul>
                    </div>
                </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </SidebarPage>
  );
}
