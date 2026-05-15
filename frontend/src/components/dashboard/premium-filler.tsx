"use client";

import { motion } from "framer-motion";
import { Brain, Globe, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function NeuralActivityGraph() {
  const [points, setPoints] = useState<number[]>(Array(20).fill(20));

  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => {
        const next = [...prev.slice(1), 10 + Math.random() * 30];
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/30 backdrop-blur-xl border border-border rounded-3xl p-6 h-full flex flex-col justify-between group overflow-hidden relative">
      {/* Decorative glow */}
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-colors" />
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Neural Load</h3>
          </div>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">LIVE</span>
        </div>
        <div className="text-2xl font-black mb-1">Accelerated</div>
        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Current Synaptic Efficiency: 94.2%</div>
      </div>

      <div className="h-20 flex items-end gap-1 mt-6">
        {points.map((p, i) => (
          <motion.div
            key={i}
            animate={{ height: `${p}%` }}
            className="flex-1 bg-gradient-to-t from-primary/40 to-primary/80 rounded-t-[2px] transition-all"
          />
        ))}
      </div>
    </div>
  );
}

export function GlobalLiveFeed() {
  const ACTIVITIES = [
    "Student #4128 just mastered 'Quantum Logic'",
    "New Neural Module: 'Bio-Computing' uploaded by Prof. Sarah",
    "Cognitive Peak detected in Physics Cohort A",
    "Student #8829 reached 100-day Neural Streak",
    "AI Calibration: System efficiency increased by 4%"
  ];

  return (
    <div className="bg-primary/10 border-y border-primary/20 py-2 overflow-hidden whitespace-nowrap relative">
      <motion.div
        animate={{ x: ["100%", "-100%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex gap-20 items-center"
      >
        {ACTIVITIES.map((act, i) => (
          <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary/80">
            <Globe size={12} /> {act}
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {ACTIVITIES.map((act, i) => (
          <div key={i+"-dup"} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary/80">
            <Globe size={12} /> {act}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function AIQuickStats() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-card/40 border border-border rounded-2xl p-4 hover:border-primary/30 transition-all cursor-pointer">
        <Users size={18} className="text-blue-400 mb-2" />
        <div className="text-lg font-black tracking-tight">1,240</div>
        <div className="text-[9px] text-muted-foreground uppercase font-bold">Neural Cohorts</div>
      </div>
      <div className="bg-card/40 border border-border rounded-2xl p-4 hover:border-primary/30 transition-all cursor-pointer">
        <Brain size={18} className="text-purple-400 mb-2" />
        <div className="text-lg font-black tracking-tight">4.2 PB</div>
        <div className="text-[9px] text-muted-foreground uppercase font-bold">Knowledge Base</div>
      </div>
    </div>
  );
}
