import { useEffect, useRef, useCallback, useState } from 'react';
import { loadFaceModel, detectFace } from '@/services/faceService';
import { computeEARData, computeBaselineEAR } from '@/lib/blinkDetector';
import { useAppStore } from '@/stores/appStore';
import { usePrayerStore } from '@/stores/prayerStore';
import {
  DETECTION_FPS,
  BLINK_MIN_DURATION_MS,
  BLINK_MAX_DURATION_MS,
  BLINK_COOLDOWN_MS,
} from '@/lib/constants';

export function useBlinkDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean
) {
  const rafRef = useRef<number>(0);
  const eyesClosedStart = useRef<number>(0);
  const lastAdvanceTime = useRef<number>(0);
  const calibrationSamples = useRef<number[]>([]);
  const [calibrating, setCalibrating] = useState(false);

  const { setFaceModelStatus, earBaseline, setEarBaseline, setCalibrated, calibrated } =
    useAppStore();
  const { currentPose, isSendekap, nextAyah, triggerBlinkFeedback, mode } =
    usePrayerStore();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        setFaceModelStatus('loading');
        await loadFaceModel();
        if (!cancelled) setFaceModelStatus('ready');
      } catch {
        if (!cancelled) setFaceModelStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, setFaceModelStatus]);

  // Start calibration on button click
  const startCalibration = useCallback(() => {
    calibrationSamples.current = [];
    setCalibrated(false);
    setCalibrating(true);
  }, [setCalibrated]);

  // Calibration loop — only runs when calibrating is true
  useEffect(() => {
    if (!enabled || !calibrating) return;

    const CALIBRATION_MIN_SAMPLES = 5;
    let running = true;

    const loop = async () => {
      if (!running) return;

      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      try {
        const landmarks = await detectFace(video);
        if (landmarks.length > 0) {
          const baseline = computeBaselineEAR(landmarks);
          calibrationSamples.current.push(baseline);

          if (calibrationSamples.current.length >= CALIBRATION_MIN_SAMPLES) {
            const avg =
              calibrationSamples.current.reduce((a, b) => a + b, 0) /
              calibrationSamples.current.length;
            setEarBaseline(avg);
            setCalibrated(true);
            setCalibrating(false);
            return;
          }
        }
      } catch {
        // skip frame
      }

      if (running) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, calibrating, videoRef, setEarBaseline, setCalibrated]);

  // Blink detection loop (after calibration)
  useEffect(() => {
    if (!enabled || !calibrated || earBaseline <= 0 || mode !== 'detecting') return;

    const interval = 1000 / DETECTION_FPS;
    let lastTime = 0;

    const loop = async (time: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (time - lastTime < interval) return;
      lastTime = time;

      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        const landmarks = await detectFace(video);
        if (landmarks.length === 0) return;

        const earData = computeEARData(landmarks, earBaseline);
        const now = performance.now();

        if (earData.isClosed) {
          if (eyesClosedStart.current === 0) {
            eyesClosedStart.current = now;
          }
        } else {
          if (eyesClosedStart.current > 0) {
            const duration = now - eyesClosedStart.current;
            if (
              duration >= BLINK_MIN_DURATION_MS &&
              duration <= BLINK_MAX_DURATION_MS &&
              now - lastAdvanceTime.current > BLINK_COOLDOWN_MS
            ) {
              nextAyah();
              triggerBlinkFeedback();
              lastAdvanceTime.current = now;
            }
          }
          eyesClosedStart.current = 0;
        }
      } catch {
        // skip
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    enabled,
    calibrated,
    earBaseline,
    mode,
    currentPose,
    isSendekap,
    nextAyah,
    triggerBlinkFeedback,
    videoRef,
  ]);

  return { startCalibration, calibrating };
}
