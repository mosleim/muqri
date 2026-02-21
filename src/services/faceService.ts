import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;

export async function loadFaceModel(): Promise<void> {
  if (detector) return;
  detector = await faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
    {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619',
      refineLandmarks: true,
      maxFaces: 1,
    } as faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig
  );
}

export interface FaceLandmark {
  x: number;
  y: number;
  z?: number;
}

export async function detectFace(
  video: HTMLVideoElement
): Promise<FaceLandmark[]> {
  if (!detector) throw new Error('Face model not loaded');
  const faces = await detector.estimateFaces(video);
  if (faces.length === 0) return [];
  return faces[0].keypoints as FaceLandmark[];
}

export function disposeFaceModel(): void {
  if (detector) {
    detector.dispose();
    detector = null;
  }
}
