import { motion } from "framer-motion";
import { 
  ShieldAlert, Clock, Zap, CheckCircle2, 
  ArrowRight, AlertTriangle 
} from "lucide-react";
import { useAutoPredict } from "@/lib/ml/use-auto-predict";

export default function RiskAnalysisPanel() {
  const analysis = useAutoPredict();

  if (!analysis) return null;

  const { risk, roadmap } = analysis;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Critical": return "border-red-500/30 bg-red-500/5 shadow-red-500/10";
      case "High": return "border-orange-500/30 bg-orange-500/5 shadow-orange-500/10";
      default: return "border-emerald-500/30 bg-emerald-500/5 shadow-emerald-500/10";
    }
  };

  return (
    <div className={`rounded-[2.5rem] border p-10 mb-12 relative overflow-hidden transition-all duration-500 ${getRiskColor(risk.riskLevel)}`}>
      {/* Background Warning Aura */}
      <div className={`absolute -left-20 -top-20 w-64 h-64 blur-[100px] rounded-full opacity-20 ${risk.riskLevel === "Critical" ? "bg-red-500" : "bg-orange-500"}`} />
      
      <div className="flex flex-col xl:flex-row gap-12 items-start relative z-10">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl border ${
              risk.riskLevel === "Critical" ? "bg-red-500 border-red-400" : "bg-orange-500 border-orange-400"
            }`}>
              <ShieldAlert size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-white text-[9px] font-black uppercase tracking-widest animate-pulse ${
                   risk.riskLevel === "Critical" ? "bg-red-500" : "bg-orange-500"
                }`}>
                  Action Required
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Case ID: VND-{risk.trend === "Declining" ? "DV" : "OP"}-2026</span>
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Neural Correction Path</h2>
            </div>
          </div>

          <p className="text-muted-foreground mb-12 max-w-2xl leading-relaxed">
            {risk.riskLevel === "Critical" || risk.riskLevel === "High" 
              ? "Your current learning trajectory has diverged. The AI has prioritized these recovery steps to re-establish mastery."
              : "Stability detected. The AI has generated optimization steps to accelerate your mastery even further."
            }
          </p>

          <div className="relative space-y-0 pl-12 border-l-2 border-dashed border-border/50 ml-8 py-4">
            {roadmap.map((step, i) => {
              const isFirst = i === 0;
              const isCurrent = risk.riskLevel !== "Low" && isFirst;
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative mb-12 last:mb-0"
                >
                  {/* Connector Node */}
                  <div className={`absolute -left-[62px] top-0 w-12 h-12 rounded-full border-4 border-background flex items-center justify-center z-10 shadow-lg ${
                    isCurrent ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]" :
                    isFirst && risk.riskLevel === "Low" ? "bg-emerald-500 text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isFirst && risk.riskLevel === "Low" ? <CheckCircle2 size={20} /> : <div className="text-xs font-black">{i+1}</div>}
                  </div>

                  <div className={`p-8 rounded-[2rem] border transition-all duration-500 ${
                    isCurrent 
                      ? "bg-card border-red-500/40 shadow-2xl shadow-red-500/10 -translate-y-1 scale-[1.01]" 
                      : "bg-transparent border-border/20 opacity-60"
                  }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className={`text-xl font-black tracking-tight ${!isCurrent && !isFirst ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {isCurrent ? `REQUIRED: ${step.phase}` : step.phase}
                          </h4>
                          {isCurrent && <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">CURRENT TASK</span>}
                        </div>
                        <p className="text-[15px] text-muted-foreground leading-relaxed max-w-2xl">{step.objective}</p>
                        
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                            <Clock size={12} /> {step.duration}
                          </div>
                          <div className="w-1 h-1 rounded-full bg-border" />
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                            <Zap size={12} /> {step.priority} Priority
                          </div>
                        </div>
                      </div>
                      
                      {isCurrent && (
                        <button className="bg-red-500 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-red-500/30 flex items-center justify-center gap-2 group whitespace-nowrap">
                          START REPAIR <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="w-full xl:w-[400px] space-y-6 lg:sticky lg:top-8">
          <div className="bg-card/60 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="font-bold text-sm mb-8 flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
              <AlertTriangle size={14} className={risk.riskLevel === "Critical" ? "text-red-500" : "text-orange-500"} /> Diagnosis Report
            </h3>
            <div className="space-y-8">
              {[
                { label: "Confidence", val: Math.round((1 - risk.probabilityOfFailure) * 100), color: risk.riskLevel === "Critical" ? "bg-red-500" : "bg-orange-500" },
                { label: "Consistency", val: 38, color: "bg-amber-500" },
                { label: "Retention", val: 15, color: "bg-red-500" }
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
            
            <div className="mt-12 p-6 rounded-[1.5rem] bg-foreground/[0.03] border border-border/50">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">AI Intervention Log</div>
              <p className="text-[12px] text-foreground/80 italic leading-relaxed">
                "Divergence detected in {risk.primaryCause}. Probability of failure: {Math.round(risk.probabilityOfFailure * 100)}%. Triggering corrective mesh alignment."
              </p>
            </div>
          </div>
          
          <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-6 text-center">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Estimated Restoration</p>
            <div className="text-3xl font-black text-foreground uppercase">{risk.riskLevel === "Low" ? "PATH SECURE" : "90 MIN"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
