/**
 * VISION — Intelligence API Hook
 * Fetches real adaptive learning data from the Django backend:
 * - Recommendations (adaptive, rule-based)
 * - Interventions (risk-triggered)
 * - Prediction scores (ML/heuristic)
 * - Cognitive profile
 * - Analytics snapshot
 */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface VisionRecommendation {
  id: string;
  recommendation_type: string;
  title: string;
  description: string;
  priority: number;
  difficulty_adjustment: number;
  triggered_by: string;
  target_concept_name: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export interface VisionIntervention {
  id: string;
  intervention_type: string;
  title: string;
  message: string;
  trigger_source: string;
  trigger_score: number;
  status: string;
  target_concept_name: string;
  expires_at: string;
  created_at: string;
}

export interface VisionPrediction {
  id: string;
  failure_probability: number;
  dropout_risk: number;
  disengagement_risk: number;
  pacing_mismatch_score: number;
  retention_decline_risk: number;
  confidence: number;
  predicted_at: string;
}

export interface VisionCognitiveProfile {
  logical_reasoning_strength: number;
  pacing_requirement: number;
  retention_capability: number;
  abstraction_handling: number;
  learning_consistency: number;
  engagement_stability: number;
  struggle_tendency: number;
  recovery_speed: number;
  confidence_score: number;
  overall_score: number;
  last_recalculated_at: string | null;
}

export interface VisionIntelligenceData {
  recommendations: VisionRecommendation[];
  interventions: VisionIntervention[];
  prediction: VisionPrediction | null;
  cognitiveProfile: VisionCognitiveProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVisionIntelligence(): VisionIntelligenceData {
  const [recommendations, setRecommendations] = useState<VisionRecommendation[]>([]);
  const [interventions, setInterventions] = useState<VisionIntervention[]>([]);
  const [prediction, setPrediction] = useState<VisionPrediction | null>(null);
  const [cognitiveProfile, setCognitiveProfile] = useState<VisionCognitiveProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = () => setFetchTrigger(t => t + 1);

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all intelligence data in parallel
        const [recRes, ivRes, predRes, profileRes] = await Promise.allSettled([
          api.get("/recommendations/").catch(() => null),
          api.get("/interventions/me/").catch(() => null),
          api.get("/predictions/me/").catch(() => null),
          api.get("/profiles/me/").catch(() => null),
        ]);

        if (!isMounted) return;

        // Recommendations
        if (recRes.status === "fulfilled" && recRes.value) {
          const data = recRes.value.data;
          const recs = data.results || data.data || data || [];
          setRecommendations(Array.isArray(recs) ? recs : []);
        }

        // Interventions
        if (ivRes.status === "fulfilled" && ivRes.value) {
          const data = ivRes.value.data;
          const ivs = data.results || data.data || data || [];
          setInterventions(Array.isArray(ivs) ? ivs.filter((iv: VisionIntervention) => iv.status === "pending" || iv.status === "delivered") : []);
        }

        // Latest Prediction
        if (predRes.status === "fulfilled" && predRes.value) {
          const data = predRes.value.data;
          const preds = data.results || data.data || data || [];
          if (Array.isArray(preds) && preds.length > 0) {
            setPrediction(preds[0]); // Most recent prediction
          } else if (preds && !Array.isArray(preds)) {
            setPrediction(preds);
          }
        }

        // Cognitive Profile
        if (profileRes.status === "fulfilled" && profileRes.value) {
          const data = profileRes.value.data;
          setCognitiveProfile(data.data || data);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to fetch intelligence data");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [fetchTrigger]);

  return {
    recommendations,
    interventions,
    prediction,
    cognitiveProfile,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Track a behavioral event to the Vision backend.
 * Non-blocking — errors are silently swallowed so UI never breaks.
 */
export async function trackEvent(params: {
  event_type: string;
  course_id?: string;
  lesson_id?: string;
  concept_id?: string;
  concept_name?: string;
  session_id?: string;
  score?: number;
  watch_time_seconds?: number;
  response_time_seconds?: number;
  attempt_number?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    await api.post("/tracking/events/", params);
  } catch {
    // Tracking errors never break the UI
  }
}
