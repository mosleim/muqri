export type PoseType = 'qiyam' | 'ruku' | 'sujud' | 'duduk' | 'unknown';

export interface Keypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

export interface PoseResult {
  pose: PoseType;
  confidence: number;
  keypoints: Keypoint[];
  sendekap: boolean;
}
