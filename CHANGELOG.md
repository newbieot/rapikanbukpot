## 2026-09-01 — Penambahan tab Invoice SAP BATAM

### Ditambahkan

- Mode baru **Invoice SAP BATAM**: memproses file Excel (`.xlsx`, `.xls`) dan CSV data SAPX/SAP BATAM langsung di browser.
- Transformasi 17 kolom laporan lampiran invoice: penomoran berurutan, klasifikasi COD/NON COD, normalisasi tanggal kirim/pickup, nama penerima kapital, nomor resi, ongkir pos, telepon penerima, alamat, deskripsi barang, nilai COD, berat/koli, No VA, status pos, dan formula hyperlink foto tracking Kibana (`=HYPERLINK(...)`).
- Format Excel otomatis: nama sheet dinamis per bulan (`Report {BULAN} SAPX`), nama file `Report_{Bulan}_SAPX_Formatted.xlsx`, pemisah ribuan `#,##0` untuk ongkir dan COD, freeze panes `A2`, autofilter, dan styling header Navy `#17264D`.
- Antarmuka tab ke-5 dengan layout responsif di desktop, tablet, dan ponsel.

## 2026-07-27 — Penyesuaian footer

### Diubah

- Footer disamakan dengan pola visual `lacak.posnew.com`: bar gelap tipis 38 px, garis aksen oranye, identitas PosNew Hub, caption tengah, dan badge kreator.
- Footer dibuat tetap ringkas dan responsif; caption disembunyikan pada layar kecil dan badge kreator dipadatkan tanpa menimbulkan horizontal overflow.
- Tautan PosNew Hub dan profil kreator sekarang terbuka aman di tab baru.

# Changelog

## 2026-07-27 — Redesign menyeluruh

### Dipertahankan

- Empat mode: Bukti Potong, Mile App, PRANPP, dan PID.
- Drag and drop serta pemilihan banyak file.
- Deteksi file HTML yang menyamar sebagai XLS.
- Parser CSV/Excel/HTML dan seluruh transformasi data lama.
- Normalisasi nama Bank Indonesia/KPW BI Kepri.
- Smart finder kolom PRANPP.
- Konversi nilai Rupiah PRANPP.
- Pengurutan hasil berdasarkan tanggal.
- Nama file dan sheet Excel lama.
- Styling header, border, format angka, format teks, dan lebar kolom Excel.
- Redirect Cloudflare Pages dari domain lama.

### Ditambahkan

- UI workspace responsif untuk desktop, tablet, dan ponsel.
- Step indicator Unggah → Proses → Periksa → Unduh.
- Dashboard jumlah file berdasarkan status secara realtime.
- Status per file: Siap, Diproses, Selesai, Perlu diperiksa, dan Gagal.
- Validasi file kosong, format tidak sesuai, workbook kosong, Excel rusak/terenkripsi, HTML tanpa tabel, dan CSV malformed.
- Deteksi file duplikat berdasarkan nama, ukuran, dan waktu modifikasi.
- Progress keseluruhan dan pembatalan aman setelah file aktif selesai.
- Retry untuk file gagal yang masih sesuai format.
- Clear Workspace.
- Pratinjau tabel hasil, pencarian, dan batas render untuk menjaga performa.
- Ringkasan sebelum download.
- Toast dan inline message menggantikan browser alert.
- Dialog panduan, focus state, keyboard navigation, aria-live, dan reduced motion.
- SEO metadata, Open Graph, Twitter Card, structured data, manifest, robots, sitemap, dan halaman 404.
- Security headers dan cache policy untuk Cloudflare Pages.
- Mode print ringkas untuk hasil.

### Diperbaiki

- Nama file sebelumnya dirender melalui `innerHTML`, sehingga berisiko menyisipkan markup; sekarang seluruh nama dan pesan file dirender menggunakan `textContent`.
- File XLSX sebelumnya dibaca penuh sebagai teks sebelum dibaca sebagai ArrayBuffer; sekarang hanya potongan awal yang diperiksa untuk mendeteksi HTML tersamar.
- Browser alert dan error teknis mentah diganti dengan pesan yang dapat ditindaklanjuti.
- File tidak sesuai mode sebelumnya tetap dapat menghasilkan pesan sukses 0 baris; sekarang diberi status gagal/perlu diperiksa secara eksplisit.
- Tombol proses kini terkunci saat proses aktif sehingga tidak dapat ditekan berulang kali.
- Status output lama dapat tertinggal setelah file berubah; sekarang hasil selalu dibangun ulang dari status file aktual.
- Tabel HTML kini memilih tabel terbesar, bukan selalu tabel pertama yang mungkin hanya berisi header/dekorasi.
- Parser PID lebih toleran terhadap header bertipe non-string dan spasi di sekitar nama kolom.
- Object state tidak disimpan secara permanen dan workspace dapat dibersihkan dengan satu tindakan.
