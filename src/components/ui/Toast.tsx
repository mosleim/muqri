import { useEffect, useState } from 'react';
import { TOAST_DURATION_MS } from '@/lib/constants';

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const t = setTimeout(() => setShow(false), TOAST_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gold/90 text-surface px-4 py-2 rounded-lg text-sm font-sans font-semibold shadow-lg">
        {message}
      </div>
    </div>
  );
}
