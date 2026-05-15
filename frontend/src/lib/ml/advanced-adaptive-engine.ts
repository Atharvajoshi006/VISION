/**
 * VISION Advanced Adaptive Engine (VAAE)
 * 
 * Implements a simplified Bayesian Knowledge Tracing (BKT) 
 * and Elo-rating system to track mastery over time.
 */

export interface MasteryState {
  topic: string;
  probabilityOfMastery: number; // 0-1
  streak: number;
  level: number;
}

export interface LearningSession {
  topic: string;
  correct: boolean;
  timeTaken: number; // seconds
}

export class AdvancedAdaptiveEngine {
  // BKT Parameters (Simulated)
  private static P_TRANSITION = 0.1; // Probability of learning
  private static P_GUESS = 0.2;      // Probability of guessing right
  private static P_SLIP = 0.1;       // Probability of slipping up

  /**
   * Updates the mastery probability based on a new session result.
   * This is the "Learning" part of the model.
   */
  static updateMastery(currentMastery: number, result: boolean): number {
    const pKnown = currentMastery;
    let pObservedGivenKnown;
    let pObservedGivenNotKnown;

    if (result) {
      pObservedGivenKnown = 1 - this.P_SLIP;
      pObservedGivenNotKnown = this.P_GUESS;
    } else {
      pObservedGivenKnown = this.P_SLIP;
      pObservedGivenNotKnown = 1 - this.P_GUESS;
    }

    // Bayesian Update: P(Known | Observation)
    const posterior = (pObservedGivenKnown * pKnown) / 
                     (pObservedGivenKnown * pKnown + pObservedGivenNotKnown * (1 - pKnown));

    // Transition: Account for learning that happened during the session
    const nextMastery = posterior + (1 - posterior) * this.P_TRANSITION;
    
    return Math.min(0.99, Math.max(0.01, nextMastery));
  }

  /**
   * Predicts the difficulty of the next recommended content.
   */
  static predictOptimalDifficulty(mastery: number): "Beginner" | "Intermediate" | "Advanced" | "Expert" {
    if (mastery < 0.3) return "Beginner";
    if (mastery < 0.6) return "Intermediate";
    if (mastery < 0.85) return "Advanced";
    return "Expert";
  }

  /**
   * Generates a "Adaptive Trajectory" for the user.
   */
  static generateTrajectory(history: number[]): number[] {
    // Simple 3-point moving average to predict the next trend
    if (history.length < 3) return history;
    const lastThree = history.slice(-3);
    const avg = lastThree.reduce((a, b) => a + b) / 3;
    const trend = lastThree[2] - lastThree[0];
    
    const prediction = Math.min(1, Math.max(0, avg + trend * 0.5));
    return [...history, prediction];
  }
}
