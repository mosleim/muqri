import type { PoseType } from '@/types/pose';

interface StatusBarProps {
  pose: PoseType;
  currentAyah: number;
  totalAyahs: number;
  blinkActive: boolean;
  sendekap: boolean;
}

const poseLabels: Record<PoseType, string> = {
  qiyam: 'Qiyam',
  ruku: 'Ruku',
  sujud: 'Sujud',
  duduk: 'Duduk',
  unknown: '—',
};

const poseColors: Record<PoseType, string> = {
  qiyam: 'bg-primary-500',
  ruku: 'bg-amber-500',
  sujud: 'bg-blue-500',
  duduk: 'bg-purple-500',
  unknown: 'bg-neutral-600',
};

export function StatusBar({ pose, currentAyah, totalAyahs, blinkActive, sendekap }: StatusBarProps) {
  const progress = totalAyahs > 0 ? ((currentAyah + 1) / totalAyahs) * 100 : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-sm border-t border-surface-300/20">
      {/* Progress bar */}
      <div className="h-0.5 bg-surface-200">
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between px-4 py-2 max-w-5xl mx-auto text-xs font-sans">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${poseColors[pose]}`} />
          <span className="text-neutral-300">{poseLabels[pose]}</span>
          {sendekap && pose === 'qiyam' && (
            <span className="text-primary-400 text-[10px]">+ Sendekap</span>
          )}
        </div>
        <div className="text-neutral-400">
          {currentAyah + 1} / {totalAyahs}
        </div>
        <div className="flex items-center gap-1">
          <span className={`transition-colors duration-200 ${blinkActive ? 'text-gold' : 'text-neutral-500'}`}>
            {blinkActive ? 'Kedipan terdeteksi' : 'Blink aktif'}
          </span>
        </div>
      </div>
    </footer>
  );
}
