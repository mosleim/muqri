export interface BlinkEvent {
  timestamp: number;
  duration: number;
}

export interface EARData {
  left: number;
  right: number;
  average: number;
  isClosed: boolean;
}

export type DetectionStatus = 'idle' | 'loading' | 'ready' | 'error';
