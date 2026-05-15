/**
 * VISION Neural Datasets (VND)
 * 
 * NOTE: These are synthetic datasets used for model calibration 
 * and demonstration. In production, these would be replaced by 
 * real-time user performance streams.
 */

export const STUDENT_DATASETS = {
  // Case 1: High Performing Student (Mastery Sync)
  OPTIMAL_PATH: [
    { marks: 85, timeSpent: 40, accuracy: 0.9, topic: "Physics", date: "2026-05-01" },
    { marks: 92, timeSpent: 35, accuracy: 0.95, topic: "Physics", date: "2026-05-03" },
    { marks: 88, timeSpent: 30, accuracy: 0.92, topic: "Math", date: "2026-05-05" },
    { marks: 95, timeSpent: 25, accuracy: 0.98, topic: "CS", date: "2026-05-07" },
  ],

  // Case 2: At-Risk Student (Failure Prediction Target)
  DIVERGENT_PATH: [
    { marks: 75, timeSpent: 50, accuracy: 0.75, topic: "Physics", date: "2026-05-01" },
    { marks: 62, timeSpent: 65, accuracy: 0.60, topic: "Physics", date: "2026-05-03" },
    { marks: 45, timeSpent: 80, accuracy: 0.45, topic: "Math", date: "2026-05-05" },
    { marks: 38, timeSpent: 95, accuracy: 0.35, topic: "CS", date: "2026-05-07" },
  ],

  // Case 3: Fluctuating Performance (Calibrating)
  STOCHASTIC_PATH: [
    { marks: 40, timeSpent: 40, accuracy: 0.4, topic: "Math", date: "2026-05-01" },
    { marks: 85, timeSpent: 60, accuracy: 0.85, topic: "Math", date: "2026-05-03" },
    { marks: 55, timeSpent: 50, accuracy: 0.55, topic: "Math", date: "2026-05-05" },
    { marks: 70, timeSpent: 45, accuracy: 0.70, topic: "Math", date: "2026-05-07" },
  ]
};

export type NeuralRecord = typeof STUDENT_DATASETS.OPTIMAL_PATH[0];
