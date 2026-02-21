# Muqri (مُقرئ)

**Al-Quran Teleprompter for Prayer Leaders (Imam)**

Muqri is a PWA web app that displays Quran verses in real-time while leading prayer. It uses the device camera to detect prayer movements and eye blinks for hands-free verse navigation — no screen touching needed.

**Live:** [muqri.mosleim.com](https://muqri.mosleim.com)

---

## Key Features

- **Prayer Movement Detection** — Recognizes qiyam (standing), ruku (bowing), sujud (prostration), and sitting positions using MoveNet (TensorFlow.js)
- **Eye Blink Navigation** — Intentional eye blinks (>250ms) advance to the next verse, powered by MediaPipe FaceMesh
- **Sendekap Mode** — Automatically shows/hides verses based on folded arms position
- **Offline-First (PWA)** — Fully functional offline after initial load
- **Surah & Verse Selection** — Start from any surah and verse number
- **Font Size Control** — Adjust Arabic text size for comfortable reading distance
- **Auto-Advance Surah** — Automatically continues to the next surah

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | Frontend SPA |
| Vite 5 | Build tool |
| Tailwind CSS 3 | Styling (dark theme) |
| Zustand | State management |
| TensorFlow.js (MoveNet) | Body pose detection |
| MediaPipe FaceMesh | Eye blink detection |
| IndexedDB (idb) | Offline data cache |
| VitePWA (Workbox) | Service worker & offline support |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
git clone https://github.com/mosleim/muqri.git
cd muqri
pnpm install
```

### Development

```bash
pnpm dev
```

Open `http://localhost:5173` in your browser. Use a browser with WebRTC support (Chrome/Edge recommended).

### Build

```bash
pnpm build
```

Output goes to the `dist/` folder, ready for static site deployment.

---

## How to Use

1. **Select Surah** — Choose a surah from the home page
2. **Setup** — Allow camera access, wait for AI models to load, then calibrate eye tracking
3. **Start Praying** — Verse text appears automatically when standing (qiyam) with folded arms
4. **Navigate** — Blink intentionally (>250ms) to advance to the next verse
5. **Automatic** — Text hides during ruku/sujud and reappears when standing

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` (Left) | Next verse (RTL) |
| `→` (Right) | Previous verse (RTL) |
| `Space` | Next verse |
| `Esc` | Exit |

---

## Data Source

Quran data from [quran-json](https://www.npmjs.com/package/quran-json) via CDN:

```
https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json
```

---

## Deployment

Deployed as a static site on Cloudflare Pages. Can also be deployed on any static hosting platform (Netlify, Vercel, GitHub Pages, etc.).

---

## Contact

**Email:** mosleim@gmail.com

---

## License

MIT
