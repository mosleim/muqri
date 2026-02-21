interface PrompterHeaderProps {
  surahName: string;
  latinName: string;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}

export function PrompterHeader({ surahName, latinName, onPrev, onNext, onExit }: PrompterHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-sm border-b border-surface-300/20">
      <div className="flex items-center justify-between px-4 py-2 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-arabic text-lg text-white">{surahName}</span>
          <span className="text-xs text-neutral-400 font-sans">{latinName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onNext}
            className="p-2 rounded-lg hover:bg-surface-200 text-neutral-400 hover:text-white transition-colors text-sm"
            title="Ayat selanjutnya"
          >
            &#9654;
          </button>
          <button
            onClick={onPrev}
            className="p-2 rounded-lg hover:bg-surface-200 text-neutral-400 hover:text-white transition-colors text-sm"
            title="Ayat sebelumnya"
          >
            &#9664;
          </button>
          <button
            onClick={onExit}
            className="p-2 rounded-lg hover:bg-red-900/40 text-neutral-400 hover:text-red-400 transition-colors text-sm ml-2"
            title="Keluar"
          >
            &#10005;
          </button>
        </div>
      </div>
    </header>
  );
}
