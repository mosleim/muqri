import { create } from 'zustand';
import type { DetectionStatus } from '@/types/detection';

interface AppState {
  poseModelStatus: DetectionStatus;
  faceModelStatus: DetectionStatus;
  cameraReady: boolean;
  earBaseline: number;
  calibrated: boolean;

  setPoseModelStatus: (s: DetectionStatus) => void;
  setFaceModelStatus: (s: DetectionStatus) => void;
  setCameraReady: (v: boolean) => void;
  setEarBaseline: (v: number) => void;
  setCalibrated: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  poseModelStatus: 'idle',
  faceModelStatus: 'idle',
  cameraReady: false,
  earBaseline: 0,
  calibrated: false,

  setPoseModelStatus: (s) => set({ poseModelStatus: s }),
  setFaceModelStatus: (s) => set({ faceModelStatus: s }),
  setCameraReady: (v) => set({ cameraReady: v }),
  setEarBaseline: (v) => set({ earBaseline: v }),
  setCalibrated: (v) => set({ calibrated: v, ...(v ? {} : { earBaseline: 0 }) }),
}));
