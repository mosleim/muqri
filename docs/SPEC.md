# Spesifikasi Teknis — Muqri (مُقرئ)

**Teleprompter Imam Shalat dengan Deteksi Gerakan dan Kedipan Mata**

---

## 1. Ringkasan Produk

Muqri adalah aplikasi web teleprompter yang menampilkan ayat Al-Quran saat imam shalat. Aplikasi mendeteksi gerakan shalat (qiyam, ruku, sujud, duduk) melalui kamera dan menggunakan kedipan mata yang disengaja (>250ms) untuk navigasi antar ayat. Aplikasi berjalan **sepenuhnya offline** setelah initial load.

---

## 2. Tech Stack

| Layer | Teknologi | Keterangan |
|-------|-----------|------------|
| Frontend Framework | React 18+ | SPA, component-based |
| Build Tool | Vite 5+ | Fast dev server, optimized build |
| AI/ML | TensorFlow.js | Pose detection + face landmarks |
| Pose Model | MoveNet (SinglePose Thunder) | Deteksi 17 keypoints tubuh |
| Face Model | MediaPipe FaceMesh | 468 face landmarks untuk blink detection |
| State Management | Zustand | Lightweight, minimal boilerplate |
| Styling | Tailwind CSS | Utility-first, dark theme |
| Storage | IndexedDB (via idb) | Cache ayat data untuk offline |
| Service Worker | Vite PWA Plugin | Full offline capability |
| Backend | Go (Golang) | API proxy ayat + static file server |
| Language | TypeScript | Type safety di seluruh codebase |

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (PWA)                        │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  React   │  │ TensorFlow.js│  │  Service Worker   │  │
│  │  UI      │◄─┤  Workers     │  │  (Offline Cache)  │  │
│  │          │  │              │  │                   │  │
│  │ - Home   │  │ - Pose Det.  │  │ - App Shell       │  │
│  │ - Setup  │  │ - Face Mesh  │  │ - TF Models       │  │
│  │ - Prayer │  │ - Blink Det. │  │ - Quran Data      │  │
│  └────┬─────┘  └──────────────┘  └───────────────────┘  │
│       │                                                  │
│  ┌────▼─────────────────────────────────────────────┐   │
│  │              IndexedDB                            │   │
│  │  - Surah & Ayat cache                             │   │
│  │  - User preferences                               │   │
│  │  - TF model cache                                 │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────┘
                              │ (first load only)
                    ┌─────────▼──────────┐
                    │   Go Backend       │
                    │                    │
                    │ - /api/surah/:id   │
                    │ - /api/quran/meta  │
                    │ - Static files     │
                    │ - Model files host │
                    └────────────────────┘
```

---

## 4. Fitur Detail

### 4.1. Deteksi Gerakan Shalat

#### Model & Pipeline

- **Model**: MoveNet SinglePose Thunder (TensorFlow.js)
- **Input**: Video feed dari webcam/kamera depan, resolusi 640x480
- **FPS target**: 15-20 fps pada detection loop (throttled dari requestAnimationFrame)
- **Keypoints yang digunakan**: nose, left/right_shoulder, left/right_elbow, left/right_wrist, left/right_hip, left/right_knee, left/right_ankle

#### Klasifikasi Pose (4 posisi)

| Pose | Kondisi Deteksi | Confidence Min |
|------|-----------------|----------------|
| **Qiyam** (berdiri) | Bahu di atas pinggul. Pinggul di atas lutut. Jarak vertikal bahu-pinggul > 20% frame height. | 0.4 |
| **Ruku** (membungkuk) | Bahu dan pinggul hampir sejajar horizontal (selisih Y < 15% frame height). Hidung di bawah bahu. Lutut tetap di bawah. | 0.4 |
| **Sujud** (sujud) | Hidung berada di dekat atau di bawah level pinggul. Bahu jauh di bawah posisi berdiri normal. | 0.3 |
| **Duduk** (tasyahud) | Pinggul rendah mendekati lutut. Hidung di atas pinggul. Bahu di atas pinggul. | 0.4 |

#### Logika Stabilisasi Pose

```
POSE_STABLE_THRESHOLD = 500ms     // Pose harus konsisten selama 500ms sebelum dianggap valid
POSE_BUFFER_SIZE = 10             // Sliding window 10 frame terakhir
MAJORITY_RATIO = 0.7              // 70% frame harus sama untuk stabil

Algorithm:
1. Setiap frame, push hasil klasifikasi ke buffer (max POSE_BUFFER_SIZE)
2. Hitung pose mayoritas dari buffer
3. Jika mayoritas >= MAJORITY_RATIO DAN sudah konsisten >= POSE_STABLE_THRESHOLD ms:
   → Set currentPose = pose mayoritas
4. Jika tidak memenuhi → tetap di pose sebelumnya
```

### 4.2. Deteksi Tangan Sendekap (Qiyam + Hands Folded)

#### Definisi

Tangan sendekap adalah posisi tangan kanan di atas tangan kiri yang diletakkan di dada, khas posisi qiyam dalam shalat.

#### Deteksi

Menggunakan keypoints wrist dan elbow dari MoveNet:

```
Kondisi Sendekap:
1. Pose === "qiyam"
2. Jarak horizontal antara left_wrist dan right_wrist < 20% frame width
   → Kedua tangan saling berdekatan
3. Posisi Y rata-rata wrist berada antara shoulder_y dan hip_y
   → Tangan di area dada/perut
4. Kedua wrist berada di area tengah horizontal frame (25%-75% frame width)
   → Tangan di depan badan, bukan di samping

Confidence score:
- wrist keypoints score >= 0.3
```

#### Behavior saat Qiyam + Sendekap Terdeteksi

1. Tampilkan ayat dari daftar surah yang dipilih user sebelumnya
2. Ayat ditampilkan di center screen dengan font besar (Amiri Quran)
3. Ayat sebelumnya (dim) di atas, ayat selanjutnya (very dim) di bawah
4. Status bar menunjukkan "Qiyam" dengan indikator hijau

#### Behavior saat BUKAN Qiyam + Sendekap

| Pose | UI Behavior |
|------|-------------|
| Ruku | Layar kosong (gelap), ornament samar "﷽" di tengah |
| Sujud | Layar kosong (gelap), ornament samar "﷽" di tengah |
| Duduk | Layar kosong (gelap), ornament samar "﷽" di tengah |
| Qiyam tanpa sendekap | Ayat tetap tampil tapi dengan opacity berkurang (0.4) + hint text "Sendekapkan tangan untuk mode baca" |

### 4.3. Navigasi Ayat dengan Kedipan Mata

#### Model & Pipeline

- **Model**: MediaPipe FaceMesh via TensorFlow.js
- **Landmarks**: 468 titik wajah
- **Eye landmarks**:
  - Mata kiri: upper lid (159), lower lid (145), inner corner (133), outer corner (33)
  - Mata kanan: upper lid (386), lower lid (374), inner corner (362), outer corner (263)

#### Eye Aspect Ratio (EAR)

```
Untuk setiap mata:

EAR = |upper_lid.y - lower_lid.y| / |inner_corner.x - outer_corner.x|

- Menggunakan 4 titik per mata untuk rasio yang lebih stabil
- EAR tinggi = mata terbuka
- EAR rendah = mata tertutup

Kalibrasi:
- Saat setup, rekam EAR selama 3 detik saat mata terbuka → baseline_EAR
- CLOSED_THRESHOLD = baseline_EAR * 0.35 (35% dari baseline)
```

#### Definisi Kedipan yang Disengaja

```
BLINK_MIN_DURATION = 250ms       // Minimum durasi mata tertutup (menghindari kedipan alami ~150ms)
BLINK_MAX_DURATION = 1500ms      // Maximum durasi (menghindari menutup mata lama / tidur)
ADVANCE_COOLDOWN = 1000ms        // Cooldown antar navigasi
BLINK_TYPE = "both"              // Kedua mata bersamaan

Algorithm:
1. Setiap frame, hitung EAR kedua mata
2. Jika EAR_kiri < CLOSED_THRESHOLD DAN EAR_kanan < CLOSED_THRESHOLD:
   → Catat timestamp mulai (eyes_closed_start)
3. Jika salah satu mata EAR > CLOSED_THRESHOLD (mata terbuka kembali):
   → Hitung durasi = now - eyes_closed_start
   → Jika BLINK_MIN_DURATION <= durasi <= BLINK_MAX_DURATION:
     → Jika now - last_advance_time > ADVANCE_COOLDOWN:
       → Jika pose === "qiyam" DAN sendekap === true:
         → Trigger NEXT AYAT
         → last_advance_time = now
         → Tampilkan visual feedback (flash singkat di border)
4. Reset eyes_closed_start = 0
```

#### Visual Feedback Kedipan

- Saat kedipan terdeteksi: border layar flash emas selama 200ms
- Toast notification "Ayat berikutnya >" selama 1 detik
- Badge "👁 Kedipan terdeteksi" di status bar berubah warna emas selama 500ms

#### Anti-False-Positive

1. **Natural blink filter**: Kedipan alami ~100-150ms, threshold 250ms mengeliminasi ini
2. **Pose gate**: Kedipan hanya aktif saat qiyam + sendekap
3. **Cooldown**: 1 detik antar navigasi, mencegah double-trigger
4. **Both eyes required**: Harus kedua mata tertutup bersamaan, menghindari kedipan satu mata yang tidak disengaja

---

## 5. Halaman & User Flow

### 5.1. Flow Diagram

```
[Home] → Pilih surah → [Setup] → Kalibrasi kamera → [Prayer Mode]
                                                         │
                                            ┌─────────── ┤
                                            │             │
                                        [Qiyam+         [Ruku/Sujud/
                                         Sendekap]       Duduk]
                                            │             │
                                        Tampil ayat    Layar gelap
                                            │
                                        Kedip mata
                                            │
                                        Next ayat
                                            │
                                        Ayat terakhir?
                                            │
                                        ┌───┴───┐
                                        No     Yes → Toast "Selesai"
                                        │
                                        Loop
```

### 5.2. Halaman Home

- Daftar surah (Juz 30 + Al-Fatihah + Yasin)
- Grid card layout, setiap card: nomor surah, nama Arab, nama latin, jumlah ayat
- Search/filter surah
- Pilihan mode: "Pilih Surah" untuk shalat

### 5.3. Halaman Setup

- Preview kamera (640x480, mirrored)
- Status loading model AI
- Pose detection preview (skeleton overlay opsional)
- Kalibrasi EAR (instruksi: "Buka mata normal selama 3 detik")
- Indikator kesiapan: model loaded, kamera aktif, pose terdeteksi
- Tombol "Mulai Shalat" (enabled setelah semua siap)

### 5.4. Halaman Prayer Mode (Prompter)

#### Layout

```
┌──────────────────────────────────────────────┐
│  [Surah Name]              [◄] [►] [✕]      │  ← Header (semi-transparent)
│                                              │
│                                              │
│        Ayat sebelumnya (dim, kecil)          │
│                                              │
│     ══════════════════════════════           │
│     ║  AYAT SAAT INI (besar)    ║           │  ← Center, dominant
│     ║  + nomor ayat badge       ║           │
│     ══════════════════════════════           │
│                                              │
│        Ayat selanjutnya (sangat dim)         │
│                                              │
│                                              │
│ [Qiyam ●]      [● ● ● ● ●]    [👁 Aktif]   │  ← Status bar
└──────────────────────────────────────────────┘
                                      ┌────────┐
                                      │ Camera │  ← Mini preview (120x90)
                                      │ Mini   │
                                      └────────┘
```

#### Interaksi

| Input | Aksi | Kondisi |
|-------|------|---------|
| Kedip mata (>250ms) | Next ayat | Qiyam + sendekap |
| Keyboard → / Space | Next ayat | Selalu (debug) |
| Keyboard ← | Prev ayat | Selalu (debug) |
| Keyboard Esc | Keluar | Selalu |
| Tombol ► (header) | Next ayat | Selalu |
| Tombol ◄ (header) | Prev ayat | Selalu |
| Tombol ✕ (header) | Keluar ke home | Selalu |

---

## 6. Offline Strategy

### 6.1. PWA & Service Worker

- Menggunakan `vite-plugin-pwa` dengan **Workbox**
- Strategy: **Cache First** untuk semua asset
- Precache: HTML, JS, CSS, fonts, TF model files
- Runtime cache: API response dari Quran API

### 6.2. Data Storage (IndexedDB)

```typescript
interface QuranStore {
  surahMeta: SurahMeta[];         // Daftar 114 surah + metadata
  ayatCache: {                     // Cache per surah
    [surahNumber: number]: Ayat[];
  };
  userPrefs: {
    lastSurah: number;
    fontSize: number;
    cameraEnabled: boolean;
    earBaseline: number;           // Kalibrasi EAR
  };
}
```

### 6.3. Model Caching

- TF.js models di-cache via IndexedDB (built-in TF caching)
- First load: download ~5MB (MoveNet) + ~3MB (FaceMesh)
- Subsequent loads: from IndexedDB cache, 0 network

### 6.4. Quran Data Seeding

- Backend Go menyediakan endpoint `/api/surah/:number`
- Saat pertama kali surah dipilih, data di-fetch lalu disimpan di IndexedDB
- Selanjutnya selalu baca dari IndexedDB
- Opsi: pre-seed semua surah Juz 30 saat first install (~200KB total)

---

## 7. Backend Go

### 7.1. Kebutuhan

Backend Go bersifat **opsional** — digunakan untuk:
1. Serve static files (build output React)
2. Proxy/cache Quran API (menghindari CORS + menyediakan fallback)
3. Serve TF model files dari lokal (menghindari CDN dependency)

### 7.2. API Endpoints

```
GET  /api/quran/meta              → Daftar surah (114 surah + metadata)
GET  /api/quran/surah/:number     → Ayat-ayat surah (teks Arab)
GET  /api/health                  → Health check

GET  /models/movenet/*            → Static TF model files
GET  /models/facemesh/*           → Static FaceMesh model files
GET  /*                           → Static files (React build)
```

### 7.3. Struktur Backend

```
backend/
├── main.go                // Entry point, router setup
├── handler/
│   ├── quran.go           // Handler GET surah & meta
│   └── health.go          // Health check
├── service/
│   └── quran.go           // Business logic, cache layer
├── data/
│   └── quran.json         // Embedded Quran data (offline fallback)
├── models/                // TF model files (downloaded saat build)
│   ├── movenet/
│   └── facemesh/
├── go.mod
└── go.sum
```

### 7.4. Dependencies Go

- `net/http` (stdlib) — HTTP server
- `embed` (stdlib) — Embed Quran data JSON + React build
- Tidak perlu framework — endpoint sangat sedikit

---

## 8. Struktur Project Frontend

```
src/
├── main.tsx                       // Entry point
├── App.tsx                        // Router + global layout
├── vite-env.d.ts
│
├── components/
│   ├── ui/                        // Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   ├── home/
│   │   ├── SurahGrid.tsx          // Grid daftar surah
│   │   └── SurahCard.tsx          // Card individual surah
│   │
│   ├── setup/
│   │   ├── CameraPreview.tsx      // Preview kamera + skeleton overlay
│   │   ├── CalibrationGuide.tsx   // Panduan kalibrasi EAR
│   │   └── ReadinessCheck.tsx     // Checklist kesiapan
│   │
│   └── prayer/
│       ├── AyatDisplay.tsx        // Tampilan ayat (prev, current, next)
│       ├── PrompterHeader.tsx     // Header surah + kontrol
│       ├── StatusBar.tsx          // Pose badge, progress, blink indicator
│       ├── BlankOverlay.tsx       // Overlay saat ruku/sujud/duduk
│       └── CameraMini.tsx         // Mini camera preview
│
├── hooks/
│   ├── useCamera.ts               // Camera stream management
│   ├── usePoseDetection.ts        // MoveNet pose detection loop
│   ├── useFaceDetection.ts        // FaceMesh face detection
│   ├── useBlinkDetection.ts       // Blink detection + EAR logic
│   ├── usePoseClassifier.ts       // Pose classification + stabilization
│   ├── useHandPosition.ts         // Sendekap (folded hands) detection
│   └── useOfflineStorage.ts       // IndexedDB operations
│
├── workers/
│   ├── pose.worker.ts             // Web Worker untuk pose detection (opsional, jika perlu offload)
│   └── face.worker.ts             // Web Worker untuk face detection (opsional)
│
├── stores/
│   ├── prayerStore.ts             // State: surah terpilih, ayat index, pose, blink
│   └── appStore.ts                // State: page, loading, model status
│
├── services/
│   ├── quranService.ts            // Fetch + cache ayat data
│   ├── poseService.ts             // TF.js pose model init + inference
│   ├── faceService.ts             // TF.js face model init + inference
│   └── storageService.ts          // IndexedDB CRUD operations
│
├── lib/
│   ├── poseClassifier.ts          // Pure function: keypoints → pose label
│   ├── blinkDetector.ts           // Pure function: landmarks → blink event
│   ├── handsDetector.ts           // Pure function: keypoints → sendekap boolean
│   └── constants.ts               // Semua threshold constants
│
├── types/
│   ├── pose.ts                    // PoseType, Keypoint, PoseResult
│   ├── quran.ts                   // Surah, Ayat, SurahMeta
│   └── detection.ts               // BlinkEvent, EARData, HandPosition
│
├── pages/
│   ├── HomePage.tsx
│   ├── SetupPage.tsx
│   └── PrayerPage.tsx
│
└── assets/
    └── fonts/                     // Amiri Quran, Cairo (self-hosted for offline)
```

---

## 9. Konstanta & Threshold

```typescript
// === Pose Detection ===
export const POSE_CONFIDENCE_MIN = 0.3;
export const POSE_STABLE_DURATION_MS = 500;
export const POSE_BUFFER_SIZE = 10;
export const POSE_MAJORITY_RATIO = 0.7;
export const DETECTION_FPS = 15;

// === Sendekap Detection ===
export const SENDEKAP_WRIST_DISTANCE_MAX = 0.20;    // 20% frame width
export const SENDEKAP_WRIST_Y_MARGIN = 0.05;        // 5% margin dari shoulder/hip
export const SENDEKAP_CENTER_MIN = 0.25;             // 25% frame width
export const SENDEKAP_CENTER_MAX = 0.75;             // 75% frame width
export const SENDEKAP_WRIST_CONFIDENCE = 0.3;

// === Blink Detection ===
export const BLINK_MIN_DURATION_MS = 250;            // Min durasi mata tertutup
export const BLINK_MAX_DURATION_MS = 1500;           // Max durasi mata tertutup
export const BLINK_COOLDOWN_MS = 1000;               // Cooldown antar navigasi
export const EAR_CLOSED_RATIO = 0.35;                // 35% dari baseline = closed
export const EAR_CALIBRATION_DURATION_MS = 3000;     // Durasi kalibrasi

// === Pose Classification Thresholds (normalized 0-1) ===
export const QIYAM_SHOULDER_HIP_MIN_DIST = 0.20;    // Min jarak Y shoulder-hip
export const RUKU_SHOULDER_HIP_MAX_DIFF = 0.15;      // Max selisih Y shoulder-hip
export const SUJUD_NOSE_HIP_RATIO = 0.85;            // Nose Y > hip Y * ratio
export const DUDUK_HIP_KNEE_RATIO = 0.70;            // Hip Y > knee Y * ratio

// === UI ===
export const TOAST_DURATION_MS = 1500;
export const BLINK_FEEDBACK_DURATION_MS = 200;
export const BLANK_OVERLAY_TRANSITION_MS = 800;
```

---

## 10. State Machine — Prayer Mode

```
                    ┌──────────────┐
                    │   LOADING    │
                    │ (init models)│
                    └──────┬───────┘
                           │ models ready
                           ▼
                    ┌──────────────┐
                    │  CALIBRATING │
                    │ (EAR baseline)│
                    └──────┬───────┘
                           │ calibrated
                           ▼
              ┌────────────────────────────┐
              │        DETECTING           │
              │  (pose + face loop aktif)  │
              └─────┬──────────┬───────────┘
                    │          │
            pose=qiyam    pose=ruku/sujud/duduk
            +sendekap         │
                    │          ▼
                    │   ┌─────────────┐
                    │   │  BLANK_MODE │
                    │   │ (layar gelap)│
                    │   └──────┬──────┘
                    │          │ pose=qiyam+sendekap
                    ▼          ▼
              ┌────────────────────┐
              │    READING_MODE    │
              │ (ayat tampil)      │
              │                    │
              │ blink → next ayat  │
              │ last ayat → DONE   │
              └────────┬───────────┘
                       │ exit / last ayat
                       ▼
              ┌────────────────┐
              │     DONE       │
              │ (kembali home) │
              └────────────────┘
```

---

## 11. Performance Budget

| Metric | Target | Catatan |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | Tanpa model loading |
| Model Load (MoveNet) | < 3s | From cache, ~5MB |
| Model Load (FaceMesh) | < 2s | From cache, ~3MB |
| Detection Loop FPS | 15-20 fps | Throttled RAF |
| Pose Classification Latency | < 50ms | Per frame |
| Blink Detection Latency | < 30ms | Per frame |
| Total Bundle Size (gzip) | < 500KB | Tanpa model files |
| Offline Storage | < 50MB | Models + Quran data |
| Memory Usage | < 300MB | Saat prayer mode aktif |

---

## 12. Browser Support

| Browser | Support | Catatan |
|---------|---------|---------|
| Chrome 90+ | Full | Primary target |
| Edge 90+ | Full | Chromium-based |
| Firefox 100+ | Partial | WebGL bisa lambat |
| Safari 15.4+ | Partial | Perlu test MediaPipe compat |
| Chrome Android | Full | Mobile primary |
| Safari iOS 15.4+ | Partial | Camera permissions berbeda |

**Requirement**: WebGL 2.0, getUserMedia API, IndexedDB, Service Worker

---

## 13. Quran Data Schema

```typescript
interface SurahMeta {
  number: number;           // 1-114
  name: string;             // Nama Arab "الفاتحة"
  latinName: string;        // "Al-Fatihah"
  englishName: string;      // "The Opening"
  ayahCount: number;        // Jumlah ayat
  revelationType: string;   // "Meccan" | "Medinan"
}

interface Ayat {
  number: number;           // Nomor ayat dalam surah
  text: string;             // Teks Arab
  surahNumber: number;      // Foreign key ke surah
}

interface AyatCache {
  surahNumber: number;
  ayat: Ayat[];
  cachedAt: number;         // Timestamp
}
```

---

## 14. Dependency List

### Frontend (package.json)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "@tensorflow/tfjs": "^4.21.0",
    "@tensorflow-models/pose-detection": "^2.1.3",
    "@tensorflow-models/face-landmarks-detection": "^1.0.5",
    "@mediapipe/pose": "^0.5.1675469404",
    "@mediapipe/face_mesh": "^0.4.1633559619",
    "zustand": "^4.5.0",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite-plugin-pwa": "^0.20.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0"
  }
}
```

### Backend (go.mod)

```
module github.com/otoritech/telequran-backend

go 1.22

// No external dependencies — stdlib only
```

---

## 15. Development Phases

### Phase 1: Project Setup & Scaffolding
- [ ] Init Vite + React + TypeScript
- [ ] Setup Tailwind CSS + tema dark/Islamic
- [ ] Konfigurasi PWA (vite-plugin-pwa)
- [ ] Self-host fonts (Amiri Quran, Cairo)
- [ ] Setup Zustand stores
- [ ] Setup IndexedDB service

### Phase 2: UI Pages (tanpa AI)
- [ ] HomePage — daftar surah grid
- [ ] SetupPage — camera preview layout
- [ ] PrayerPage — ayat display layout
- [ ] Navigasi antar halaman (react-router)
- [ ] Keyboard shortcuts
- [ ] Responsive design

### Phase 3: Quran Data
- [ ] Integrasi API alquran.cloud
- [ ] IndexedDB caching layer
- [ ] Offline fallback data (Juz 30 embedded)
- [ ] Go backend endpoint (opsional)

### Phase 4: Pose Detection
- [ ] Load MoveNet model
- [ ] Camera stream hook
- [ ] Detection loop (throttled 15fps)
- [ ] Pose classifier (qiyam, ruku, sujud, duduk)
- [ ] Pose stabilizer (sliding window + majority vote)
- [ ] UI update berdasarkan pose
- [ ] Blank overlay saat bukan qiyam

### Phase 5: Hand Position (Sendekap)
- [ ] Wrist position analysis dari MoveNet keypoints
- [ ] Sendekap detection logic
- [ ] Gate: ayat hanya tampil saat qiyam + sendekap
- [ ] Opacity reduction saat qiyam tanpa sendekap

### Phase 6: Blink Detection
- [ ] Load FaceMesh model
- [ ] EAR calculation
- [ ] EAR calibration flow (setup page)
- [ ] Intentional blink detection (250ms-1500ms)
- [ ] Navigation trigger + cooldown
- [ ] Visual feedback (flash + toast)
- [ ] Anti-false-positive measures

### Phase 7: Go Backend
- [ ] Setup Go project structure
- [ ] Quran data endpoint
- [ ] Static file serving
- [ ] Model file hosting
- [ ] Embed React build output

### Phase 8: Offline & PWA
- [ ] Service Worker configuration
- [ ] Precache manifest (app shell + models)
- [ ] Runtime cache (Quran API)
- [ ] Offline indicator UI
- [ ] Install prompt

### Phase 9: Testing & Polish
- [ ] Unit tests (classifier, blink detector)
- [ ] Integration tests (detection loop)
- [ ] Performance profiling
- [ ] Mobile testing
- [ ] Edge case handling (low light, multiple faces, side angle)
- [ ] Accessibility (screen reader basic support)

---

## 16. File Konfigurasi

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/**/*', 'models/**/*'],
      manifest: {
        name: 'Muqri — Teleprompter Imam',
        short_name: 'Muqri',
        description: 'Teleprompter Al-Quran untuk Imam Shalat',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'fullscreen',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.alquran\.cloud/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-api-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

---

## 17. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|---------|
| Pose detection tidak akurat | Ayat tampil/hilang random | Stabilizer + threshold tuning per device |
| False positive blink | Skip ayat tidak sengaja | Strict duration (250ms+), cooldown, both-eyes |
| Kamera gelap / low light | Detection gagal | Fallback ke manual mode (tombol/keyboard) |
| Model loading lambat | UX buruk di first load | Progressive loading + skeleton UI |
| Browser tidak support WebGL | App tidak bisa jalan | Graceful fallback ke manual-only mode |
| Memory leak dari detection loop | Browser crash | Proper cleanup di useEffect, RAF cancel |
| Sudut kamera tidak tepat | Pose misclassified | Panduan posisi kamera di setup page |

---

## 18. Manual Fallback Mode

Jika kamera/AI tidak tersedia atau user memilih manual mode:
- Navigasi ayat via keyboard (←/→/Space)
- Navigasi via tombol on-screen (◄/►)
- Navigasi via swipe gesture (mobile)
- Semua fitur ayat display tetap berfungsi
- Status bar menunjukkan "Mode Manual"
