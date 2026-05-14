"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Brain, Sparkles, Target, Zap } from "lucide-react";
import PlasmaCanvas from "@/components/hero/plasma-canvas";
import ThemeToggle from "@/components/theme-toggle";

export default function StudentOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      setIsFinishing(true);
      setTimeout(() => router.push("/dashboard/student"), 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background text-foreground transition-colors duration-300" style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
      <PlasmaCanvas />
      
      {/* Ambient blobs */}
      <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none z-0" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", top: "-10%", left: "-10%", filter: "blur(60px)" }} />
      <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none z-0" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", bottom: "-10%", right: "-10%", filter: "blur(60px)" }} />

      <div className="absolute top-8 right-12 z-[100]">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl p-10 rounded-3xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#0d0d14]/65 shadow-2xl relative z-10 backdrop-blur-[20px] transition-colors duration-300"
      >
        <div className="flex justify-between items-center mb-10">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-1.5 w-12 rounded-full transition-all duration-500 bg-black/10 dark:bg-white/10" style={{ ...(i <= step ? { background: "#a78bfa" } : {}) }} />
            ))}
          </div>
          <span className="text-sm font-medium text-muted-foreground">Step {step} of 3</span>
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-[0_4px_16px_rgba(99,102,241,0.4)]" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              <Brain size={24} color="#fff" />
            </div>
            <h2 className="text-3xl font-black mb-3 tracking-[-0.03em]">Initialize your profile</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">To tailor your cognitive map, what describes your current academic level?</p>
            
            <div className="grid gap-3">
              {["High School", "Undergraduate", "Postgraduate", "Professional / Continuing"].map(level => (
                <label key={level} className="flex items-center p-4 rounded-xl cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10 group bg-black/5 dark:bg-white/[0.02]">
                  <input type="radio" name="level" className="mr-4 accent-[#a78bfa] w-4 h-4" />
                  <span className="font-medium group-hover:text-foreground transition-colors">{level}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-[0_4px_16px_rgba(99,102,241,0.4)]" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              <Target size={24} color="#fff" />
            </div>
            <h2 className="text-3xl font-black mb-3 tracking-[-0.03em]">Select your disciplines</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">Choose the fields you wish to master. Our AI will curate a personalized curriculum.</p>
            
            <div className="grid grid-cols-2 gap-3">
              {["Computer Science", "Mathematics", "Physics", "Biology", "Economics", "Literature"].map(subject => (
                <label key={subject} className="flex items-center p-4 rounded-xl cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10 group bg-black/5 dark:bg-white/[0.02]">
                  <input type="checkbox" className="mr-3 accent-[#a78bfa] w-4 h-4 rounded" />
                  <span className="font-medium text-sm group-hover:text-foreground transition-colors">{subject}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-[0_4px_16px_rgba(99,102,241,0.4)]" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              <Sparkles size={24} color="#fff" />
            </div>
            <h2 className="text-3xl font-black mb-3 tracking-[-0.03em]">Set learning intensity</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">How aggressively should Vision AI pace your learning modules?</p>
            
            <div className="grid gap-4">
              {[
                { title: "Standard", desc: "Balanced pacing with regular review periods." },
                { title: "Accelerated", desc: "Faster progression for quick mastery." },
                { title: "Deep Cognitive", desc: "Intensive focus on complex problem solving." }
              ].map(pace => (
                <label key={pace.title} className="flex flex-col p-5 rounded-xl cursor-pointer transition-all border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/[0.03] hover:border-[#a78bfa]/50 hover:bg-[#a78bfa]/5">
                  <div className="flex items-center mb-1">
                    <input type="radio" name="pace" className="mr-3 accent-[#a78bfa]" />
                    <span className="font-bold">{pace.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground ml-6">{pace.desc}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mt-10 flex justify-between items-center border-t border-black/10 dark:border-white/10 pt-6">
          <button 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1 || isFinishing}
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/10"
          >
            Back
          </button>
          
          <button 
            onClick={handleNext}
            disabled={isFinishing}
            className="px-8 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-[0_4px_20px_rgba(99,102,241,0.4)] disabled:opacity-70 disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", color: "#fff" }}
          >
            {isFinishing ? (
              <>Generating Profile <Zap size={16} className="animate-pulse" /></>
            ) : (
              <>{step === 3 ? "Launch Dashboard" : "Continue"} →</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
