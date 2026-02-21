import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { usePrayerStore } from '@/stores/prayerStore';

export default function SetupPage() {
  const navigate = useNavigate();
  const { selectedSurah } = usePrayerStore();
  const { fontSize, setFontSize } = useAppStore();

  const [startAyah, setStartAyah] = useState(1);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // Redirect if no surah selected
  useEffect(() => {
    if (!selectedSurah) {
      navigate('/');
    }
  }, [selectedSurah, navigate]);

  // Check microphone permission
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        setMicPermission(result.state as 'prompt' | 'granted' | 'denied');
        result.onchange = () => setMicPermission(result.state as 'prompt' | 'granted' | 'denied');
      }).catch(() => {
        // permissions API might not support microphone query
      });
    }
  }, []);

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission('granted');
    } catch {
      setMicPermission('denied');
    }
  };

  const handleStart = () => {
    usePrayerStore.getState().setCurrentAyahIndex(startAyah - 1);
    usePrayerStore.getState().setMode('detecting');
    navigate('/prayer');
  };

  if (!selectedSurah) return null;

  // Check Web Speech API support
  const speechSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const canStart = speechSupported && micPermission === 'granted';

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Surah info */}
        <div className="text-center">
          <h2 className="font-arabic text-2xl text-white">{selectedSurah.name}</h2>
          <p className="text-sm text-neutral-400 font-sans mt-1">
            {selectedSurah.latinName} &middot; {selectedSurah.ayahCount} ayat
          </p>
        </div>

        {/* Settings */}
        <div className="space-y-3 bg-surface-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-400 font-sans">Mulai dari ayat</label>
            <input
              type="number"
              min={1}
              max={selectedSurah.ayahCount}
              value={startAyah}
              onChange={(e) => {
                const v = Math.max(1, Math.min(selectedSurah.ayahCount, Number(e.target.value) || 1));
                setStartAyah(v);
              }}
              className="w-20 bg-surface-200 text-white text-sm text-center rounded-lg px-2 py-1.5 border border-surface-300 font-sans"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-400 font-sans">Ukuran font</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(Math.max(20, fontSize - 4))}
                className="w-8 h-8 bg-surface-200 text-white rounded-lg text-sm hover:bg-surface-300 transition-colors"
              >
                -
              </button>
              <span className="text-sm text-white font-sans w-8 text-center">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(56, fontSize + 4))}
                className="w-8 h-8 bg-surface-200 text-white rounded-lg text-sm hover:bg-surface-300 transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <p className="font-arabic text-neutral-400 text-center" style={{ fontSize }} dir="rtl">
            بِسۡمِ ٱللَّهِ
          </p>
        </div>

        {/* Microphone & Speech API status */}
        <div className="space-y-2 bg-surface-100 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white font-sans">Status</h3>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${speechSupported ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-neutral-400 font-sans">
              {speechSupported ? 'Speech API tersedia' : 'Speech API tidak didukung di browser ini'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              micPermission === 'granted' ? 'bg-green-500' :
              micPermission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="text-sm text-neutral-400 font-sans">
              {micPermission === 'granted' ? 'Mikrofon diizinkan' :
               micPermission === 'denied' ? 'Mikrofon ditolak' : 'Mikrofon belum diizinkan'}
            </span>
            {micPermission === 'prompt' && (
              <button
                onClick={requestMic}
                className="ml-auto text-xs text-primary-400 hover:text-primary-300 font-sans"
              >
                Izinkan
              </button>
            )}
          </div>

          {micPermission === 'denied' && (
            <p className="text-xs text-red-400/80 font-sans mt-1">
              Buka pengaturan browser untuk mengizinkan akses mikrofon.
            </p>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-3 rounded-xl font-sans font-medium text-sm transition-colors ${
            canStart
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-surface-200 text-neutral-600 cursor-not-allowed'
          }`}
        >
          Mulai
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full py-2 text-sm text-neutral-500 hover:text-white transition-colors font-sans"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}
