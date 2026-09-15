# Manual Instalasi — GIS Terpadu Kelurahan Pager & Kecamatan Rakumpit

Panduan ini menjelaskan langkah demi langkah memasang aplikasi dari nol
sampai bisa diakses publik, menggunakan **Google Spreadsheet** sebagai
database (data layanan + akun admin) dan **GitHub Pages** sebagai hosting
gratis untuk halaman web.

Tidak perlu server sendiri, tidak perlu biaya hosting.

---

## Gambaran Arsitektur

```
Pengunjung / Admin  --->  GitHub Pages (index.html, admin.html)
                                 |
                                 |  fetch (GET/POST)
                                 v
                    Google Apps Script Web App (Code.gs)
                                 |
                                 v
                    Google Spreadsheet (Database)
                    - Sheet "GIS_Pager_Data"   -> titik layanan
                    - Sheet "Admin_Accounts"   -> akun admin
```

- **index.html** — dashboard publik (peta interaktif, daftar layanan).
- **admin.html** — panel admin (login + kelola data titik layanan).
- **config.js** — satu-satunya file yang perlu Anda ubah manual.
- **apps-script/Code.gs** — kode backend yang ditempel di Google Apps Script.

---

## Langkah 1 — Siapkan Google Spreadsheet + Apps Script (Backend)

1. Buka [sheets.google.com](https://sheets.google.com), buat **Spreadsheet baru**.
   Beri nama misalnya `Database GIS Pager`.
2. Di menu atas klik **Extensions (Ekstensi) > Apps Script**.
3. Akan terbuka editor kode. Hapus semua kode contoh (`function myFunction() {}`) yang ada.
4. Buka file `apps-script/Code.gs` dari paket aplikasi ini, salin **seluruh isinya**,
   lalu tempel ke editor Apps Script tadi.
5. Klik ikon **Save (disket)** atau `Ctrl+S`.
6. Klik tombol **Deploy > New deployment**.
   - Klik ikon gerigi di sebelah "Select type", pilih **Web app**.
   - **Description**: bebas, misal `GIS Pager API v1`.
   - **Execute as**: `Me (email Anda)`.
   - **Who has access**: `Anyone`.
   - Klik **Deploy**.
7. Google akan meminta izin akses (Authorize access). Pilih akun Google Anda,
   klik **Advanced/Lanjutan > Buka [nama project] (unsafe)** — ini normal
   karena skrip belum diverifikasi Google, dan aman karena Anda sendiri
   pembuatnya.
8. Setelah berhasil, akan muncul **Web app URL** seperti:
   ```
   https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxx/exec
   ```
   **Salin URL ini** — akan dipakai di Langkah 2.

> Setiap kali Anda mengubah isi `Code.gs` di kemudian hari, Anda harus membuat
> **Manage deployments > Edit > New version** lalu **Deploy** ulang agar
> perubahan berlaku pada URL yang sama.

### Verifikasi backend berjalan

Buka URL Web App tadi langsung di browser (tempel di address bar, tekan Enter).
Jika berhasil, akan tampil JSON seperti:
```json
{"status":"success","data":[]}
```
Ini juga otomatis membuat 2 sheet baru di Spreadsheet Anda:
- `GIS_Pager_Data` (kosong, siap diisi lewat panel admin)
- `Admin_Accounts` (berisi 1 akun default, lihat Langkah 3)

---

## Langkah 2 — Konfigurasi Frontend

1. Buka file **`config.js`** dengan editor teks apa saja.
2. Ganti nilai `APPS_SCRIPT_URL` dengan URL Web App dari Langkah 1:
   ```js
   const APP_CONFIG = {
     APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxxxxx.../exec"
   };
   ```
3. Simpan file.

---

## Langkah 3 — Login Admin Pertama Kali & Ganti Password

Akun admin default yang otomatis dibuat sistem:

| Username | Password   |
|----------|-----------|
| `admin`  | `pager2026` |

**Wajib diganti** setelah instalasi:

1. Buka `admin.html` di browser (lokal dulu boleh, atau setelah online di Langkah 4).
2. Login dengan akun default di atas.
3. Klik tombol **Ganti Password Admin** di bagian atas dashboard.
4. Masukkan password baru (minimal 6 karakter), simpan.

Password disimpan di Spreadsheet dalam bentuk **hash SHA-256**, bukan teks
polos — jika ingin menambah admin lain secara manual, tambahkan baris baru di
sheet `Admin_Accounts`, tapi kolom `passwordHash` harus diisi hasil SHA-256,
bukan password asli (paling mudah: buat dulu lewat panel admin dengan
mengganti password akun itu setelah login, atau minta bantuan teknis untuk
menghitung hash-nya).

---

## Langkah 4 — Hosting Gratis di GitHub Pages

1. Buat akun GitHub jika belum punya: [github.com](https://github.com).
2. Buat **repository baru** (Public), misalnya `gis-pager-rakumpit`.
3. Upload seluruh isi folder aplikasi ini ke repository tersebut
   (via web: **Add file > Upload files**, seret semua file & folder lalu
   commit). Pastikan struktur foldernya tetap:
   ```
   index.html
   admin.html
   config.js
   api.js
   apps-script/Code.gs
   README.md
   ```
4. Buka tab **Settings** repository > menu **Pages** (di sidebar kiri).
5. Pada **Source**, pilih branch `main` dan folder `/ (root)`, klik **Save**.
6. Tunggu 1–2 menit. GitHub akan memberi URL publik seperti:
   ```
   https://<username-anda>.github.io/gis-pager-rakumpit/
   ```
7. Dashboard publik ada di URL utama, panel admin di:
   ```
   https://<username-anda>.github.io/gis-pager-rakumpit/admin.html
   ```

---

## Langkah 5 — Mulai Kelola Data

1. Login ke `admin.html` dengan akun (yang sudah diganti passwordnya).
2. Klik **Tambah Titik Layanan Baru**, isi nama fasilitas, kategori, kelurahan,
   koordinat (lat/lng), kontak, dan deskripsi.
3. Data langsung tersimpan ke Google Spreadsheet.
4. Buka `index.html` (dashboard publik) — data akan langsung tampil di peta
   dan tabel tanpa perlu langkah tambahan.

### Cara mendapatkan koordinat (lat, lng)

- Buka Google Maps, klik kanan pada lokasi yang dituju, klik angka koordinat
  yang muncul (otomatis tersalin). Format: `lat, lng` — misalnya
  `-1.78500, 113.58500`.

---

## Troubleshooting (Pemecahan Masalah)

**Dashboard publik menampilkan "data contoh" / banner kuning**
Berarti `config.js` belum diisi URL yang benar, atau URL Apps Script salah/
belum di-deploy. Cek kembali Langkah 1 & 2.

**Login admin gagal terus padahal password benar**
- Pastikan `config.js` di `admin.html` mengarah ke Web App URL yang sama
  dengan yang dipakai `index.html`.
- Pastikan Apps Script sudah di-deploy dengan akses **Anyone**.

**Muncul error terkait CORS di Console browser**
- Pastikan tidak mengubah `Content-Type` di `api.js` menjadi
  `application/json` — harus tetap `text/plain` agar tidak memicu
  preflight request yang tidak didukung Apps Script.

**Perubahan di Code.gs tidak terasa setelah edit**
- Apps Script menyimpan versi lama pada Web App yang sudah dideploy. Buka
  **Deploy > Manage deployments > Edit (ikon pensil) > Version: New version
  > Deploy** agar URL yang sama memakai kode terbaru.

**Sesi admin sering minta login ulang**
- Ini normal: sesi (token) berlaku 6 jam sejak login demi keamanan. Ubah nilai
  `TOKEN_TTL_SECONDS` di `Code.gs` jika ingin durasi berbeda, lalu deploy ulang.

---

## Catatan Keamanan

- Password admin di-hash (SHA-256) sebelum disimpan di Spreadsheet.
- Karena arsitektur ini berbasis Google Apps Script tanpa server khusus,
  keamanannya cukup untuk skala kelurahan/kecamatan, namun **jangan
  gunakan untuk menyimpan data sangat sensitif** (mis. NIK lengkap warga,
  data kependudukan rahasia).
- Selalu gunakan HTTPS (URL `github.io` dan `script.google.com` sudah HTTPS
  secara default).
- Batasi siapa saja yang tahu URL/akses `admin.html` dan jangan bagikan
  password admin melalui pesan yang tidak aman.
