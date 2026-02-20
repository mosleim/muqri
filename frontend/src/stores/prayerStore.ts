import { create } from 'zustand';
import type { PoseType } from '@/types/pose';
import type { SurahFull, SurahMeta } from '@/types/quran';

type PrayerMode = 'idle' | 'loading' | 'calibrating' | 'detecting' | 'done';

interface PrayerState {
  // Surah selection
  surahList: SurahMeta[];
  selectedSurah: SurahFull | null;

  // Prayer session
  mode: PrayerMode;
  currentAyahIndex: number;
  currentPose: PoseType;
  isSendekap: boolean;
  blinkFeedback: boolean;

  // Actions
  setSurahList: (list: SurahMeta[]) => void;
  setSelectedSurah: (surah: SurahFull | null) => void;
  setMode: (mode: PrayerMode) => void;
  setCurrentAyahIndex: (i: number) => void;
  nextAyah: () => void;
  prevAyah: () => void;
  setCurrentPose: (pose: PoseType) => void;
  setIsSendekap: (v: boolean) => void;
  triggerBlinkFeedback: () => void;
  reset: () => void;
}

export const usePrayerStore = create<PrayerState>((set, get) => ({
  surahList: [],
  selectedSurah: null,
  mode: 'idle',
  currentAyahIndex: 0,
  currentPose: 'unknown',
  isSendekap: false,
  blinkFeedback: false,

  setSurahList: (list) => set({ surahList: list }),
  setSelectedSurah: (surah) => set({ selectedSurah: surah, currentAyahIndex: 0 }),
  setMode: (mode) => set({ mode }),
  setCurrentAyahIndex: (i) => set({ currentAyahIndex: i }),
  nextAyah: () => {
    const { selectedSurah, currentAyahIndex } = get();
    if (selectedSurah && currentAyahIndex < selectedSurah.ayahs.length - 1) {
      set({ currentAyahIndex: currentAyahIndex + 1 });
    } else if (selectedSurah && currentAyahIndex >= selectedSurah.ayahs.length - 1) {
      set({ mode: 'done' });
    }
  },
  prevAyah: () => {
    const { currentAyahIndex } = get();
    if (currentAyahIndex > 0) {
      set({ currentAyahIndex: currentAyahIndex - 1 });
    }
  },
  setCurrentPose: (pose) => set({ currentPose: pose }),
  setIsSendekap: (v) => set({ isSendekap: v }),
  triggerBlinkFeedback: () => {
    set({ blinkFeedback: true });
    setTimeout(() => set({ blinkFeedback: false }), 200);
  },
  reset: () =>
    set({
      selectedSurah: null,
      mode: 'idle',
      currentAyahIndex: 0,
      currentPose: 'unknown',
      isSendekap: false,
      blinkFeedback: false,
    }),
}));
