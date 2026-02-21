import type { Keypoint, PoseType } from '@/types/pose';
import {
  POSE_CONFIDENCE_MIN,
  QIYAM_SHOULDER_HIP_MIN_DIST,
  RUKU_SHOULDER_HIP_MAX_DIFF,
} from './constants';

function getKeypoint(keypoints: Keypoint[], name: string): Keypoint | undefined {
  return keypoints.find((k) => k.name === name);
}

export function classifyPose(keypoints: Keypoint[]): PoseType {
  const nose = getKeypoint(keypoints, 'nose');
  const lShoulder = getKeypoint(keypoints, 'left_shoulder');
  const rShoulder = getKeypoint(keypoints, 'right_shoulder');
  const lHip = getKeypoint(keypoints, 'left_hip');
  const rHip = getKeypoint(keypoints, 'right_hip');
  const lKnee = getKeypoint(keypoints, 'left_knee');
  const rKnee = getKeypoint(keypoints, 'right_knee');

  if (!nose || !lShoulder || !rShoulder || !lHip || !rHip) return 'unknown';

  const required = [nose, lShoulder, rShoulder, lHip, rHip];
  if (required.some((k) => k.score < POSE_CONFIDENCE_MIN)) return 'unknown';

  const shoulderY = (lShoulder.y + rShoulder.y) / 2;
  const hipY = (lHip.y + rHip.y) / 2;
  const shoulderHipDist = hipY - shoulderY;

  // Sujud: hidung dekat/di bawah pinggul
  if (nose.y >= hipY * 0.85) {
    return 'sujud';
  }

  // Ruku: bahu dan pinggul hampir sejajar horizontal
  if (Math.abs(shoulderHipDist) < RUKU_SHOULDER_HIP_MAX_DIFF && nose.y > shoulderY) {
    return 'ruku';
  }

  // Duduk: pinggul rendah mendekati lutut
  if (lKnee && rKnee && lKnee.score >= POSE_CONFIDENCE_MIN && rKnee.score >= POSE_CONFIDENCE_MIN) {
    const kneeY = (lKnee.y + rKnee.y) / 2;
    if (hipY > kneeY * 0.70 && nose.y < hipY && shoulderY < hipY) {
      return 'duduk';
    }
  }

  // Qiyam: berdiri tegak
  if (shoulderHipDist > QIYAM_SHOULDER_HIP_MIN_DIST && shoulderY < hipY) {
    return 'qiyam';
  }

  return 'unknown';
}
