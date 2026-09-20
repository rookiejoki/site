# Rookie Joki — Static JSON CMS untuk GitHub Pages

## Arsitektur
- Frontend: HTML + Tailwind (lokal) + Lucide Icons (lokal) + Swiper (lokal).
- Source of truth konten: `data.json` di repository.
- Tidak menggunakan LocalStorage, SessionStorage, Firebase, Supabase, MySQL, PHP, atau database.
- Public page membaca JSON terbaru.
- Panel Admin melakukan CRUD dengan GitHub Contents API dan membuat commit ke `data.json`.
- Token GitHub hanya disimpan di RAM browser selama halaman admin terbuka; tidak ditulis ke browser storage.

## Struktur Folder
```
(root repository)              <- isi folder ini diunggah ke ROOT repo, bukan folder pembungkusnya
├── index.html                 Halaman utama + Panel Admin
├── post.html                  Halaman detail artikel  (post.html?id=NOMOR)
├── data.json                  Sumber data konten (di-commit otomatis oleh Panel Admin)
├── .nojekyll                  Wajib untuk GitHub Pages
├── assets/                    KODE & library (tidak diubah lewat Panel Admin)
│   ├── cms-config.js          Repo/branch/URL data
│   ├── cms-data.js            Data bawaan (cadangan bila data.json gagal dimuat)
│   ├── cms-store.js           Baca data.json, simpan & upload file via GitHub API
│   ├── cms-auth.js            Login admin
│   ├── cms-render.js          Menampilkan data ke halaman publik
│   ├── cms-upload.js          [BARU] Mesin form + upload gambar/video (klik & drag & drop)
│   ├── cms-invoice.js         [BARU] Pratinjau, Print, Barcode & Tanda Tangan Bukti Transaksi
│   ├── cms-admin.js           Panel Admin (CRUD)
│   └── tailwind / lucide / swiper (library lokal)
└── uploads/                   [BARU] Semua gambar & video dari Panel Admin (otomatis di-commit)
    ├── banner/      Slide Banner
    ├── portfolio/   Galeri Portofolio
    ├── qris/        QRIS Pembayaran
    ├── blog/        Gambar & video artikel
    ├── about/       Media About Us
    ├── disclaimer/  Media Disclaimer
    ├── footer/      Media Footer
    ├── media/       Cadangan media umum
    └── signature/   Tanda tangan admin
```
Path yang tersimpan di `data.json` selalu relatif, mis. `uploads/banner/promo-abc123.jpg`.
File `.gitkeep` hanya agar folder kosong ikut terunggah ke GitHub.

## Upload Gambar & Video (Panel Admin)
Tersedia di: Slide Banner, Galeri Portofolio, QRIS Pembayaran, Blog Post & Detail (gambar utama, gambar kedua, video),
About Us, Disclaimer, Footer, dan Tanda Tangan Admin. Klik kotak unggah atau tarik file dari komputer.
File baru diunggah ke `uploads/...` saat tombol **Simpan** ditekan. Gambar otomatis diperkecil & dikompres di browser.

| Bagian | Ukuran ideal | Rasio | Format | Maks. file |
|---|---|---|---|---|
| Slide Banner | 1200 × 600 px | 2:1 | JPG / PNG / WebP | 2 MB |
| Galeri Portofolio | 800 × 600 px | 4:3 | JPG / PNG / WebP | 1,5 MB |
| QRIS | 600 × 600 px | 1:1 | PNG (jangan dipotong) | 1 MB |
| Blog - gambar utama | 1200 × 900 px | 4:3 | JPG / PNG / WebP | 2 MB |
| Blog - gambar kedua | 1200 × 750 px | 16:10 | JPG / PNG / WebP | 2 MB |
| About / Disclaimer / Footer (gambar) | 1200 × 675 px | 16:9 | JPG / PNG / WebP | 2 MB |
| Video (Blog, About, Disclaimer, Footer) | 1280 × 720 px | 16:9 | MP4 (H.264/AAC) / WebM | 20 MB |
| Tanda tangan admin | 600 × 240 px | 5:2 | PNG transparan | 500 KB |

Catatan: setelah upload, GitHub Pages butuh sekitar 1-2 menit untuk rebuild. Selama itu situs otomatis memakai
`raw.githubusercontent.com` sebagai cadangan sehingga gambar tetap tampil.

## Bukti Transaksi (menu Status Pesanan Joki)
- **Pratinjau** dan **Print** ada di setiap baris pesanan dan di dalam form edit pesanan.
- Barcode (Code 128) berisi ID Transaksi. Kertas: A4, A5, atau struk 80 mm. Simpan PDF lewat dialog cetak browser.
- Atur nama usaha, nama/jabatan penandatangan, dan gambar tanda tangan di menu **Bukti Transaksi & TTD**
  (unggah file, atau gambar langsung di layar).
- Field baru per pesanan: Total Pembayaran, Metode Pembayaran, Catatan (hanya untuk bukti, tidak tampil di Cek Status publik).

## Deploy
1. Upload seluruh isi folder ini ke repository GitHub.
2. Aktifkan GitHub Pages dari branch `main` (root `/`).
3. Buka situs melalui URL GitHub Pages.
4. Untuk project pages seperti `https://USERNAME.github.io/NAMA-REPO/`, konfigurasi repository akan dideteksi otomatis.
5. Jika memakai custom domain, isi `repo` dan `dataUrl` di `assets/cms-config.js`.

## Login & GitHub Token
Login awal:
- Username: `admin`
- Password: `rookiejoki2026`

Buat **Fine-grained Personal Access Token** GitHub dengan (izin yang sama juga dipakai untuk upload gambar/video):
- Repository access: hanya repository website ini.
- Repository permissions → Contents: **Read and write**.

Masukkan token pada form Login Admin. Token tidak disimpan ke LocalStorage/SessionStorage.

## Catatan penting keamanan
GitHub Pages adalah hosting statis. Tidak ada server privat yang dapat memverifikasi password secara rahasia. Karena itu password CMS di `data.json` hanya berupa hash dan login merupakan proteksi sisi browser, bukan autentikasi server-grade.

Jangan menaruh PAT GitHub di `cms-config.js`, HTML, JavaScript, atau repository. Token harus dimasukkan saat login. Siapa pun yang memiliki token dengan izin write dapat mengubah repository.

## CRUD yang tersedia
- Header / CTA
- Area pencarian
- Running text
- Slider banner
- Status pesanan
- Metode pembayaran & rekening/e-wallet
- Kalkulator rank
- Leaderboard
- Pricelist/kategori/item + tombol naik/turun
- Testimoni
- Portofolio/galeri
- FAQ
- About Us, Disclaimer, Footer & sosial media (form biasa, tanpa JSON; bisa unggah gambar/video)
- Navigasi bawah
- Blog post + detail artikel (upload gambar & video)
- Bukti Transaksi & Tanda Tangan Admin
- Admin website (tambah/edit/hapus, minimal 1 admin)
- Export/import JSON

List yang memiliki urutan dapat dipindahkan dengan tombol ↑ / ↓ dan perubahan langsung di-commit ke `data.json`.

## Sinkronisasi public
Setelah admin menyimpan, browser admin langsung merender data baru. Pengunjung lain mengambil `data.json` dari repository/Raw GitHub. Karena GitHub Pages/Raw GitHub menggunakan CDN, propagasi perubahan dapat membutuhkan sedikit waktu dan tidak dapat dijamin benar-benar real-time.


## Konfigurasi Repository Anda
- GitHub Username: `rookiejoki`
- Repository: `rookiejoki/site`
- Branch: `main`
- Raw data: `https://raw.githubusercontent.com/rookiejoki/site/main/data.json`
- GitHub Pages yang diharapkan: `https://rookiejoki.github.io/site/`


## Peringatan Privasi
Repository GitHub Pages bersifat publik: `data.json` (termasuk nama & nomor HP pada daftar pesanan) dan seluruh file di
`uploads/` (termasuk gambar tanda tangan) dapat diakses siapa pun yang tahu URL-nya. Gunakan data pelanggan seperlunya.
