import { useEffect, useState } from "react";
import { RoadmapEngine, RiskAnalysis, RoadmapStep } from "./roadmap-engine";
import { STUDENT_DATASETS } from "./neural-datasets";
import { useUserStore } from "@/store/use-user-store";

/**
 * VISION Auto-Predict Hook
 * 
 * Automatically runs ML inference when performance data changes,
 * removing the need for manual analysis triggers.
 */
export function useAutoPredict() {
  const { performanceHistory, setCognitiveLevel } = useUserStore();
  const [analysis, setAnalysis] = useState<{ risk: RiskAnalysis, roadmap: RoadmapStep[], subject: string } | null>(null);

  useEffect(() => {
    const runInference = () => {
      console.log("[VARRE] Running autonomous risk inference...");
      const currentSubject = performanceHistory[0]?.subject || "General Neural Stream";
      
      // Prioritize real performance history, fallback to Neural Datasets for demo
      const dataToAnalyze = performanceHistory.length > 2 
        ? performanceHistory.map(p => ({ ...p, timeSpent: 30, accuracy: p.marks / 100, topic: p.subject || "General", date: p.date })) 
        : STUDENT_DATASETS.DIVERGENT_PATH;

      const risk = RoadmapEngine.analyzeRisk(dataToAnalyze as any);
      const roadmap = RoadmapEngine.generateRecoveryRoadmap(risk);
      
      console.log(`[VARRE] Inference complete. Risk Level: ${risk.riskLevel}`);
      setAnalysis({ risk, roadmap, subject: currentSubject });

      // Automatically adjust cognitive load if risk is detected
      if (risk.riskLevel === "Critical" || risk.riskLevel === "High") {
        setCognitiveLevel(Math.max(1, Math.round(performanceHistory[0]?.marks / 20 || 1)));
      }
    };

    runInference();
  }, [performanceHistory, setCognitiveLevel]);

  return analysis;
}
