"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Brain, Sparkles, Target, Zap, 
  Layers,
  ArrowRight, ArrowLeft, CheckCircle2
} from "lucide-react";
import PlasmaCanvas from "@/components/hero/plasma-canvas";
import ThemeToggle from "@/components/theme-toggle";

import { useUserStore } from "@/store/use-user-store";
import { supabase, saveOnboardingData } from "@/lib/supabase";

export default function StudentOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  
  const { profile, setProfile } = useUserStore();

  const handleOptionChange = (name: string, id: string) => {
    setResponses(prev => ({ ...prev, [name]: id }));
  };

  const handleNext = async () => {
    if (step < 4) setStep(step + 1);
    else {
      setIsFinishing(true);
      
      // Calculate derived cognitive level based on baseline
      let initial_level = 1;
      if (responses.baseline === "basics") initial_level = 3;
      if (responses.baseline === "intermediate") initial_level = 5;
      if (responses.baseline === "advanced") initial_level = 7;

      const profileUpdate = {
        name: profile.name,
        role: "student",
        cognitive_level: initial_level,
        onboarding_completed: true,
        onboarding_data: responses,
        bio: `Adaptive learner focused on ${responses.goal}. Preferred logic: ${responses.modeling}.`
      };

      // Save to Global Store
      setProfile(profileUpdate);

      // Save to Supabase (Use actual UUID from session)
      try {
        console.log("[ONBOARDING] Initiating neural sync with Supabase...");
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { error } = await saveOnboardingData(session.user.id, profileUpdate);
          if (error) throw error;
          console.log("[ONBOARDING] Neural sync successful!");
        } else {
          console.warn("[ONBOARDING] No active session found. Running in local mode.");
        }
      } catch (err: any) {
        console.error("[ONBOARDING] Sync error:", err.message);
        // We continue to dashboard anyway to prevent "stuck" state
      }

      setTimeout(() => {
        console.log("[ONBOARDING] Redirecting to dashboard...");
        router.push("/dashboard/student");
      }, 1000);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
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
    },
    {
      text: "The mind is not a vessel to be filled, but a fire to be kindled.",
      author: "Plutarch"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background text-foreground transition-colors duration-300 px-6 py-12 lg:py-20" style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
      <PlasmaCanvas />
      
      {/* Ambient glassmorphism blobs */}
      <div className="absolute w-[800px] h-[800px] rounded-full pointer-events-none z-0 opacity-60" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", top: "-20%", left: "-10%", filter: "blur(100px)" }} />
      <div className="absolute w-[800px] h-[800px] rounded-full pointer-events-none z-0 opacity-60" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", bottom: "-20%", right: "-10%", filter: "blur(100px)" }} />

      <div className="absolute top-8 right-12 z-[100]">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 relative z-10">
        
        {/* Dynamic Quote Panel */}
        <motion.div 
          layout
          key={`quote-${step}`}
          initial={{ opacity: 0, x: step % 2 === 0 ? 30 : -30 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex-1 max-w-lg hidden lg:block ${step % 2 === 0 ? "order-2" : "order-1"}`}
        >
          <span className="text-[5rem] font-serif text-primary/10 leading-none block mb-[-2rem]">&ldquo;</span>
          <h3 className="text-[2.2rem] font-medium leading-tight mb-8" style={{ fontFamily: 'var(--font-vision, serif)', color: 'var(--foreground)' }}>
            {QUOTES[step-1].text}
          </h3>
          <div className="flex items-center gap-4">
            <div className="h-[2px] w-12 bg-primary/20" />
            <span className="text-sm font-bold tracking-widest uppercase text-primary/50">{QUOTES[step-1].author}</span>
          </div>
        </motion.div>

        {/* Main Onboarding Card */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-xl p-8 lg:p-10 rounded-[2.5rem] border border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/40 shadow-2xl backdrop-blur-[30px] transition-colors duration-300 relative ${step % 2 === 0 ? "order-1" : "order-2"}`}
        >
          {/* Progress Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex gap-1.5 flex-1 mr-4">
              {[1, 2, 3, 4].map(i => (
                <div 
                  key={i} 
                  className="h-1.5 flex-1 rounded-full transition-all duration-500 bg-black/5 dark:bg-white/5 overflow-hidden"
                >
                  <motion.div 
                    initial={false}
                    animate={{ width: i <= step ? "100%" : "0%" }}
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  />
                </div>
              ))}
            </div>
            <span className="text-xs font-bold tracking-tighter uppercase text-muted-foreground whitespace-nowrap">Phase {step} of 4</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[440px]"
            >
              {/* Step Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl relative group" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                {step === 1 && <Target size={28} color="#fff" />}
                {step === 2 && <Brain size={28} color="#fff" />}
                {step === 3 && <Sparkles size={28} color="#fff" />}
                {step === 4 && <Layers size={28} color="#fff" />}
              </div>

              {/* Step Content */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2 tracking-tight">Setting the Target</h2>
                    <p className="text-muted-foreground">“First, what’s the mission?”</p>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { id: "exam", title: "Passing an Exam", desc: "AI prioritizes high-yield topics and speed." },
                      { id: "mastery", title: "Deep Mastery", desc: "AI prioritizes fundamentals and edge cases." },
                      { id: "refresher", title: "Quick Refresher", desc: "AI prioritizes summaries and review." },
                      { id: "skills", title: "Skill Building", desc: "AI prioritizes practical application." }
                    ].map(opt => (
                      <OptionCard 
                        key={opt.id} 
                        {...opt} 
                        name="goal" 
                        checked={responses.goal === opt.id}
                        onChange={() => handleOptionChange("goal", opt.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2 tracking-tight">The Starting Point</h2>
                    <p className="text-muted-foreground">How much do you already know about your subjects?</p>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { id: "beginner", title: "Total Beginner", desc: "Start from absolute zero with 101s." },
                      { id: "basics", title: "Know the Basics", desc: "Skip the intros; move to core concepts." },
                      { id: "intermediate", title: "Intermediate", desc: "Dive straight into the core interactions." },
                      { id: "advanced", title: "Advanced", desc: "Challenge me with high-level problems immediately." }
                    ].map(opt => (
                      <OptionCard 
                        key={opt.id} 
                        {...opt} 
                        name="baseline" 
                        checked={responses.baseline === opt.id}
                        onChange={() => handleOptionChange("baseline", opt.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2 tracking-tight">Netflix-Style Preference</h2>
                    <p className="text-muted-foreground">“How do you learn best?”</p>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { id: "watch", title: "Watch & Learn", desc: "Prioritize video and dynamic animations." },
                      { id: "read", title: "Read & Note", desc: "Prioritize text, articles, and documentation." },
                      { id: "practice", title: "Hands-on Practice", desc: "Prioritize interactive tasks and labs." },
                      { id: "sprints", title: "Quick Sprints", desc: "Prioritize flashcards and rapid quizzes." }
                    ].map(opt => (
                      <OptionCard 
                        key={opt.id} 
                        {...opt} 
                        name="flavor" 
                        checked={responses.flavor === opt.id}
                        onChange={() => handleOptionChange("flavor", opt.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2 tracking-tight">The Logic Bridge</h2>
                    <p className="text-muted-foreground">“How should I translate complex ideas for you?”</p>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { id: "analogist", title: "The Analogist", desc: "Explain using metaphors (e.g. Warehouse for Data Structures)." },
                      { id: "first-principles", title: "First-Principles Thinker", desc: "Strip away the fluff; use raw logic and math." },
                      { id: "visualizer", title: "The Visual Mapper", desc: "Use flowcharts and spatial hierarchies." },
                      { id: "casestudy", title: "The Case Studier", desc: "Show a real-world result first, then the theory." }
                    ].map(opt => (
                      <OptionCard 
                        key={opt.id} 
                        {...opt} 
                        name="modeling" 
                        checked={responses.modeling === opt.id}
                        onChange={() => handleOptionChange("modeling", opt.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Footer */}
          <div className="mt-10 flex justify-between items-center border-t border-black/5 dark:border-white/5 pt-8">
            <button 
              onClick={handleBack} 
              disabled={step === 1 || isFinishing}
              className="group flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-0 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              Back
            </button>
            
            <button 
              onClick={handleNext}
              disabled={isFinishing}
              className="group relative px-10 py-4 rounded-full text-sm font-bold flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl disabled:opacity-70 disabled:hover:scale-100 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", color: "#fff" }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {isFinishing ? (
                <>
                  <span className="relative z-10">Initializing AI Profile</span>
                  <Zap size={18} className="relative z-10 animate-pulse text-yellow-300" />
                </>
              ) : (
                <>
                  <span className="relative z-10">{step === 4 ? "Launch Dashboard" : "Next Phase"}</span>
                  <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function OptionCard({ id, title, desc, name, checked, onChange }: { id: string, title: string, desc: string, name: string, checked: boolean, onChange: () => void }) {
  return (
    <label className={`flex items-start p-5 rounded-2xl cursor-pointer transition-all border ${checked ? 'border-violet-500 bg-violet-500/[0.05]' : 'border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]'} hover:border-violet-500/50 hover:bg-violet-500/[0.03] dark:hover:bg-violet-500/[0.05] group`}>
      <div className="mt-1 relative flex items-center justify-center">
        <input type="radio" name={name} id={id} className="peer sr-only" checked={checked} onChange={onChange} />
        <div className={`w-5 h-5 rounded-full border-2 transition-all ${checked ? 'border-violet-500 bg-violet-500' : 'border-muted-foreground/30'}`} />
        <CheckCircle2 size={12} className={`absolute text-white transition-transform ${checked ? 'scale-100' : 'scale-0'}`} />
      </div>
      <div className="ml-4">
        <span className={`block font-bold text-base transition-colors leading-tight mb-0.5 ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</span>
        <span className="block text-xs lg:text-sm text-muted-foreground leading-snug">{desc}</span>
      </div>
    </label>
  );
}
