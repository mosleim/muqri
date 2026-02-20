import type { SurahMeta, SurahFull } from '@/types/quran';
import { cacheSurah, getCachedSurah } from './storageService';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Unknown error');
  return json.data;
}

export async function fetchSurahList(): Promise<SurahMeta[]> {
  return fetchJSON<SurahMeta[]>('/api/quran/meta');
}

export async function fetchSurah(number: number): Promise<SurahFull> {
  // Check cache first
  const cached = await getCachedSurah(number);
  if (cached) return cached as SurahFull;

  const data = await fetchJSON<SurahFull>(`/api/quran/surah/${number}`);
  await cacheSurah(number, data);
  return data;
}
