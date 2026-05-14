"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Brain, Sparkles, Target, Zap } from "lucide-react";
import PlasmaCanvas from "@/components/hero/plasma-canvas";
import ThemeToggle from "@/components/theme-toggle";

import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function StudentOnboarding() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Selection state
  const [level, setLevel] = useState("");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [intensity, setIntensity] = useState("Standard");

  const toggleDiscipline = (val: string) => {
    setDisciplines(prev => 
      prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]
    );
  };

  const handleNext = async () => {
    if (step < 3) setStep(step + 1);
    else {
      setIsFinishing(true);
      try {
        await api.patch("/users/me/student-profile/", {
          academic_level: level,
          disciplines: disciplines,
          learning_intensity: intensity,
        });
        addToast("Profile synchronized successfully!", "success");
        setTimeout(() => router.push("/dashboard/student"), 800);
      } catch (err) {
        console.error("Failed to save onboarding data:", err);
        addToast("Sync failed, but you can continue.", "warning");
        setTimeout(() => router.push("/dashboard/student"), 800);
      }
    }
  };

  const QUOTES = [
    {
      text: "The future belongs to those who learn more than they were taught.",
      author: "VISION Intelligence"
    },
    {
      text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
      author: "Malcolm X"
    },
    {
      text: "Intelligence is the ability to adapt to change.",
      author: "Stephen Hawking"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background text-foreground transition-colors duration-300 px-6 py-20" style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
      <PlasmaCanvas />
      
      {/* Ambient blobs - Expanded for whole screen feel */}
      <div className="absolute w-[800px] h-[800px] rounded-full pointer-events-none z-0 opacity-60" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", top: "-20%", left: "-10%", filter: "blur(100px)" }} />
      <div className="absolute w-[800px] h-[800px] rounded-full pointer-events-none z-0 opacity-60" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", bottom: "-20%", right: "-10%", filter: "blur(100px)" }} />
      <div className="absolute w-[600px] h-[600px] rounded-full pointer-events-none z-0 opacity-40" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)", top: "20%", right: "10%", filter: "blur(120px)" }} />
      <div className="absolute w-[600px] h-[600px] rounded-full pointer-events-none z-0 opacity-40" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", bottom: "10%", left: "15%", filter: "blur(120px)" }} />

      <div className="absolute top-8 right-12 z-[100]">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-12 relative z-10">
        {/* Dynamic Quote Panel */}
        <motion.div 
          layout
          key={`quote-${step}`}
          initial={{ opacity: 0, x: step % 2 === 0 ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex-1 max-w-lg hidden lg:block ${step % 2 === 0 ? "order-2" : "order-1"}`}
        >
          <span className="text-[5rem] font-serif text-primary/20 leading-none block mb-[-2rem]">&ldquo;</span>
          <h3 className="text-[2.5rem] font-medium leading-tight mb-6" style={{ fontFamily: 'var(--font-vision)', color: 'var(--foreground)' }}>
            {QUOTES[step-1].text}
          </h3>
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-primary/30" />
            <span className="text-sm font-bold tracking-widest uppercase text-primary/60">{QUOTES[step-1].author}</span>
          </div>
        </motion.div>

        {/* Main Onboarding Card */}
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-2xl p-10 rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#0d0d14]/65 shadow-2xl backdrop-blur-[25px] transition-colors duration-300 ${step % 2 === 0 ? "order-1" : "order-2"}`}
        >
          <div className="flex justify-between items-center mb-10">
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-1.5 w-12 rounded-full transition-all duration-500 bg-black/10 dark:bg-white/10" style={{ ...(i <= step ? { background: "#a78bfa" } : {}) }} />
              ))}
            </div>
            <span className="text-sm font-medium text-muted-foreground">Step {step} of 3</span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-[0_4px_16px_rgba(99,102,241,0.4)]" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                  <Brain size={24} color="#fff" />
                </div>
                <h2 className="text-3xl font-black mb-3 tracking-[-0.03em]">Initialize your profile</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">To tailor your cognitive map, what describes your current academic level?</p>
                
                <div className="grid gap-3">
                  {["High School", "Undergraduate", "Postgraduate", "Professional / Continuing"].map(l => (
                    <label key={l} className="flex items-center p-4 rounded-xl cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10 group bg-black/5 dark:bg-white/[0.02]">
                      <input 
                        type="radio" 
                        name="level" 
                        className="mr-4 accent-[#a78bfa] w-4 h-4" 
                        checked={level === l}
                        onChange={() => setLevel(l)}
                      />
                      <span className="font-medium group-hover:text-foreground transition-colors">{l}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-[0_4px_16px_rgba(99,102,241,0.4)]" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                  <Target size={24} color="#fff" />
                </div>
                <h2 className="text-3xl font-black mb-3 tracking-[-0.03em]">Select your disciplines</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">Choose the fields you wish to master. Our AI will curate a personalized curriculum.</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {["Computer Science", "Mathematics", "Physics", "Biology", "Economics", "Literature"].map(subject => (
                    <label key={subject} className="flex items-center p-4 rounded-xl cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10 group bg-black/5 dark:bg-white/[0.02]">
                      <input 
                        type="checkbox" 
                        className="mr-3 accent-[#a78bfa] w-4 h-4 rounded" 
                        checked={disciplines.includes(subject)}
                        onChange={() => toggleDiscipline(subject)}
                      />
                      <span className="font-medium text-sm group-hover:text-foreground transition-colors">{subject}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-[0_4px_16px_rgba(99,102,241,0.4)]" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                  <Sparkles size={24} color="#fff" />
                </div>
                <h2 className="text-3xl font-black mb-3 tracking-[-0.03em]">Set learning intensity</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">How aggressively should VISION pace your learning modules?</p>
                
                <div className="grid gap-4">
                  {[
                    { title: "Standard", desc: "Balanced pacing with regular review periods." },
                    { title: "Accelerated", desc: "Faster progression for quick mastery." },
                    { title: "Deep Cognitive", desc: "Intensive focus on complex problem solving." }
                  ].map(pace => (
                    <label key={pace.title} className="flex flex-col p-5 rounded-xl cursor-pointer transition-all border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/[0.03] hover:border-[#a78bfa]/50 hover:bg-[#a78bfa]/5">
                      <div className="flex items-center mb-1">
                        <input 
                          type="radio" 
                          name="pace" 
                          className="mr-3 accent-[#a78bfa]" 
                          checked={intensity === pace.title}
                          onChange={() => setIntensity(pace.title)}
                        />
                        <span className="font-bold">{pace.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground ml-6">{pace.desc}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
    </div>
  );
}
