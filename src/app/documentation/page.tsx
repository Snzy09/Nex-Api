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
    "Next Api",
    "Free For Everyone",
];

export default function DocumentationPage() {
  const breadcrumbs = [{ label: 'Dokumentasi' }];

  const getStartedCode = `fetch('https://szhost.biz.id/api/ai/felo?query=halo')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;

  const tutorialCode = `const fetchFeloSearch = async (query) => {
  const url = \`https://szhost.biz.id/api/ai/felo?query=\${encodeURIComponent(query)}\`;
  
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
fetchFeloSearch('Simple Code Javascript');`;

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
            <AccordionTrigger>Introduction</AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2 text-muted-foreground">
                    <p>Nex API menyediakan Api dengan beragam fitur didalamnya. Tujuan kami adalah menyediakan API yang andal, cepat, dan dapat terintegrasi dengan mulus ke dalam proyek anda.</p>
                    <p>Dokumentasi ini akan memandu Anda melalui endpoint yang tersedia dan memberikan contoh untuk membantu Anda memulai dalam waktu singkat.</p>
                </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Get Started</AccordionTrigger>
            <AccordionContent>
                <div className="space-y-6 pt-2 text-muted-foreground">
                    <div>
                        <h3 className="font-semibold mb-2 text-foreground">1. Jelajahi Kategori API</h3>
                        <p>Disidebar pilih kategori API yang tersedia. Setiap halaman kategori mencantumkan endpoint yang tersedia, deskripsinya, parameter yang diperlukan, dan metode HTTP.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2 text-foreground">2. Execute Code</h3>
                        <p>Anda dapat menggunakan fitur "Coba" di halaman endpoint mana pun untuk mencoba langsung dari browser Anda. Atau, gunakan klien HTTP Post / Get sesuai kebutuhan Anda. Berikut adalah contoh dasar menggunakan <code className="bg-muted px-1 py-0.5 rounded-sm">fetch</code>:</p>
                        <CodeBlock text={getStartedCode} />
                    </div>
                </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Tutorials</AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2 text-muted-foreground">
                    <p>Endpoint Felo AI Search (<code className="bg-muted px-1 py-0.5 rounded-sm">/api/search/felo</code>) memungkinkan Anda melakukan pencarian berbasis AI.</p>
                    <h3 className="font-semibold text-foreground">Rincian Fungsi</h3>
                    <p>Di bawah ini adalah contoh Function :</p>
                    <CodeBlock text={tutorialCode} />
                    <h3 className="font-semibold mt-4 text-foreground">Poin Penting:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Endpoint mendukung permintaan GET dan POST, contoh ini menggunakan GET.</li>
                    </ul>
                </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Changelog</AccordionTrigger>
            <AccordionContent>
                 <div className="space-y-6 pt-2">
                    <div>
                        <h3 className="font-semibold text-foreground">Versi 1.1 [Feature Update]</h3>
                        <p className="text-sm text-muted-foreground mb-2">06  November 2025</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            <li><span className="font-semibold text-primary">[Disederhanakan]</span> Dasbor dan fungsionalitas UI disederhanakan.</li>
                            <li><span className="font-semibold text-primary">[Ditambahkan]</span> Menambahkan Animasi Detail Sederhana.</li>
                            <li><span className="font-semibold text-primary">[Diperbarui]</span> Dokumentasi fitur api.</li>
                            <li><span className="font-semibold text-primary">[Diperbarui]</span> Penambahan 55+ fitur api.</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Versi 1.0 [Rilis Awal]</h3>
                        <p className="text-sm text-muted-foreground mb-2">05 November 2025</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            <li><span className="font-semibold text-primary">[Ditambahkan]</span> Struktur API awal dengan endpoint Felo AI.</li>
                            <li><span className="font-semibold text-primary">[Ditambahkan]</span> Design Dashboard Minimalis.</li>
                            <li><span className="font-semibold text-primary">[Ditambahkan]</span> Design Sidebar Modern.</li>
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
