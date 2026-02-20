import type { SurahMeta } from '@/types/quran';

interface SurahCardProps {
  surah: SurahMeta;
  onClick: () => void;
}

export function SurahCard({ surah, onClick }: SurahCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-surface-100 hover:bg-surface-200 border border-surface-300/30 rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:border-primary-500/40 group"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-500/10 text-primary-400 text-xs font-semibold">
          {surah.number}
        </span>
        <span className="text-neutral-500 text-xs">{surah.ayahCount} ayat</span>
      </div>
      <h3 className="font-arabic text-xl text-white mb-1 group-hover:text-primary-300 transition-colors">
        {surah.name}
      </h3>
      <p className="text-sm text-neutral-400">{surah.latinName}</p>
      <p className="text-xs text-neutral-500 mt-1">{surah.revelationType}</p>
    </button>
  );
}
