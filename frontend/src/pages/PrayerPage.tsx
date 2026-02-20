import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '@/hooks/useCamera';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useBlinkDetection } from '@/hooks/useBlinkDetection';
import { usePrayerStore } from '@/stores/prayerStore';
import { AyatDisplay } from '@/components/prayer/AyatDisplay';
import { PrompterHeader } from '@/components/prayer/PrompterHeader';
import { StatusBar } from '@/components/prayer/StatusBar';
import { BlankOverlay } from '@/components/prayer/BlankOverlay';
import { CameraMini } from '@/components/prayer/CameraMini';
import { Toast } from '@/components/ui/Toast';

export default function PrayerPage() {
  const navigate = useNavigate();
  const {
    selectedSurah,
    mode,
    currentAyahIndex,
    currentPose,
    isSendekap,
    blinkFeedback,
    nextAyah,
    prevAyah,
    reset,
  } = usePrayerStore();
  const { videoRef, ready, start } = useCamera();

  // Start camera
  useEffect(() => {
    start();
  }, [start]);

  // Init detections
  usePoseDetection(videoRef, ready && mode === 'detecting');
  useBlinkDetection(videoRef, ready && mode === 'detecting');

  // Redirect if no surah
  useEffect(() => {
    if (!selectedSurah) {
      navigate('/');
    }
  }, [selectedSurah, navigate]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextAyah();
      } else if (e.key === 'ArrowLeft') {
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

  // Debounce blank mode — wait 2.5s before hiding text when pose leaves qiyam
  const [debouncedBlank, setDebouncedBlank] = useState(false);
  const blankTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rawBlank = currentPose !== 'qiyam' && currentPose !== 'unknown';

  useEffect(() => {
    if (rawBlank) {
      blankTimerRef.current = setTimeout(() => setDebouncedBlank(true), 2500);
    } else {
      if (blankTimerRef.current) clearTimeout(blankTimerRef.current);
      setDebouncedBlank(false);
    }
    return () => {
      if (blankTimerRef.current) clearTimeout(blankTimerRef.current);
    };
  }, [rawBlank]);

  // Debounce sendekap→not-sendekap to prevent flicker from detection noise
  const [debouncedSendekap, setDebouncedSendekap] = useState(false);
  const sendekapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isSendekap) {
      // Immediately show text when sendekap detected
      if (sendekapTimerRef.current) clearTimeout(sendekapTimerRef.current);
      setDebouncedSendekap(true);
    } else {
      // Delay before dimming text when leaving sendekap
      sendekapTimerRef.current = setTimeout(() => setDebouncedSendekap(false), 2000);
    }
    return () => {
      if (sendekapTimerRef.current) clearTimeout(sendekapTimerRef.current);
    };
  }, [isSendekap]);

  const isBlankMode = debouncedBlank;
  const isDimmed = currentPose === 'qiyam' && !debouncedSendekap;

  return (
    <div
      className={`min-h-screen bg-surface relative ${
        blinkFeedback ? 'animate-blink-feedback' : ''
      }`}
    >
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

      <BlankOverlay visible={isBlankMode} />

      {mode === 'done' ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center animate-fade-in">
            <p className="font-arabic text-3xl text-primary-400 mb-2">&#xFDFD;</p>
            <p className="text-white font-sans text-lg">Selesai</p>
            <p className="text-neutral-500 font-sans text-sm mt-1">Kembali ke beranda...</p>
          </div>
        </div>
      ) : (
        <main className="pt-14 pb-14">
          <AyatDisplay
            ayahs={selectedSurah.ayahs}
            currentIndex={currentAyahIndex}
            dimmed={isDimmed}
          />
        </main>
      )}

      <StatusBar
        pose={currentPose}
        currentAyah={currentAyahIndex}
        totalAyahs={selectedSurah.ayahs.length}
        blinkActive={blinkFeedback}
        sendekap={isSendekap}
      />

      <CameraMini videoRef={videoRef} visible={ready} />

      <Toast message="Ayat berikutnya" visible={blinkFeedback} />
    </div>
  );
}
