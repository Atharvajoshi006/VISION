"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { BookOpen, Users, Clock, Zap } from "lucide-react";
import PlasmaCanvas from "@/components/hero/plasma-canvas";
import ThemeToggle from "@/components/theme-toggle";

export default function TutorOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      setIsFinishing(true);
      setTimeout(() => router.push("/dashboard/tutor"), 1000);
    }
  };

  const QUOTES = [
    {
      text: "The art of teaching is the art of assisting discovery.",
      author: "Mark Van Doren"
    },
    {
      text: "A teacher is one who makes himself progressively unnecessary.",
      author: "Thomas Carruthers"
    },
    {
      text: "Technology is just a tool. In terms of getting the kids working together and motivating them, the teacher is the most important.",
      author: "Bill Gates"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background text-foreground transition-colors duration-300 px-6 py-20" style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
      <PlasmaCanvas />
      
      {/* Ambient blobs - Expanded for whole screen feel */}
      <div className="absolute w-[850px] h-[850px] rounded-full pointer-events-none z-0 opacity-70" style={{ background: "radial-gradient(circle, rgba(255,202,40,0.1) 0%, transparent 70%)", top: "-15%", left: "-15%", filter: "blur(110px)" }} />
      <div className="absolute w-[850px] h-[850px] rounded-full pointer-events-none z-0 opacity-70" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)", bottom: "-15%", right: "-15%", filter: "blur(110px)" }} />
      <div className="absolute w-[650px] h-[650px] rounded-full pointer-events-none z-0 opacity-40" style={{ background: "radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)", top: "25%", right: "10%", filter: "blur(130px)" }} />
      <div className="absolute w-[650px] h-[650px] rounded-full pointer-events-none z-0 opacity-40" style={{ background: "radial-gradient(circle, rgba(217,119,6,0.05) 0%, transparent 70%)", bottom: "15%", left: "15%", filter: "blur(130px)" }} />

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
          <span className="text-[5rem] font-serif text-amber-500/20 leading-none block mb-[-2rem]">&ldquo;</span>
          <h3 className="text-[2.5rem] font-medium leading-tight mb-6" style={{ fontFamily: 'var(--font-vision)', color: 'var(--foreground)' }}>
            {QUOTES[step-1].text}
          </h3>
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-amber-500/30" />
            <span className="text-sm font-bold tracking-widest uppercase text-amber-500/60">{QUOTES[step-1].author}</span>
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
                <div key={i} className="h-1.5 w-12 rounded-full transition-all duration-500 bg-black/10 dark:bg-white/10" style={{ ...(i <= step ? { background: "#ffca28" } : {}) }} />
              ))}
            </div>
            <span className="text-sm font-medium text-muted-foreground">Step {step} of 3</span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-[0_4px_16px_rgba(255,202,40,0.2)]" style={{ background: "linear-gradient(135deg, #f59e0b, #ffca28)" }}>
                  <BookOpen size={24} color="#000" />
                </div>
                <h2 className="text-3xl font-black mb-3 tracking-[-0.03em]">Establish your expertise</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">What disciplines will you be instructing in the VISION network?</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {["Computer Science", "Mathematics", "Physics", "Biology", "Economics", "Literature"].map(subject => (
                    <label key={subject} className="flex items-center p-4 rounded-xl cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10 group bg-black/5 dark:bg-white/[0.02]">
                      <input type="checkbox" className="mr-3 accent-[#ffca28] w-4 h-4 rounded" />
                      <span className="font-medium text-sm group-hover:text-foreground transition-colors">{subject}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-[0_4px_16px_rgba(255,202,40,0.2)]" style={{ background: "linear-gradient(135deg, #f59e0b, #ffca28)" }}>
                  <Users size={24} color="#000" />
                </div>
                <h2 className="text-3xl font-black mb-3 tracking-[-0.03em]">Define target cohort</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">Select the primary academic level of your students.</p>
                
                <div className="grid gap-3">
                  {["High School", "Undergraduate", "Postgraduate", "Professional / Continuing"].map(level => (
                    <label key={level} className="flex items-center p-4 rounded-xl cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10 group bg-black/5 dark:bg-white/[0.02]">
                      <input type="radio" name="level" className="mr-4 accent-[#ffca28] w-4 h-4" />
                      <span className="font-medium group-hover:text-foreground transition-colors">{level}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-[0_4px_16px_rgba(255,202,40,0.2)]" style={{ background: "linear-gradient(135deg, #f59e0b, #ffca28)" }}>
                  <Clock size={24} color="#000" />
                </div>
                <h2 className="text-3xl font-black mb-3 tracking-[-0.03em]">Content format</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">What type of content will you primarily provide?</p>
                
                <div className="grid gap-4">
                  {[
                    { title: "Video Lectures", desc: "Long-form cinematic educational videos." },
                    { title: "Interactive Modules", desc: "Bite-sized, highly interactive exercises." },
                    { title: "Live Mentorship", desc: "Real-time 1-on-1 or group cognitive sessions." }
                  ].map(format => (
                    <label key={format.title} className="flex flex-col p-5 rounded-xl cursor-pointer transition-all border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/[0.03] hover:border-[#ffca28]/50 hover:bg-[#ffca28]/5">
                      <div className="flex items-center mb-1">
                        <input type="radio" name="format" className="mr-3 accent-[#ffca28]" />
                        <span className="font-bold">{format.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground ml-6">{format.desc}</span>
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
              className="px-8 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-[0_4px_20px_rgba(255,202,40,0.3)] disabled:opacity-70 disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #ffca28, #f59e0b)", color: "#000" }}
            >
              {isFinishing ? (
                <>Constructing Dashboard <Zap size={16} className="animate-pulse" /></>
              ) : (
                <>{step === 3 ? "Access Dashboard" : "Continue"} →</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
