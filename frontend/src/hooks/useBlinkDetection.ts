import { useEffect, useRef, useCallback } from 'react';
import { loadFaceModel, detectFace } from '@/services/faceService';
import { computeEARData, computeBaselineEAR } from '@/lib/blinkDetector';
import { useAppStore } from '@/stores/appStore';
import { usePrayerStore } from '@/stores/prayerStore';
import {
  DETECTION_FPS,
  BLINK_MIN_DURATION_MS,
  BLINK_MAX_DURATION_MS,
  BLINK_COOLDOWN_MS,
  EAR_CALIBRATION_DURATION_MS,
} from '@/lib/constants';

export function useBlinkDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean
) {
  const rafRef = useRef<number>(0);
  const eyesClosedStart = useRef<number>(0);
  const lastAdvanceTime = useRef<number>(0);
  const calibrationSamples = useRef<number[]>([]);
  const calibrationStart = useRef<number>(0);

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

  // Calibration
  const startCalibration = useCallback(() => {
    calibrationSamples.current = [];
    calibrationStart.current = Date.now();
    setCalibrated(false);
  }, [setCalibrated]);

  useEffect(() => {
    if (!enabled || calibrated) return;

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

        const baseline = computeBaselineEAR(landmarks);
        calibrationSamples.current.push(baseline);

        if (Date.now() - calibrationStart.current >= EAR_CALIBRATION_DURATION_MS) {
          const avg =
            calibrationSamples.current.reduce((a, b) => a + b, 0) /
            calibrationSamples.current.length;
          setEarBaseline(avg);
          setCalibrated(true);
          cancelAnimationFrame(rafRef.current);
        }
      } catch {
        // skip
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, calibrated, videoRef, setEarBaseline, setCalibrated]);

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
              now - lastAdvanceTime.current > BLINK_COOLDOWN_MS &&
              currentPose === 'qiyam' &&
              isSendekap
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

  return { startCalibration };
}
