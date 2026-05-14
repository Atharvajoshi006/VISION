"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BrainCircuit, Activity, PlaySquare, Zap } from "lucide-react";
import PlasmaCanvas from "@/components/hero/plasma-canvas";
import ThemeToggle from "@/components/theme-toggle";

type Mode = "login" | "signup";

export default function StudentAuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/onboarding/student");
    }, 800);
  };

  return (
    <div
      style={{ fontFamily: "var(--font-inter, sans-serif)" }}
      className="min-h-screen flex relative overflow-hidden bg-background text-foreground transition-colors duration-300"
    >
      <PlasmaCanvas />
      
      {/* Ambient blobs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          top: -100, left: -100,
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
          bottom: -80, right: 0,
          filter: "blur(60px)",
        }}
      />

      {/* Left Panel */}
      <div
        className="flex-1 flex flex-col justify-between p-12 relative z-10 border-r border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#0d0d14]/55 backdrop-blur-md transition-colors duration-300"
      >
        <Link href="/" className="inline-flex items-center gap-2.5 w-fit">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(99,102,241,0.4)]" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 16L20 24L12 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 32H36" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[1.1rem] font-bold tracking-[-0.02em]">Vision AI</span>
        </Link>

        <div className="relative z-[1]">
          <div
            className="inline-flex items-center gap-2 text-[0.72rem] tracking-[0.12em] uppercase mb-7 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400"
            style={{
              fontFamily: "var(--font-jetbrains, monospace)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full badge-dot-blink bg-violet-500 shadow-[0_0_6px_#8b5cf6]"
            />
            Student Portal
          </div>

          <h1 className="text-[clamp(2.2rem,4vw,3.2rem)] font-black leading-[1.08] tracking-[-0.03em] mb-5">
            The future of <br />
            <span style={{ background: "linear-gradient(135deg, #a78bfa, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              intelligent learning.
            </span>
          </h1>
          <p className="text-[1rem] leading-[1.7] max-w-[420px] text-muted-foreground">
            Vision AI leverages advanced performance analytics to create a hyper-personalized education environment. Stop following a syllabus and start following your data.
          </p>

          <div className="flex flex-col gap-3.5 mt-10">
            {[
              { icon: BrainCircuit, text: "Neural performance mapping" },
              { icon: Activity, text: "Real-time adaptive feedback" },
              { icon: Zap, text: "Cognitive load optimization" },
              { icon: PlaySquare, text: "Performance-synced curriculum" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-[0.88rem] text-muted-foreground">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-indigo-500/20 bg-indigo-500/10">
                  <item.icon size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-8 mt-12">
          {[
            { value: "94%",  label: "Avg. Improvement" },
            { value: "2.4×", label: "Faster Retention" },
            { value: "12k+", label: "Active Students" },
          ].map((s) => (
            <div key={s.label}>
              <h3
                className="text-[1.9rem] font-black tracking-[-0.03em]"
                style={{ background: "linear-gradient(to right, #a78bfa, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                {s.value}
              </h3>
              <p
                className="text-[0.68rem] tracking-[0.08em] uppercase mt-1 text-muted-foreground/80"
                style={{ fontFamily: "var(--font-jetbrains, monospace)" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div
        className="w-[480px] flex-shrink-0 flex flex-col justify-center px-14 py-14 relative z-10 bg-white/75 dark:bg-[#0a0a12]/75 backdrop-blur-[20px] transition-colors duration-300"
      >
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>

        <div className="mb-8">
          <h2 className="text-[1.75rem] font-black tracking-[-0.03em] mb-1">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-[0.9rem] text-muted-foreground">
            {mode === "login" ? "Sign in to your student account" : "Join the Vision AI student network"}
          </p>
        </div>

        <div className="flex border-b border-black/10 dark:border-white/10 mb-7 transition-colors">
          {(["login", "signup"] as Mode[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`px-5 py-2.5 text-[0.88rem] font-semibold border-b-2 transition-all cursor-pointer bg-transparent ${
                mode === tab 
                  ? "text-foreground border-violet-500" 
                  : "text-muted-foreground border-transparent"
              }`}
            >
              {tab === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <label className="block text-[0.68rem] tracking-[0.1em] uppercase mb-1.5 text-muted-foreground" style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>
                  Full Name
                </label>
                <input required type="text" placeholder="Your full name" className="w-full rounded-xl px-4 py-3.5 text-foreground bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[0.95rem] outline-none transition-all focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]" />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-[0.68rem] tracking-[0.1em] uppercase mb-1.5 text-muted-foreground" style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>
              Email Address
            </label>
            <input required type="email" placeholder="you@example.com" className="w-full rounded-xl px-4 py-3.5 text-foreground bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[0.95rem] outline-none transition-all focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]" />
          </div>

          <div>
            <label className="block text-[0.68rem] tracking-[0.1em] uppercase mb-1.5 text-muted-foreground" style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>
              Password
            </label>
            <input required type="password" placeholder="••••••••" className="w-full rounded-xl px-4 py-3.5 text-foreground bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[0.95rem] outline-none transition-all focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]" />
          </div>

          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <label className="block text-[0.68rem] tracking-[0.1em] uppercase mb-1.5 text-muted-foreground" style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>
                  Confirm Password
                </label>
                <input required type="password" placeholder="••••••••" className="w-full rounded-xl px-4 py-3.5 text-foreground bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[0.95rem] outline-none transition-all focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]" />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-1.5 text-[0.95rem] font-bold tracking-[-0.01em] rounded-full border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.5)]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", color: "#fff", opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? "Entering..." : mode === "login" ? "Initialize Access →" : "Create Account →"}
          </button>
        </form>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mt-7 text-[0.8rem] transition-colors text-muted-foreground hover:text-foreground"
          style={{ fontFamily: "var(--font-jetbrains, monospace)" }}
        >
          <ArrowLeft size={14} />
          Back to Path Selection
        </Link>
      </div>
    </div>
  );
}

