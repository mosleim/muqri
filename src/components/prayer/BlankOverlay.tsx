export function BlankOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-30 bg-surface flex items-center justify-center transition-opacity duration-800 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <span className="text-4xl text-neutral-800/30 font-arabic select-none">
        &#xFDFD;
      </span>
    </div>
  );
}
