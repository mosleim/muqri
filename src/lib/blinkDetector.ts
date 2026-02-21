import type { EARData } from '@/types/detection';
import { LEFT_EYE, RIGHT_EYE, EAR_CLOSED_RATIO } from './constants';

interface FaceLandmark {
  x: number;
  y: number;
  z?: number;
}

function computeEAR(landmarks: FaceLandmark[], eye: typeof LEFT_EYE): number {
  const upper = landmarks[eye.upper];
  const lower = landmarks[eye.lower];
  const inner = landmarks[eye.inner];
  const outer = landmarks[eye.outer];
  if (!upper || !lower || !inner || !outer) return 1;

  const vertDist = Math.abs(upper.y - lower.y);
  const horizDist = Math.abs(inner.x - outer.x);
  if (horizDist === 0) return 1;
  return vertDist / horizDist;
}

export function computeEARData(
  landmarks: FaceLandmark[],
  earBaseline: number
): EARData {
  const left = computeEAR(landmarks, LEFT_EYE);
  const right = computeEAR(landmarks, RIGHT_EYE);
  const average = (left + right) / 2;
  const threshold = earBaseline * EAR_CLOSED_RATIO;
  const isClosed = left < threshold && right < threshold;
  return { left, right, average, isClosed };
}

export function computeBaselineEAR(landmarks: FaceLandmark[]): number {
  const left = computeEAR(landmarks, LEFT_EYE);
  const right = computeEAR(landmarks, RIGHT_EYE);
  return (left + right) / 2;
}
