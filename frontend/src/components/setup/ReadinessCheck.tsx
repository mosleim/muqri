import type { DetectionStatus } from '@/types/detection';

interface ReadinessCheckProps {
  cameraReady: boolean;
  poseModel: DetectionStatus;
  faceModel: DetectionStatus;
  calibrated: boolean;
  onStartCalibration: () => void;
  onStart: () => void;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full ${ok ? 'bg-primary-500' : 'bg-neutral-600 animate-pulse'}`}
    />
  );
}

export function ReadinessCheck({
  cameraReady,
  poseModel,
  faceModel,
  calibrated,
  onStartCalibration,
  onStart,
}: ReadinessCheckProps) {
  const allReady = cameraReady && poseModel === 'ready' && faceModel === 'ready' && calibrated;

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center gap-3 text-sm">
        <StatusDot ok={cameraReady} />
        <span className={cameraReady ? 'text-white' : 'text-neutral-400'}>Kamera aktif</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <StatusDot ok={poseModel === 'ready'} />
        <span className={poseModel === 'ready' ? 'text-white' : 'text-neutral-400'}>
          Model Pose {poseModel === 'loading' ? '(loading...)' : poseModel === 'error' ? '(error)' : ''}
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <StatusDot ok={faceModel === 'ready'} />
        <span className={faceModel === 'ready' ? 'text-white' : 'text-neutral-400'}>
          Model Wajah {faceModel === 'loading' ? '(loading...)' : faceModel === 'error' ? '(error)' : ''}
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <StatusDot ok={calibrated} />
        <span className={calibrated ? 'text-white' : 'text-neutral-400'}>
          Kalibrasi mata
        </span>
        {faceModel === 'ready' && !calibrated && (
          <button
            onClick={onStartCalibration}
            className="ml-auto text-xs bg-gold/20 text-gold px-3 py-1 rounded-lg hover:bg-gold/30 transition-colors"
          >
            Mulai kalibrasi
          </button>
        )}
      </div>

      <button
        onClick={onStart}
        disabled={!allReady}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all mt-4 ${
          allReady
            ? 'bg-primary-600 hover:bg-primary-500 text-white'
            : 'bg-surface-200 text-neutral-600 cursor-not-allowed'
        }`}
      >
        Mulai Shalat
      </button>
    </div>
  );
}
