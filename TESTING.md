# Ringkasan Pengujian

Tanggal pengujian: 27 Juli 2026

## Hasil otomatis

| Area | Hasil |
|---|---|
| Halaman awal desktop | Lulus |
| Halaman awal mobile | Lulus |
| Upload banyak file | Lulus |
| Drag/drop event dan file picker | Terpasang dan diuji melalui input file otomatis |
| Deteksi duplikat | Lulus — dua file identik menghasilkan satu item |
| File tidak didukung | Lulus — ditandai Gagal |
| File dengan struktur tidak sesuai | Lulus — ditandai Perlu diperiksa |
| Bukti Potong CSV | Lulus — 3 baris contoh terbaca |
| Mile App CSV | Lulus — 2 baris contoh terbaca |
| PRANPP CSV | Lulus — 2 baris contoh terbaca |
| PID HTML | Lulus — 2 baris contoh terbaca |
| Normalisasi teks | Lulus — KPW BI Kepri dinormalisasi sesuai logika lama |
| Nama file dan sheet output | Lulus — `Rekap_Bukti_Potong_PosIND.xlsx` / `Bukti_Potong` |
| Clear Workspace | Lulus |
| Pencarian hasil | Lulus melalui render tabel |
| Desktop 1440 px | Tidak ada horizontal overflow |
| Laptop 1024 px | Tidak ada horizontal overflow |
| Tablet 768 px | Tidak ada horizontal overflow |
| Mobile portrait 390 px | Tidak ada horizontal overflow |
| Mobile landscape 844 × 390 px | Tidak ada horizontal overflow |
| Error console aplikasi | Tidak ditemukan |
| Duplikasi ID HTML | Tidak ditemukan |
| Referensi asset lokal | Semua ditemukan |
| Syntax JavaScript | Lulus `node --check` |
| Secret/API key di repository | Tidak ditemukan |
| `alert()` dan log isi dokumen | Tidak ditemukan |

## Catatan lingkungan pengujian

Browser integration dijalankan menggunakan Chromium headless. Karena sandbox pengujian memblokir akses jaringan browser ke CDN eksternal, Papa Parse dan xlsx-js-style digantikan dengan test double lokal selama automasi UI. Transformasi empat mode, state UI, validasi, nama workbook/sheet, dan alur download tetap dieksekusi. Pada deploy produksi, halaman menggunakan versi CDN yang sama dengan aplikasi lama: Papa Parse 5.4.1 dan xlsx-js-style 1.2.0.

File contoh pengujian berada di luar repository final dan tidak disertakan dalam ZIP.
