import type { SurahMeta, SurahFull } from '@/types/quran';
import { cacheSurah, getCachedSurah } from './storageService';

interface QuranData {
  surahs: (SurahMeta & { ayahs: { number: number; text: string; juz: number; page: number }[] })[];
}

let quranDataCache: QuranData | null = null;

async function loadQuranData(): Promise<QuranData> {
  if (quranDataCache) return quranDataCache;
  const res = await fetch('/data/quran.json');
  if (!res.ok) throw new Error(`Failed to load quran.json: HTTP ${res.status}`);
  const data: QuranData = await res.json();
  quranDataCache = data;
  return data;
}

export async function fetchSurahList(): Promise<SurahMeta[]> {
  const res = await fetch('/data/surah-meta.json');
  if (!res.ok) throw new Error(`Failed to load surah-meta.json: HTTP ${res.status}`);
  return res.json();
}

export async function fetchSurah(number: number): Promise<SurahFull> {
  // Check cache first
  const cached = await getCachedSurah(number);
  if (cached) return cached as SurahFull;

  const data = await loadQuranData();
  const surah = data.surahs.find((s) => s.number === number);
  if (!surah) throw new Error(`Surah ${number} not found`);

  const result: SurahFull = {
    number: surah.number,
    name: surah.name,
    latinName: surah.latinName,
    englishName: surah.englishName,
    ayahCount: surah.ayahCount,
    revelationType: surah.revelationType,
    ayahs: surah.ayahs,
  };

  await cacheSurah(number, result);
  return result;
}
