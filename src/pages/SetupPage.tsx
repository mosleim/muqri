import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '@/hooks/useCamera';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useBlinkDetection } from '@/hooks/useBlinkDetection';
import { useAppStore } from '@/stores/appStore';
import { usePrayerStore } from '@/stores/prayerStore';
import { CameraPreview } from '@/components/setup/CameraPreview';
import { ReadinessCheck } from '@/components/setup/ReadinessCheck';

export default function SetupPage() {
  const navigate = useNavigate();
  const { selectedSurah } = usePrayerStore();
  const { videoRef, ready, error, start } = useCamera();
  const { poseModelStatus, faceModelStatus, calibrated, setCameraReady, fontSize, setFontSize } = useAppStore();

  const [startAyah, setStartAyah] = useState(1);

  // Redirect if no surah selected
  useEffect(() => {
    if (!selectedSurah) {
      navigate('/');
    }
  }, [selectedSurah, navigate]);

  // Start camera on mount
  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    setCameraReady(ready);
  }, [ready, setCameraReady]);

  // Init detection models
  usePoseDetection(videoRef, ready);
  const { startCalibration, calibrating } = useBlinkDetection(videoRef, ready);

  const handleStart = () => {
    usePrayerStore.getState().setCurrentAyahIndex(startAyah - 1);
    usePrayerStore.getState().setMode('detecting');
    navigate('/prayer');
  };

  if (!selectedSurah) return null;

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

        {/* Camera */}
        <CameraPreview videoRef={videoRef} />
        {error && (
          <p className="text-red-400 text-sm text-center font-sans">
            Kamera error: {error}
          </p>
        )}

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

        {/* Readiness */}
        <ReadinessCheck
          cameraReady={ready}
          poseModel={poseModelStatus}
          faceModel={faceModelStatus}
          calibrated={calibrated}
          calibrating={calibrating}
          onStartCalibration={startCalibration}
          onStart={handleStart}
        />

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
