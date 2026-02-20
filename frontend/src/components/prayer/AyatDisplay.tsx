import type { Ayah } from '@/types/quran';

interface AyatDisplayProps {
  ayahs: Ayah[];
  currentIndex: number;
  dimmed: boolean;
}

export function AyatDisplay({ ayahs, currentIndex, dimmed }: AyatDisplayProps) {
  const prev = currentIndex > 0 ? ayahs[currentIndex - 1] : null;
  const current = ayahs[currentIndex];
  const next = currentIndex < ayahs.length - 1 ? ayahs[currentIndex + 1] : null;

  if (!current) return null;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 transition-opacity duration-500"
      style={{ opacity: dimmed ? 0.4 : 1 }}
    >
      {/* Ayat sebelumnya */}
      {prev && (
        <p className="font-arabic text-lg sm:text-xl text-neutral-600 text-center mb-6 leading-[2.2] max-w-3xl">
          {prev.text}
          <span className="text-xs text-neutral-700 mr-2"> ({prev.number})</span>
        </p>
      )}

      {/* Ayat saat ini */}
      <div className="relative">
        <p className="font-arabic text-2xl sm:text-3xl md:text-4xl text-white text-center leading-[3] max-w-4xl" dir="rtl">
          {current.text}
        </p>
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500/20 text-primary-400 text-xs px-2 py-0.5 rounded-full font-sans">
          {current.number}
        </span>
      </div>

      {/* Ayat selanjutnya */}
      {next && (
        <p className="font-arabic text-lg sm:text-xl text-neutral-700 text-center mt-6 leading-[2.2] max-w-3xl">
          {next.text}
          <span className="text-xs text-neutral-800 mr-2"> ({next.number})</span>
        </p>
      )}

      {dimmed && (
        <p className="text-neutral-500 text-sm font-sans mt-8 animate-fade-in">
          Sendekapkan tangan untuk mode baca
        </p>
      )}
    </div>
  );
}
