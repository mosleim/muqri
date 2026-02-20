import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs';

let detector: poseDetection.PoseDetector | null = null;

export async function loadPoseModel(): Promise<void> {
  if (detector) return;
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
    }
  );
}

export async function detectPose(
  video: HTMLVideoElement
): Promise<poseDetection.Keypoint[]> {
  if (!detector) throw new Error('Pose model not loaded');
  const poses = await detector.estimatePoses(video);
  if (poses.length === 0) return [];
  return poses[0].keypoints;
}

export function disposePoseModel(): void {
  if (detector) {
    detector.dispose();
    detector = null;
  }
}
