interface CameraMiniProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  visible: boolean;
}

export function CameraMini({ videoRef, visible }: CameraMiniProps) {
  return (
    <div
      className={`fixed bottom-16 right-4 z-50 rounded-lg overflow-hidden border border-surface-300/30 shadow-lg transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        className="w-[120px] h-[90px] object-cover transform -scale-x-100"
        autoPlay
        playsInline
        muted
      />
    </div>
  );
}
