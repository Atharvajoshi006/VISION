/**
 * VISION Cognitive Adaptive Engine (VCAE)
 * 
 * This engine handles the core "Adaptive Learning" logic.
 * It takes performance inputs (marks, speed, consistency) and 
 * predicts the optimal "Cognitive Load" for the next session.
 */

export interface PerformanceInput {
  marks: number;       // 0-100
  timeSpent: number;   // minutes
  totalQuestions: number;
  correctAnswers: number;
  lastLevel: number;   // 1-10 (Beginner to Expert)
}

export interface AdaptiveOutput {
  nextLevel: number;
  cognitiveLoad: number; // 0.1 to 1.0
  recommendation: string;
  focusAreas: string[];
}

export class AdaptiveEngine {
  /**
   * Simple but professional heuristic simulating a Linear Regression model 
   * for adaptive difficulty adjustment.
   */
  static predictNextStep(input: PerformanceInput): AdaptiveOutput {
    const { marks, timeSpent, totalQuestions, correctAnswers, lastLevel } = input;
    
    // Calculate Accuracy Factor
    const accuracy = correctAnswers / totalQuestions;
    
    // Calculate Speed Factor (simulating "Efficiency")
    // Target: 2 mins per question
    const expectedTime = totalQuestions * 2;
    const speedFactor = Math.min(1.2, expectedTime / timeSpent);

    // Composite Performance Score (0-1)
    const performanceScore = (marks / 100 * 0.4) + (accuracy * 0.4) + (speedFactor * 0.2);

    let nextLevel = lastLevel;
    let cognitiveLoad = 0.5;
    let recommendation = "";
    let focusAreas: string[] = [];

    // Adaptive Logic
    if (performanceScore > 0.85) {
      nextLevel = Math.min(10, lastLevel + 1);
      cognitiveLoad = 0.85;
      recommendation = "Exceptional mastery. Advancing to accelerated concepts.";
      focusAreas = ["Deep Research", "Complex Synthesis", "Peer Mentorship"];
    } else if (performanceScore > 0.65) {
      nextLevel = lastLevel;
      cognitiveLoad = 0.65;
      recommendation = "Steady progress. Increasing depth of current modules.";
      focusAreas = ["Applied Problems", "Edge Case Analysis"];
    } else if (performanceScore > 0.4) {
      nextLevel = lastLevel;
      cognitiveLoad = 0.45;
      recommendation = "Foundational gaps detected. Strengthening core principles.";
      focusAreas = ["Conceptual Review", "Guided Practice"];
    } else {
      nextLevel = Math.max(1, lastLevel - 1);
      cognitiveLoad = 0.3;
      recommendation = "Mesh misalignment. Re-calibrating to fundamental level.";
      focusAreas = ["Basic Definitions", "Step-by-Step Visualization"];
    }

    return {
      nextLevel,
      cognitiveLoad,
      recommendation,
      focusAreas
    };
  }
}
