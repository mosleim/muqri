import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrayerStore } from '@/stores/prayerStore';
import { useAppStore } from '@/stores/appStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { AyatDisplay } from '@/components/prayer/AyatDisplay';
import { PrompterHeader } from '@/components/prayer/PrompterHeader';
import { Toast } from '@/components/ui/Toast';

export default function PrayerPage() {
  const navigate = useNavigate();
  const {
    selectedSurah,
    mode,
    currentAyahIndex,
    nextAyah,
    prevAyah,
    reset,
    setMode,
  } = usePrayerStore();
  const { fontSize } = useAppStore();
  const [showAdvanceToast, setShowAdvanceToast] = useState(false);

  // Redirect if no surah
  useEffect(() => {
    if (!selectedSurah) {
      navigate('/');
    }
  }, [selectedSurah, navigate]);

  // Start detecting mode
  useEffect(() => {
    if (selectedSurah && mode !== 'detecting' && mode !== 'done') {
      setMode('detecting');
    }
  }, [selectedSurah, mode, setMode]);

  const currentAyah = selectedSurah?.ayahs[currentAyahIndex];

  const handleMatch = useCallback(() => {
    setShowAdvanceToast(true);
    setTimeout(() => setShowAdvanceToast(false), 500);
    nextAyah();
  }, [nextAyah]);

  // Speech recognition
  const { supported, listening, transcript, similarity, error } = useSpeechRecognition({
    targetText: currentAyah?.text ?? '',
    onMatch: handleMatch,
    active: mode === 'detecting' && !!currentAyah,
  });

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === ' ') {
        e.preventDefault();
        nextAyah();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        prevAyah();
      } else if (e.key === 'Escape') {
        reset();
        navigate('/');
      }
    },
    [nextAyah, prevAyah, reset, navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Done state
  useEffect(() => {
    if (mode === 'done') {
      const t = setTimeout(() => {
        reset();
        navigate('/');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [mode, reset, navigate]);

  if (!selectedSurah) return null;

  return (
    <div className="min-h-screen bg-surface relative">
      <PrompterHeader
        surahName={selectedSurah.name}
        latinName={selectedSurah.latinName}
        onPrev={prevAyah}
        onNext={nextAyah}
        onExit={() => {
          reset();
          navigate('/');
        }}
      />

      {mode === 'done' ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center animate-fade-in">
            <p className="font-arabic text-3xl text-primary-400 mb-2">&#xFDFD;</p>
            <p className="text-white font-sans text-lg">Selesai</p>
            <p className="text-neutral-500 font-sans text-sm mt-1">Kembali ke beranda...</p>
          </div>
        </div>
      ) : (
        <main className="pt-14 pb-20">
          <AyatDisplay
            ayahs={selectedSurah.ayahs}
            currentIndex={currentAyahIndex}
            dimmed={false}
            fontSize={fontSize}
          />
        </main>
      )}

      {/* Speech recognition status bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-100/95 backdrop-blur-sm border-t border-surface-300/20 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs font-sans">
          {/* Mic status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${listening ? 'bg-green-500 animate-pulse' : error ? 'bg-red-500' : 'bg-neutral-500'}`} />
            <span className="text-neutral-400">
              {!supported
                ? 'Speech API tidak didukung'
                : error === 'not-allowed'
                  ? 'Mikrofon tidak diizinkan'
                  : error
                    ? `Error: ${error}`
                    : listening
                      ? 'Mendengarkan...'
                      : 'Memulai...'}
            </span>
            {error === 'not-allowed' && (
              <button
                onClick={async () => {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach((t) => t.stop());
                    window.location.reload();
                  } catch { /* denied */ }
                }}
                className="text-primary-400 hover:text-primary-300"
              >
                Izinkan
              </button>
            )}
          </div>

          {/* Similarity bar */}
          <div className="flex items-center gap-2 flex-1 mx-4 max-w-xs">
            <div className="flex-1 h-1.5 bg-surface-300/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(similarity * 100)}%`,
                  backgroundColor: similarity >= 0.45 ? '#22c55e' : similarity >= 0.25 ? '#eab308' : '#6b7280',
                }}
              />
            </div>
            <span className="text-neutral-500 tabular-nums w-8">{Math.round(similarity * 100)}%</span>
          </div>

          {/* Ayah counter */}
          <span className="text-neutral-500 tabular-nums">
            {currentAyahIndex + 1}/{selectedSurah.ayahs.length}
          </span>
        </div>

        {/* Transcript preview */}
        {transcript && (
          <div className="max-w-2xl mx-auto mt-1 space-y-1">
            <p className="text-white text-sm font-arabic text-right" dir="rtl">
              {transcript}
            </p>
            <p className="text-neutral-600 text-[10px] font-sans">
              combined: {(similarity * 100).toFixed(1)}% | threshold: 45%
            </p>
          </div>
        )}
      </div>

      <Toast message="Ayat berikutnya" visible={showAdvanceToast} />
    </div>
  );
}
