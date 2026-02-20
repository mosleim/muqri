import type { Keypoint } from '@/types/pose';
import {
  SENDEKAP_WRIST_DISTANCE_MAX,
  SENDEKAP_CENTER_MIN,
  SENDEKAP_CENTER_MAX,
  SENDEKAP_WRIST_CONFIDENCE,
} from './constants';

function getKeypoint(keypoints: Keypoint[], name: string): Keypoint | undefined {
  return keypoints.find((k) => k.name === name);
}

export function detectSendekap(keypoints: Keypoint[]): boolean {
  const lWrist = getKeypoint(keypoints, 'left_wrist');
  const rWrist = getKeypoint(keypoints, 'right_wrist');
  const lShoulder = getKeypoint(keypoints, 'left_shoulder');
  const rShoulder = getKeypoint(keypoints, 'right_shoulder');
  const lHip = getKeypoint(keypoints, 'left_hip');
  const rHip = getKeypoint(keypoints, 'right_hip');

  if (!lWrist || !rWrist || !lShoulder || !rShoulder || !lHip || !rHip) return false;
  if (lWrist.score < SENDEKAP_WRIST_CONFIDENCE || rWrist.score < SENDEKAP_WRIST_CONFIDENCE) return false;

  // 1. Jarak horizontal wrist berdekatan
  const wristDistX = Math.abs(lWrist.x - rWrist.x);
  if (wristDistX > SENDEKAP_WRIST_DISTANCE_MAX) return false;

  // 2. Posisi Y rata-rata wrist antara shoulder dan hip
  const avgWristY = (lWrist.y + rWrist.y) / 2;
  const shoulderY = (lShoulder.y + rShoulder.y) / 2;
  const hipY = (lHip.y + rHip.y) / 2;
  if (avgWristY < shoulderY || avgWristY > hipY) return false;

  // 3. Wrist di area tengah horizontal
  const avgWristX = (lWrist.x + rWrist.x) / 2;
  if (avgWristX < SENDEKAP_CENTER_MIN || avgWristX > SENDEKAP_CENTER_MAX) return false;

  return true;
}
