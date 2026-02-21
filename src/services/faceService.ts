import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
// Side-effect import: prevent Vite from tree-shaking FaceMesh constructor
// (used internally by face-landmarks-detection with mediapipe runtime)
import '@mediapipe/face_mesh';

let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;

export async function loadFaceModel(): Promise<void> {
  if (detector) return;

  // Try mediapipe runtime first (fast WASM), fall back to tfjs (slower but universal)
  try {
    console.log('[FaceModel] Loading mediapipe runtime...');
    detector = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        refineLandmarks: true,
        maxFaces: 1,
      } as faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig
    );
    console.log('[FaceModel] mediapipe runtime loaded OK');
  } catch (e) {
    console.warn('[FaceModel] mediapipe failed, falling back to tfjs:', e);
    detector = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 1,
      } as faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig
    );
    console.log('[FaceModel] tfjs runtime loaded OK');
  }
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
