interface CameraMiniProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  visible: boolean;
}

export function CameraMini({ videoRef, visible }: CameraMiniProps) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-14 right-4 z-50 rounded-lg overflow-hidden border border-surface-300/30 shadow-lg">
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
