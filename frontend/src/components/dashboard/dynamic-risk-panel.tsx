"use client";

import { motion } from "framer-motion";
import { 
  ShieldAlert, Clock, Zap, CheckCircle2, 
  ArrowRight, AlertTriangle 
} from "lucide-react";
import { useAutoPredict } from "@/lib/ml/use-auto-predict";
import { useToast } from "@/components/ui/toast";

export default function DynamicRiskPanel() {
  const analysis = useAutoPredict();
  const { addToast } = useToast();

  if (!analysis) return (
    <div className="p-12 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">
      Initializing Neural Inference...
    </div>
  );

  const { risk, roadmap } = analysis;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Critical": return "border-red-500/30 bg-red-500/5 shadow-red-500/20";
      case "High": return "border-orange-500/30 bg-orange-500/5 shadow-orange-500/20";
      default: return "border-emerald-500/30 bg-emerald-500/5 shadow-emerald-500/10";
    }
  };

  return (
    <div className={`rounded-[3rem] border p-12 mb-16 relative overflow-hidden transition-all duration-700 ${getRiskColor(risk.riskLevel)}`}>
      {/* High-Fidelity Glow */}
      <div className={`absolute -left-20 -top-20 w-96 h-96 blur-[120px] rounded-full opacity-30 ${risk.riskLevel === "Critical" ? "bg-red-500" : "bg-primary"}`} />
      <div className="absolute top-0 right-0 p-8">
         <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-md">
            Neural v2.1-mesh
         </div>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-16 items-start relative z-10">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-6 mb-12">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl border ${
              risk.riskLevel === "Critical" ? "bg-red-500 border-red-400" : "bg-primary border-primary-foreground/20"
            }`}>
              <ShieldAlert size={40} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest animate-pulse ${
                   risk.riskLevel === "Critical" ? "bg-red-500" : "bg-primary"
                }`}>
                  Action Required
                </span>
                <span className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em]">{risk.trend} Trend Detected</span>
              </div>
              <h2 className="text-5xl font-black tracking-tighter text-foreground uppercase">Neural Correction Path</h2>
            </div>
          </div>

          <p className="text-xl text-muted-foreground mb-16 max-w-3xl leading-relaxed font-medium">
            {risk.riskLevel === "Critical" || risk.riskLevel === "High" 
              ? `Your current performance in ${analysis.subject} has triggered a critical divergence. The AI has prioritized these corrective actions.`
              : `Path stabilization successful for ${analysis.subject}. We have generated these optimization tasks to secure your mastery.`
            }
          </p>

          <div className="relative space-y-0 pl-16 border-l-2 border-dashed border-primary/20 ml-10 py-6">
            {roadmap.map((step, i) => {
              const isFirst = i === 0;
              const isCurrent = risk.riskLevel !== "Low" && isFirst;
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="relative mb-16 last:mb-0"
                >
                  {/* Connector Node */}
                  <div className={`absolute -left-[84px] top-0 w-14 h-14 rounded-full border-[6px] border-background flex items-center justify-center z-10 shadow-2xl transition-all duration-500 ${
                    isCurrent ? "bg-red-500 text-white scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]" :
                    isFirst && risk.riskLevel === "Low" ? "bg-emerald-500 text-white" :
                    "bg-card border-border text-muted-foreground"
                  }`}>
                    {isFirst && risk.riskLevel === "Low" ? <CheckCircle2 size={24} /> : <div className="text-sm font-black">{i+1}</div>}
                  </div>

                  <div className={`p-10 rounded-[2.5rem] border transition-all duration-700 ${
                    isCurrent 
                      ? "bg-card border-red-500/50 shadow-[0_20px_80px_rgba(239,68,68,0.15)] -translate-y-2 scale-[1.02]" 
                      : "bg-transparent border-border/20 opacity-60"
                  }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h4 className={`text-2xl font-black tracking-tight ${!isCurrent && !isFirst ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {isCurrent ? `REQUIRED: ${step.phase}` : step.phase}
                          </h4>
                          {isCurrent && <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 uppercase tracking-widest">Active Task</span>}
                        </div>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">{step.objective}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
                          {step.actions.map((action, j) => (
                            <div key={j} className="flex items-start gap-3 group">
                               <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                               <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{action}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-6 mt-10 pt-8 border-t border-border/10">
                          <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
                            <Clock size={14} className="text-primary" /> {step.duration}
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-border" />
                          <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
                            <Zap size={14} className="text-primary" /> {step.priority} Priority
                          </div>
                        </div>
                      </div>
                      
                      {isCurrent && (
                        <button 
                          onClick={() => {
                            addToast("🚀 Neural Mesh Sync Initiated. Re-aligning curriculum...", "success");
                            // Simulate a brief sync delay
                            setTimeout(() => {
                              window.location.reload(); // Refresh to show "stabilized" state
                            }, 1500);
                          }}
                          className="bg-red-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-2xl shadow-red-500/40 flex items-center justify-center gap-3 group whitespace-nowrap active:scale-95"
                        >
                          EXECUTE SYNC <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="w-full xl:w-[450px] space-y-8 lg:sticky lg:top-12">
          <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[3rem] p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
               <h3 className="font-bold text-xs flex items-center gap-2 uppercase tracking-[0.2em] text-muted-foreground">
                 <AlertTriangle size={16} className={risk.riskLevel === "Critical" ? "text-red-500" : "text-primary"} /> Diagnosis Report
               </h3>
               <div className="text-[10px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">Real-Time</div>
            </div>

            <div className="space-y-10">
              {[
                { label: "Confidence", val: Math.round((1 - risk.probabilityOfFailure) * 100), color: risk.riskLevel === "Critical" ? "from-red-500 to-rose-600" : "from-primary to-indigo-600" },
                { label: "Consistency", val: 38, color: "from-amber-400 to-orange-500" },
                { label: "Retention", val: 15, color: "from-red-400 to-red-600" }
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between text-[12px] font-black uppercase mb-4 tracking-widest">
                    <span className="text-muted-foreground/60">{stat.label}</span>
                    <span className="text-foreground">{stat.val}%</span>
                  </div>
                  <div className="h-3 w-full bg-border/20 rounded-full overflow-hidden p-[2px]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.val}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${stat.color} shadow-[0_0_20px_rgba(0,0,0,0.1)]`} 
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-16 p-8 rounded-[2rem] bg-foreground/[0.03] border border-border/50 relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 relative z-10">Neural Inference Log</div>
              <p className="text-sm text-foreground/80 italic leading-relaxed relative z-10">
                "Subject divergence detected in {risk.primaryCause}. Cognitive load exceeds baseline by 22%. Generating corrective mesh alignment v2.1."
              </p>
            </div>
          </div>
          
          <div className="bg-primary text-primary-foreground rounded-[2.5rem] p-10 text-center shadow-2xl shadow-primary/20 group cursor-default">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 opacity-70 group-hover:opacity-100 transition-opacity">Estimated Repair Time</p>
            <div className="text-5xl font-black uppercase tracking-tighter group-hover:scale-110 transition-transform">{risk.riskLevel === "Low" ? "SECURE" : "90 MIN"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
