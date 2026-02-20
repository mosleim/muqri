import { useEffect, useRef, useCallback } from 'react';
import { loadPoseModel, detectPose, disposePoseModel } from '@/services/poseService';
import { classifyPose } from '@/lib/poseClassifier';
import { detectSendekap } from '@/lib/handsDetector';
import { useAppStore } from '@/stores/appStore';
import { usePrayerStore } from '@/stores/prayerStore';
import { DETECTION_FPS, POSE_BUFFER_SIZE, POSE_MAJORITY_RATIO, POSE_STABLE_DURATION_MS } from '@/lib/constants';
import type { PoseType, Keypoint } from '@/types/pose';

export function usePoseDetection(videoRef: React.RefObject<HTMLVideoElement | null>, enabled: boolean) {
  const rafRef = useRef<number>(0);
  const poseBuffer = useRef<PoseType[]>([]);
  const stableStartRef = useRef<number>(0);
  const lastPoseRef = useRef<PoseType>('unknown');
  const { setPoseModelStatus } = useAppStore();
  const { setCurrentPose, setIsSendekap } = usePrayerStore();

  const init = useCallback(async () => {
    try {
      setPoseModelStatus('loading');
      await loadPoseModel();
      setPoseModelStatus('ready');
    } catch {
      setPoseModelStatus('error');
    }
  }, [setPoseModelStatus]);

  useEffect(() => {
    if (!enabled) return;
    init();
    return () => {
      disposePoseModel();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, init]);

  useEffect(() => {
    if (!enabled) return;
    const interval = 1000 / DETECTION_FPS;
    let lastTime = 0;

    const loop = async (time: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (time - lastTime < interval) return;
      lastTime = time;

      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        const rawKeypoints = await detectPose(video);
        if (rawKeypoints.length === 0) return;

        // Normalize keypoints to 0-1
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        const keypoints: Keypoint[] = rawKeypoints.map((k) => ({
          x: k.x / w,
          y: k.y / h,
          score: k.score ?? 0,
          name: k.name ?? '',
        }));

        const pose = classifyPose(keypoints);
        const sendekap = pose === 'qiyam' && detectSendekap(keypoints);

        // Pose stabilization
        poseBuffer.current.push(pose);
        if (poseBuffer.current.length > POSE_BUFFER_SIZE) {
          poseBuffer.current.shift();
        }

        const counts = new Map<PoseType, number>();
        for (const p of poseBuffer.current) {
          counts.set(p, (counts.get(p) ?? 0) + 1);
        }
        let majorPose: PoseType = 'unknown';
        let majorCount = 0;
        for (const [p, c] of counts) {
          if (c > majorCount) {
            majorPose = p;
            majorCount = c;
          }
        }

        const ratio = majorCount / poseBuffer.current.length;
        if (ratio >= POSE_MAJORITY_RATIO) {
          if (majorPose !== lastPoseRef.current) {
            stableStartRef.current = time;
            lastPoseRef.current = majorPose;
          }
          if (time - stableStartRef.current >= POSE_STABLE_DURATION_MS) {
            setCurrentPose(majorPose);
            setIsSendekap(sendekap);
          }
        }
      } catch {
        // skip frame
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, videoRef, setCurrentPose, setIsSendekap]);
}
