import type { SurahMeta, SurahFull } from '@/types/quran';
import { cacheSurah, getCachedSurah } from './storageService';

const QURAN_CDN_URL = 'https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json';

interface CdnVerse {
  id: number;
  text: string;
}

interface CdnSurah {
  id: number;
  name: string;
  transliteration: string;
  type: string;
  total_verses: number;
  verses: CdnVerse[];
}

let cdnCache: CdnSurah[] | null = null;

async function loadCdnData(): Promise<CdnSurah[]> {
  if (cdnCache) return cdnCache;
  const res = await fetch(QURAN_CDN_URL);
  if (!res.ok) throw new Error(`Failed to load quran CDN: HTTP ${res.status}`);
  const data: CdnSurah[] = await res.json();
  cdnCache = data;
  return data;
}

export async function fetchSurahList(): Promise<SurahMeta[]> {
  const data = await loadCdnData();
  return data.map((s) => ({
    number: s.id,
    name: s.name,
    latinName: s.transliteration,
    englishName: s.transliteration,
    ayahCount: s.total_verses,
    revelationType: s.type,
  }));
}

export async function fetchSurah(number: number): Promise<SurahFull> {
  const cached = await getCachedSurah(number);
  if (cached) return cached as SurahFull;

  const data = await loadCdnData();
  const surah = data.find((s) => s.id === number);
  if (!surah) throw new Error(`Surah ${number} not found`);

  const result: SurahFull = {
    number: surah.id,
    name: surah.name,
    latinName: surah.transliteration,
    englishName: surah.transliteration,
    ayahCount: surah.total_verses,
    revelationType: surah.type,
    ayahs: surah.verses.map((v) => ({ number: v.id, text: v.text })),
  };

  await cacheSurah(number, result);
  return result;
}
