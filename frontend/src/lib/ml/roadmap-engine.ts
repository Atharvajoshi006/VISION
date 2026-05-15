import { NeuralRecord } from "./neural-datasets";

/**
 * VISION Adaptive Risk & Roadmap Engine (VARRE)
 */

export interface RiskAnalysis {
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  probabilityOfFailure: number; // 0-1
  primaryCause: string;
  trend: "Improving" | "Declining" | "Stable";
}

export interface RoadmapStep {
  phase: string;
  objective: string;
  duration: string;
  actions: string[];
  priority: "High" | "Normal";
}

export class RoadmapEngine {
  /**
   * Predicts risk by analyzing the trend of the last 3 records.
   */
  static analyzeRisk(history: NeuralRecord[]): RiskAnalysis & { subject: string } {
    if (history.length < 2) {
      return { 
        riskLevel: "Low", 
        probabilityOfFailure: 0.1, 
        primaryCause: "Insufficient Data", 
        trend: "Stable",
        subject: "General" 
      };
    }

    const last = history[history.length - 1];
    const prev = history[history.length - 2];

    const markTrend = last.marks - prev.marks;
    const timeTrend = last.timeSpent - prev.timeSpent;
    
    let prob = 0.2;
    let trend: "Improving" | "Declining" | "Stable" = "Stable";

    if (markTrend < -10) {
      prob += 0.3;
      trend = "Declining";
    }
    if (timeTrend > 15 && markTrend < 0) {
      prob += 0.2;
    }
    if (last.marks < 50) {
      prob += 0.2;
    }

    let riskLevel: RiskAnalysis["riskLevel"] = "Low";
    if (prob > 0.8) riskLevel = "Critical";
    else if (prob > 0.6) riskLevel = "High";
    else if (prob > 0.4) riskLevel = "Moderate";

    const primaryCause = last.marks < 50 ? "Foundational Gap" : timeTrend > 15 ? "Cognitive Overload" : "Inconsistency";

    return { riskLevel, probabilityOfFailure: prob, primaryCause, trend, subject: last.topic };
  }

  /**
   * Generates a truly dynamic recovery roadmap based on cause and subject.
   */
  static generateRecoveryRoadmap(risk: RiskAnalysis & { subject: string }): RoadmapStep[] {
    const { riskLevel, primaryCause, subject } = risk;

    if (riskLevel === "Low" || riskLevel === "Moderate") {
      return [
        { 
          phase: "Optimization: Path Mastery", 
          objective: `Accelerate ${subject} Proficiency`, 
          duration: "3 Days", 
          actions: [
            `Deep dive into advanced ${subject} edge cases`, 
            "Execute 10-minute high-velocity assessment",
            "Synthesize peer-review feedback"
          ], 
          priority: "Normal" 
        }
      ];
    }

    // High or Critical Risk Roadmap
    const recoverySteps: RoadmapStep[] = [];

    // Phase 1: Contextual Stabilization
    if (primaryCause === "Foundational Gap") {
      recoverySteps.push({
        phase: "Phase 1: Knowledge Re-Sync",
        objective: `Identify ${subject} Prerequisite Gaps`,
        duration: "2 Days",
        actions: [`Re-watch ${subject} Module 1-2`, `Complete "First Principles" quiz`, "Map core conceptual links"],
        priority: "High"
      });
    } else if (primaryCause === "Cognitive Overload") {
      recoverySteps.push({
        phase: "Phase 1: Cognitive Decompression",
        objective: "Reduce Mental Entropy",
        duration: "24 Hours",
        actions: ["20-minute forced meditation sync", "Stop all new information intake", "Sleep cycle optimization"],
        priority: "High"
      });
    } else {
      recoverySteps.push({
        phase: "Phase 1: Consistency Protocol",
        objective: "Establish Neural Habit",
        duration: "3 Days",
        actions: ["30-minute daily sync (Strict)", "Clear study environment", "Focus session logging"],
        priority: "High"
      });
    }

    // Phase 2: Active Correction
    recoverySteps.push({
      phase: "Phase 2: Corrective Inference",
      objective: `Bridge the ${subject} Divergence`,
      duration: "4 Days",
      actions: [
        `Solve 5 moderate ${subject} problems`, 
        "Use AI visual mapping for 3D logic", 
        "Verify accuracy > 85%"
      ],
      priority: "High"
    });

    // Phase 3: Mesh Re-Alignment
    recoverySteps.push({
      phase: "Phase 3: Path Restoration",
      objective: `Return to ${subject} Curriculum`,
      duration: "1 Week",
      actions: ["Full-mesh assessment", "Identify next acceleration point", "Resume standard flow"],
      priority: "Normal"
    });

    return recoverySteps;
  }
}
