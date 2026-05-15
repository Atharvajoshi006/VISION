"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BrainCircuit, Activity, Cpu, ShieldCheck } from "lucide-react";
import PlasmaCanvas from "@/components/hero/plasma-canvas";
import ThemeToggle from "@/components/theme-toggle";
import { useUserStore } from "@/store/use-user-store";

type Mode = "login" | "signup";

const MOCK_USERS = [
  { email: "alex@vision.ai", role: "student", name: "Alex Mercer" },
  { email: "sarah@vision.ai", role: "tutor", name: "Prof. Sarah J." },
  { email: "student@vision.ai", role: "student", name: "Demo Student" },
  { email: "tutor@vision.ai", role: "tutor", name: "Demo Tutor" },
];

import { supabase, signInWithGoogle } from "@/lib/supabase";

export default function UnifiedAuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const router = useRouter();
  const setProfile = useUserStore(state => state.setProfile);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      console.error("Google Auth Error:", error.message);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Check if it's a mock user first
    const knownUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (knownUser) {
      // Mock login simulation
      setTimeout(() => {
        setProfile({ 
          email, 
          role: knownUser.role.charAt(0).toUpperCase() + knownUser.role.slice(1),
          name: knownUser.name
        });
        router.push(`/onboarding/${knownUser.role}`);
      }, 1000);
      return;
    }

    // REAL AUTH with Supabase
    try {
      if (mode === "signup") {
        // Smart Role Inference
        const nameLower = fullName.toLowerCase();
        const emailLower = email.toLowerCase();
        const tutorTitles = ["dr.", "dr ", "prof.", "prof ", "instructor", "teacher", "mentor"];
        const isTutor = tutorTitles.some(t => nameLower.includes(t)) || emailLower.includes("tutor") || emailLower.includes("prof");
        const detectedRole = isTutor ? "tutor" : "student";

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: detectedRole
            }
          }
        });

        if (error) throw error;
        
        setProfile({ email, role: detectedRole.charAt(0).toUpperCase() + detectedRole.slice(1), name: fullName });
        router.push(`/onboarding/${detectedRole}`);
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Fetch profile to get role and name
        const { data: dbProfile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        const finalRole = dbProfile?.role || data.user.user_metadata?.role || "student";
        const finalName = dbProfile?.name || data.user.user_metadata?.full_name || "User";
        
        setProfile({ email, role: finalRole.charAt(0).toUpperCase() + finalRole.slice(1), name: finalName });
        router.push(`/dashboard/${finalRole}`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{ fontFamily: "var(--font-inter, sans-serif)" }}
      className="min-h-screen flex relative overflow-hidden bg-background text-foreground transition-colors duration-300"
    >
      <PlasmaCanvas />
      
      <div className="absolute w-[800px] h-[800px] rounded-full pointer-events-none z-0 opacity-40" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", top: -200, left: -200, filter: "blur(100px)" }} />
      <div className="absolute w-[600px] h-[600px] rounded-full pointer-events-none z-0 opacity-40" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", bottom: -150, right: -100, filter: "blur(100px)" }} />

      <div className="flex-1 flex flex-col justify-between p-12 relative z-10 border-r border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#0d0d14]/55 backdrop-blur-md transition-colors duration-300">
        <Link href="/" className="inline-flex items-center gap-3 w-fit group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden transition-transform group-hover:scale-105">
            <img src="/vision-logo.png" alt="VISION logo" className="w-8 h-8 object-contain mix-blend-multiply" />
          </div>
          <span className="text-[1.2rem] font-bold tracking-[-0.03em] uppercase" style={{ fontFamily: 'var(--font-vision)' }}>VISION</span>
        </Link>

        <div className="relative z-[1]">
          <div className="inline-flex items-center gap-2 text-[0.72rem] tracking-[0.12em] uppercase mb-7 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary" style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>
            <span className="w-1.5 h-1.5 rounded-full badge-dot-blink bg-primary shadow-[0_0_6px_#a78bfa]" />
            Neural Gateway
          </div>

          <h1 className="text-[clamp(2.2rem,4vw,3.2rem)] font-black leading-[1.08] tracking-[-0.03em] mb-5">
            Access the <br />
            <span style={{ background: "linear-gradient(135deg, #a78bfa, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Cognitive Mesh.
            </span>
          </h1>
          <p className="text-[1rem] leading-[1.7] max-w-[420px] text-muted-foreground">
            VISION&apos;s neural gateway automatically identifies your profile and synchronizes your learning or instruction environment in real-time.
          </p>

          <div className="flex flex-col gap-3.5 mt-10">
            {[
              { icon: BrainCircuit, text: "Automated profile recognition" },
              { icon: Activity, text: "Seamless environment sync" },
              { icon: Cpu, text: "Neural compute allocation" },
              { icon: ShieldCheck, text: "Encrypted neural biometric" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-[0.88rem] text-muted-foreground">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-primary/20 bg-primary/10">
                  <item.icon size={16} className="text-primary" />
                </div>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="text-[0.72rem] text-muted-foreground/60">
          Neural Handshake Protocol v4.2.1-mesh
        </div>
      </div>

      <div className="w-[480px] flex-shrink-0 flex flex-col justify-center px-14 py-14 relative z-10 bg-white/75 dark:bg-[#0a0a12]/75 backdrop-blur-[20px] transition-colors duration-300">
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>

        <div className="mb-8">
          <h2 className="text-[1.75rem] font-black tracking-[-0.03em] mb-1">
            {mode === "login" ? "Synchronize" : "Register"}
          </h2>
          <p className="text-[0.9rem] text-muted-foreground">
            {mode === "login" ? "Initialize neural handshake" : "Establish a new cognitive link"}
          </p>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 mb-6 rounded-xl border border-border bg-card flex items-center justify-center gap-3 text-[0.9rem] font-semibold hover:bg-white/5 transition-all group"
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {isLoading ? "Synchronizing..." : "Neural Sync with Google"}
        </button>

        <div className="relative mb-8 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
          <span className="relative px-4 bg-white dark:bg-[#0a0a12] text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground/50">Neural Path</span>
        </div>

        <div className="flex border-b border-black/10 dark:border-white/10 mb-7 transition-colors">
          {(["login", "signup"] as Mode[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`px-5 py-2.5 text-[0.88rem] font-semibold border-b-2 transition-all cursor-pointer bg-transparent ${
                mode === tab ? "text-foreground border-primary" : "text-muted-foreground border-transparent"
              }`}
            >
              {tab === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <div className="flex flex-col gap-3.5 mb-3.5 transition-all">
                <div>
                  <label className="block text-[0.68rem] tracking-[0.1em] uppercase mb-1.5 text-muted-foreground" style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>Full Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Identity string" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    className="w-full rounded-xl px-4 py-3.5 text-foreground bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[0.95rem] outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(167,139,250,0.1)]" 
                  />
                </div>
              </div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-[0.68rem] tracking-[0.1em] uppercase mb-1.5 text-muted-foreground" style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>Communication Path (Email)</label>
            <input required type="email" placeholder="user@neural-link.net" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl px-4 py-3.5 text-foreground bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[0.95rem] outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(167,139,250,0.1)]" />
          </div>

          <div>
            <label className="block text-[0.68rem] tracking-[0.1em] uppercase mb-1.5 text-muted-foreground" style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>Access Token (Password)</label>
            <input required type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl px-4 py-3.5 text-foreground bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[0.95rem] outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(167,139,250,0.1)]" />
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-3.5 mt-2 text-[0.95rem] font-bold tracking-[-0.01em] rounded-full border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(167,139,250,0.5)]" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", color: "#fff", opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? "Synchronizing Neural Mesh..." : mode === "login" ? "Initialize Handshake →" : "Establish Link →"}
          </button>
        </form>

        <Link href="/" className="inline-flex items-center gap-1.5 mt-7 text-[0.8rem] transition-colors text-muted-foreground hover:text-foreground" style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>
          <ArrowLeft size={14} />
          Back to Root
        </Link>
      </div>
    </div>
  );
}
