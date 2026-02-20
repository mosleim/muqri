import { useState, useMemo } from 'react';
import type { SurahMeta } from '@/types/quran';
import { SurahCard } from './SurahCard';

interface SurahGridProps {
  surahs: SurahMeta[];
  onSelect: (surah: SurahMeta) => void;
}

export function SurahGrid({ surahs, onSelect }: SurahGridProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return surahs;
    const q = search.toLowerCase();
    return surahs.filter(
      (s) =>
        s.latinName.toLowerCase().includes(q) ||
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(search) ||
        String(s.number) === q
    );
  }, [surahs, search]);

  return (
    <div>
      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm pb-4 pt-2">
        <input
          type="text"
          placeholder="Cari surah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-100 border border-surface-300/30 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500/50 font-sans text-sm"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((s) => (
          <SurahCard key={s.number} surah={s} onClick={() => onSelect(s)} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-neutral-500 py-12 font-sans">Surah tidak ditemukan</p>
      )}
    </div>
  );
}
