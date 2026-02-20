interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function CameraPreview({ videoRef }: CameraPreviewProps) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-surface-300/30 bg-black">
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        className="w-full max-w-lg aspect-video object-cover transform -scale-x-100"
        autoPlay
        playsInline
        muted
      />
    </div>
  );
}
