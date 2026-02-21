# Muqri (مُقرئ)

**Teleprompter Al-Quran untuk Imam Shalat**

Muqri adalah aplikasi web PWA yang menampilkan ayat Al-Quran secara real-time saat imam memimpin shalat. Menggunakan kamera perangkat untuk mendeteksi gerakan shalat dan kedipan mata sebagai navigasi antar ayat — tanpa perlu menyentuh layar.

**Live:** [muqri.mosleim.com](https://muqri.mosleim.com)

---

## Fitur Utama

- **Deteksi Gerakan Shalat** — Mengenali posisi qiyam, ruku, sujud, dan duduk menggunakan MoveNet (TensorFlow.js)
- **Navigasi Kedipan Mata** — Kedip mata disengaja (>250ms) untuk berpindah ke ayat berikutnya, menggunakan MediaPipe FaceMesh
- **Mode Sendekap** — Otomatis menampilkan/menyembunyikan ayat berdasarkan posisi tangan bersedekap
- **Offline-First (PWA)** — Berjalan sepenuhnya offline setelah loading pertama
- **Pilih Surah & Ayat** — Mulai dari surah dan ayat manapun
- **Ukuran Font** — Atur ukuran teks Arab sesuai jarak pandang
- **Auto-Advance Surah** — Otomatis lanjut ke surah berikutnya

---

## Tech Stack

| Teknologi | Kegunaan |
|-----------|----------|
| React 18 + TypeScript | Frontend SPA |
| Vite 5 | Build tool |
| Tailwind CSS 3 | Styling (dark theme) |
| Zustand | State management |
| TensorFlow.js (MoveNet) | Deteksi pose tubuh |
| MediaPipe FaceMesh | Deteksi kedipan mata |
| IndexedDB (idb) | Cache data offline |
| VitePWA (Workbox) | Service worker & offline |

---

## Getting Started

### Prasyarat

- Node.js 18+
- pnpm

### Instalasi

```bash
git clone https://github.com/mosleim/muqri.git
cd muqri
pnpm install
```

### Development

```bash
pnpm dev
```

Buka `http://localhost:5173` di browser. Pastikan menggunakan browser yang mendukung WebRTC (Chrome/Edge disarankan).

### Build

```bash
pnpm build
```

Hasil build di folder `dist/`, siap deploy sebagai static site.

---

## Cara Penggunaan

1. **Pilih Surah** — Di halaman utama, pilih surah yang akan dibaca
2. **Setup** — Izinkan akses kamera, tunggu model AI dimuat, lalu kalibrasi mata
3. **Mulai Shalat** — Teks ayat tampil otomatis saat berdiri (qiyam) dan bersedekap
4. **Navigasi** — Kedipkan mata (>250ms) untuk lanjut ke ayat berikutnya
5. **Otomatis** — Teks menghilang saat ruku/sujud, muncul kembali saat berdiri

### Keyboard Shortcut

| Tombol | Aksi |
|--------|------|
| `←` (kiri) | Ayat selanjutnya (RTL) |
| `→` (kanan) | Ayat sebelumnya (RTL) |
| `Space` | Ayat selanjutnya |
| `Esc` | Keluar |

---

## Sumber Data

Al-Quran data dari [quran-json](https://www.npmjs.com/package/quran-json) via CDN:

```
https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json
```

---

## Deployment

Aplikasi ini di-deploy sebagai static site di Cloudflare Pages. Bisa juga di-deploy di platform lain yang mendukung static hosting (Netlify, Vercel, GitHub Pages, dll).

---

## Kontak

**Email:** mosleim@gmail.com

---

## Lisensi

MIT
