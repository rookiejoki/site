# Rookie Joki — Static JSON CMS untuk GitHub Pages

## Arsitektur
- Frontend: HTML + Tailwind (lokal) + Lucide Icons (lokal) + Swiper (lokal).
- Source of truth konten: `data.json` di repository.
- Tidak menggunakan LocalStorage, SessionStorage, Firebase, Supabase, MySQL, PHP, atau database.
- Public page membaca JSON terbaru.
- Panel Admin melakukan CRUD dengan GitHub Contents API dan membuat commit ke `data.json`.
- Token GitHub hanya disimpan di RAM browser selama halaman admin terbuka; tidak ditulis ke browser storage.

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

Buat **Fine-grained Personal Access Token** GitHub dengan:
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
- About Us
- Disclaimer
- Footer & sosial media
- Navigasi bawah
- Blog post + detail artikel
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
