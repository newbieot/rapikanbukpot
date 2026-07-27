# Clean PosNew

Clean PosNew adalah aplikasi statis berbasis browser untuk menggabungkan dan merapikan data operasional menjadi file Excel. Seluruh pembacaan dan pemrosesan file berlangsung di browser pengguna; repository ini tidak memiliki endpoint upload dokumen.

## Mode yang dipertahankan

1. **Bukti Potong (BPU/BPUP)** — input CSV.
2. **Resi Mile App (POD)** — input CSV dengan delimiter titik koma.
3. **Web PRANPP** — input CSV, XLS, XLSX, atau HTML hasil ekspor web.
4. **Web PID / Lacak Kiriman** — input XLS, XLSX, atau HTML hasil ekspor web.

Nama workbook, nama sheet, transformasi kolom, pemformatan nilai, normalisasi teks, pengurutan tanggal, dan kompatibilitas format output lama tetap dipertahankan.

## Menjalankan secara lokal

Karena asset menggunakan path absolut dari root, jalankan melalui server statis:

```bash
python3 -m http.server 8080
```

Buka `http://localhost:8080`.

> Dua library pemrosesan dimuat dari CDN: Papa Parse 5.4.1 dan xlsx-js-style 1.2.0. Isi dokumen tidak dikirim ke CDN; library tersebut dijalankan di browser.

## Deploy ke Cloudflare Pages

- Framework preset: **None**
- Build command: kosong
- Build output directory: `/`
- Root directory: `/`
- Production branch: sesuaikan dengan branch GitHub, biasanya `main`

File `functions/_middleware.js` mempertahankan redirect permanen dari domain lama `rapikanbukpot.pages.dev` ke `clean.posnew.com`. File `_headers` menambahkan security header dan cache policy.

## Privasi

- Tidak ada upload file ke server.
- Tidak ada analytics.
- Tidak ada penyimpanan isi dokumen ke localStorage/sessionStorage.
- Tidak ada isi dokumen yang ditulis ke console.
- Data sementara hilang saat halaman dimuat ulang atau tombol **Bersihkan** digunakan.

## Struktur

```text
/
├── index.html
├── 404.html
├── assets/
│   ├── css/app.css
│   ├── js/app.js
│   ├── icons/app-icon.svg
│   └── images/og-clean-posnew.*
├── functions/_middleware.js
├── site.webmanifest
├── robots.txt
├── sitemap.xml
├── _headers
├── README.md
└── CHANGELOG.md
```
