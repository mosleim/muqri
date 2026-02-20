// === Pose Detection ===
export const POSE_CONFIDENCE_MIN = 0.3;
export const POSE_STABLE_DURATION_MS = 500;
export const POSE_BUFFER_SIZE = 10;
export const POSE_MAJORITY_RATIO = 0.7;
export const DETECTION_FPS = 15;

// === Sendekap Detection ===
export const SENDEKAP_WRIST_DISTANCE_MAX = 0.20;
export const SENDEKAP_WRIST_Y_MARGIN = 0.05;
export const SENDEKAP_CENTER_MIN = 0.25;
export const SENDEKAP_CENTER_MAX = 0.75;
export const SENDEKAP_WRIST_CONFIDENCE = 0.3;

// === Blink Detection ===
export const BLINK_MIN_DURATION_MS = 250;
export const BLINK_MAX_DURATION_MS = 1500;
export const BLINK_COOLDOWN_MS = 1000;
export const EAR_CLOSED_RATIO = 0.35;
export const EAR_CALIBRATION_DURATION_MS = 3000;

// === Pose Classification Thresholds (normalized 0-1) ===
export const QIYAM_SHOULDER_HIP_MIN_DIST = 0.20;
export const RUKU_SHOULDER_HIP_MAX_DIFF = 0.15;
export const SUJUD_NOSE_HIP_RATIO = 0.85;
export const DUDUK_HIP_KNEE_RATIO = 0.70;

// === UI ===
export const TOAST_DURATION_MS = 1500;
export const BLINK_FEEDBACK_DURATION_MS = 200;
export const BLANK_OVERLAY_TRANSITION_MS = 800;

// === Face Mesh Landmarks ===
export const LEFT_EYE = {
  upper: 159,
  lower: 145,
  inner: 133,
  outer: 33,
};

export const RIGHT_EYE = {
  upper: 386,
  lower: 374,
  inner: 362,
  outer: 263,
};
