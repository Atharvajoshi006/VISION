"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity, Brain, MousePointer2, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function NeuralPulse() {
  const [logs, setLogs] = useState<any[]>([]);
  const [interactiveness, setInteractiveness] = useState(0);

  useEffect(() => {
    const fetchRecentTelemetry = async () => {
      const { data } = await supabase
        .from('telemetry_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);
      
      if (data) setLogs(data);
      
      // Calculate interactiveness score (0-100)
      const { count } = await supabase
        .from('telemetry_logs')
        .select('*', { count: 'exact', head: true })
        .filter('timestamp', 'gt', new Date(Date.now() - 5 * 60 * 1000).toISOString());
      
      const score = Math.min(100, (count || 0) * 10);
      setInteractiveness(score);
    };

    fetchRecentTelemetry();
    const interval = setInterval(fetchRecentTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all duration-700" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary relative">
            <Brain size={20} className="relative z-10" />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-primary/30 rounded-xl"
            />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">Neural Analysis</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Live Syncing</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-primary">{interactiveness}%</div>
          <div className="text-[9px] text-muted-foreground uppercase font-bold">Interactiveness</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">
          <span>Recent Stream</span>
          <MousePointer2 size={10} />
        </div>
        
        <AnimatePresence mode="popLayout">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${log.interaction_type === 'click' ? 'bg-primary' : 'bg-blue-400'}`} />
                <span className="text-[11px] font-medium text-foreground/80 truncate max-w-[120px]">
                  {log.interaction_text || log.element_tag}
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground tabular-nums">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-5 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">AI Confidence</span>
          <span className="text-[10px] font-black text-primary">98.2%</span>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '98.2%' }}
            className="h-full bg-primary"
          />
        </div>
      </div>
    </div>
  );
}
