import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrayerStore } from '@/stores/prayerStore';
import { fetchSurahList, fetchSurah } from '@/services/quranService';
import { SurahGrid } from '@/components/home/SurahGrid';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { SurahMeta } from '@/types/quran';

export default function HomePage() {
  const navigate = useNavigate();
  const { surahList, setSurahList, setSelectedSurah } = usePrayerStore();

  useEffect(() => {
    if (surahList.length === 0) {
      fetchSurahList()
        .then(setSurahList)
        .catch(console.error);
    }
  }, [surahList.length, setSurahList]);

  const handleSelect = async (meta: SurahMeta) => {
    try {
      const surah = await fetchSurah(meta.number);
      setSelectedSurah(surah);
      navigate('/setup');
    } catch (err) {
      console.error('Failed to fetch surah:', err);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="px-4 pt-8 pb-4 max-w-5xl mx-auto">
        <h1 className="font-arabic text-3xl text-white mb-1">
          <span className="text-primary-400">&#xFDFD;</span>{' '}
          Muqri
        </h1>
        <p className="text-sm text-neutral-400 font-sans">
          Teleprompter Imam Shalat
        </p>
      </header>

      {/* Content */}
      <main className="px-4 pb-8 max-w-5xl mx-auto">
        {surahList.length === 0 ? (
          <LoadingSpinner text="Memuat daftar surah..." />
        ) : (
          <SurahGrid surahs={surahList} onSelect={handleSelect} />
        )}
      </main>
    </div>
  );
}
