# GIS Terpadu Kelurahan Pager & Kecamatan Rakumpit

Sistem Informasi Geospasial (GIS) untuk memetakan fasilitas dan layanan
umum di Kelurahan Pager dan Kecamatan Rakumpit, Kota Palangka Raya —
dengan panel admin untuk mengelola data dan Google Spreadsheet sebagai
database, siap di-hosting gratis di GitHub Pages.

## Fitur

- **Dashboard publik** (`index.html`): peta interaktif (Leaflet), batas
  wilayah 7 kelurahan (GeoJSON), filter per kelurahan/kategori, pencarian,
  statistik, dan tombol pengaduan via WhatsApp.
- **Panel admin** (`admin.html`): login aman (token sesi + password
  ter-hash SHA-256), tambah/ubah/hapus titik layanan, ganti password admin.
- **Database**: Google Spreadsheet (gratis, tanpa server sendiri), diakses
  lewat Google Apps Script Web App.
- Data yang ditambahkan/diubah di panel admin **langsung tampil** di
  dashboard publik — tidak perlu sinkronisasi manual.

## Struktur Proyek

```
├── index.html          # Dashboard publik GIS
├── admin.html          # Panel admin (login + kelola data)
├── config.js           # Konfigurasi URL Apps Script (WAJIB diisi)
├── api.js              # Helper komunikasi ke backend (fetch API)
├── apps-script/
│   └── Code.gs          # Kode backend (tempel ke Google Apps Script)
├── README.md
└── MANUAL_INSTALASI.md  # Panduan instalasi langkah demi langkah
```

> Catatan: sebelumnya ada folder/berkas duplikat (`admin/`, `assets/`,
> `google-apps-script/`, `PANDUAN_INSTALASI.md`) sisa dari proses
> pengembangan sebelumnya yang tidak konsisten dengan struktur di atas
> (nama sheet & nama aksi backend berbeda) — berkas-berkas tersebut sudah
> dihapus agar tidak membingungkan / menyebabkan error salah konfigurasi.

## Mulai Cepat

Ikuti **[MANUAL_INSTALASI.md](./MANUAL_INSTALASI.md)** untuk panduan lengkap:
1. Deploy backend di Google Apps Script (`apps-script/Code.gs`).
2. Isi `config.js` dengan URL Web App hasil deploy.
3. Login admin default (`admin` / `pager2026`) lalu **segera ganti password**
   lewat menu "Ganti Password Admin".
4. Push seluruh folder ini ke GitHub, aktifkan GitHub Pages.

## Teknologi

- HTML, Tailwind CSS (CDN), vanilla JavaScript — tanpa proses build.
- [Leaflet.js](https://leafletjs.com/) untuk peta interaktif.
- [Turf.js](https://turfjs.org/) untuk perhitungan luas wilayah dari GeoJSON.
- [Lucide Icons](https://lucide.dev/).
- Google Apps Script + Google Spreadsheet sebagai backend & database.

## Lisensi

Bebas digunakan dan dimodifikasi untuk keperluan pelayanan publik
pemerintahan kelurahan/kecamatan.
