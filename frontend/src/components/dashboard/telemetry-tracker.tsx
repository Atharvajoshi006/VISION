"use client";

import { useEffect, useRef } from "react";
import { useUserStore } from "@/store/use-user-store";
import { supabase } from "@/lib/supabase";

/**
 * VISION Neural Telemetry Tracker (VNTT)
 * 
 * Automatically tracks user interactions (clicks, movement, focus)
 * and synchronizes with the database for behavioral analysis.
 */
export default function TelemetryTracker() {
  const { profile } = useUserStore();
  const lastSync = useRef<number>(Date.now());
  const logQueue = useRef<any[]>([]);

  useEffect(() => {
    const syncTelemetry = async (entries?: any[]) => {
      const batch = entries || [...logQueue.current];
      if (batch.length === 0) return;
      if (!entries) logQueue.current = [];
      
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || "anonymous-telemetry";

      try {
        await supabase
          .from('telemetry_logs')
          .insert(batch.map(log => ({ 
            ...log, 
            user_id: userId,
            timestamp: new Date().toISOString()
          })));
      } catch (err) {
        console.warn("[VNTT] Sync delayed.");
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const logEntry = {
        interaction_type: "CLICK",
        pos_x: e.clientX,
        pos_y: e.clientY,
        element_tag: target.tagName,
        element_id: target.id || "none",
        interaction_text: target.innerText?.slice(0, 50) || ""
      };
      syncTelemetry([logEntry]);
    };

    const handleNavigation = () => {
      syncTelemetry([{
        interaction_type: "NAVIGATION",
        interaction_text: `Navigated to ${window.location.pathname}`
      }]);
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.ctrlKey) {
        syncTelemetry([{
          interaction_type: "KEYBOARD",
          interaction_text: `Pressed ${e.key}`
        }]);
      }
    };

    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("keydown", handleKeydown);
    
    // Initial page load telemetry
    handleNavigation();

    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [profile.email]);

  return null; // Silent observer
}
