"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Brain, CheckCircle2, ShieldAlert, Clock, Zap } from "lucide-react";

interface RoadmapStep {
  title: string;
  desc: string;
  status: "completed" | "current" | "pending";
  time: string;
  action: string;
}

export default function RemedialRoadmap() {
  const STEPS: RoadmapStep[] = [
    { 
      title: "REQUIRED: Foundation Re-Sync", 
      desc: "CRITICAL: You missed core concepts in 'Vector Fields'. You must watch Module 4 (04:12) and pass the 5-question micro-quiz before proceeding.", 
      status: "completed",
      time: "15 min",
      action: "COMPLETED"
    },
    { 
      title: "ACTION REQUIRED: Conceptual Bridge", 
      desc: "The AI detected a gap in your '3D Spatial Logic'. Perform the interactive 'Coordinate Mapping' exercise now to stabilize your mental model.", 
      status: "current",
      time: "25 min",
      action: "START EXERCISE"
    },
    { 
      title: "PENDING: Applied Validation", 
      desc: "Apply your new understanding to 3 real-world physics problems. Accuracy must be >85% to restore your accelerated path.", 
      status: "pending",
      time: "20 min",
      action: "LOCKED"
    },
    { 
      title: "PENDING: Full Curriculum Restore", 
      desc: "Final validation sync with the Neural Engine to return to your personalized learning stream.", 
      status: "pending",
      time: "10 min",
      action: "LOCKED"
    },
  ];

  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-10 mb-12 relative overflow-hidden">
      {/* Background Warning Aura */}
      <div className="absolute -left-20 -top-20 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full" />
      <div className="absolute -right-20 bottom-0 w-48 h-48 bg-primary/5 blur-[80px] rounded-full" />
      
      <div className="flex flex-col xl:flex-row gap-12 items-start relative z-10">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-2xl shadow-red-500/30 border border-red-400">
              <ShieldAlert size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">Action Required</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Case ID: VND-2026-X</span>
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Neural Correction Path</h2>
            </div>
          </div>

          <p className="text-muted-foreground mb-12 max-w-2xl leading-relaxed">
            Your current learning trajectory has diverged from the optimal mastery path. The AI has **paused your main curriculum** and generated this 4-step recovery plan to ensure you don't fail the upcoming assessment.
          </p>

          <div className="relative space-y-0 pl-12 border-l-2 border-dashed border-border/50 ml-8 py-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative mb-12 last:mb-0"
              >
                {/* Connector Node */}
                <div className={`absolute -left-[62px] top-0 w-12 h-12 rounded-full border-4 border-background flex items-center justify-center z-10 shadow-lg ${
                  step.status === 'completed' ? "bg-green-500 text-white" :
                  step.status === 'current' ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step.status === 'completed' ? <CheckCircle2 size={20} /> : <div className="text-xs font-black">{i+1}</div>}
                </div>

                <div className={`p-8 rounded-[2rem] border transition-all duration-500 ${
                  step.status === 'current' 
                    ? "bg-card border-red-500/40 shadow-2xl shadow-red-500/10 -translate-y-1 scale-[1.01]" 
                    : "bg-transparent border-border/20 opacity-60"
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className={`text-xl font-black tracking-tight ${step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {step.title}
                        </h4>
                        {step.status === 'current' && <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">CURRENT TASK</span>}
                      </div>
                      <p className="text-[15px] text-muted-foreground leading-relaxed max-w-2xl">{step.desc}</p>
                      
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                          <Clock size={12} /> {step.time}
                        </div>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                          <Zap size={12} /> High Priority
                        </div>
                      </div>
                    </div>
                    
                    {step.status === 'current' && (
                      <button className="bg-red-500 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-red-500/30 flex items-center justify-center gap-2 group whitespace-nowrap">
                        {step.action} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="w-full xl:w-[400px] space-y-6 lg:sticky lg:top-8">
          <div className="bg-card/60 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="font-bold text-sm mb-8 flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
              <AlertTriangle size={14} className="text-red-500" /> Cognitive Diagnosis
            </h3>
            <div className="space-y-8">
              {[
                { label: "Spatial Mastery", val: 22, color: "bg-red-500" },
                { label: "Logic Consistency", val: 38, color: "bg-amber-500" },
                { label: "Synaptic Retention", val: 15, color: "bg-red-500" }
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between text-[11px] font-black uppercase mb-3">
                    <span className="text-muted-foreground/80">{stat.label}</span>
                    <span className="text-foreground">{stat.val}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-border rounded-full overflow-hidden p-[1px]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.val}%` }}
                      className={`h-full rounded-full ${stat.color} shadow-[0_0_12px_rgba(239,68,68,0.2)]`} 
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 p-6 rounded-[1.5rem] bg-red-500/5 border border-red-500/10">
              <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">AI Recommendation</div>
              <p className="text-[12px] text-foreground/80 italic leading-relaxed">
                "We have detected that your brain is attempting to skip foundational derivations. This path will force a 15-minute concept deep-dive to fix your logic before you lose your streak."
              </p>
            </div>
          </div>
          
          <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-6 text-center">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Estimated Path Restoration</p>
            <div className="text-3xl font-black text-foreground">70 MIN</div>
          </div>
        </div>
      </div>
    </div>
  );
}
