"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";

const PlasmaCanvas = dynamic(
  () => import("@/components/hero/plasma-canvas"),
  { ssr: false }
);

const ease = [0.215, 0.61, 0.355, 1] as [number, number, number, number];

export default function HeroSection() {
  return (
    <>
      <section
        className="hero-section relative min-h-screen flex flex-col items-center justify-start overflow-hidden"
        id="hero"
        style={{
          paddingTop: "calc(64px + 80px)",
          paddingBottom: 0,
          background: "linear-gradient(160deg, #eef2ff 0%, #f5f5f7 40%, #ede9fe 100%)",
          contain: "paint layout",
        }}
      >
        {/* Dark mode override */}
        <style>{`body.dark .hero-section { background: #0d0d14 !important; }`}</style>

        {/* Plasma WebGL canvas */}
        <PlasmaCanvas />

        {/* Gradient blobs */}
        <div
          className="blob-animate-1 absolute rounded-full pointer-events-none z-0"
          style={{ width: 600, height: 600, background: "radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)", top: -80, left: -100, filter: "blur(80px)" }}
        />
        <div
          className="blob-animate-2 absolute rounded-full pointer-events-none z-0"
          style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)", top: 60, right: -80, filter: "blur(80px)" }}
        />
        <div
          className="blob-animate-3 absolute rounded-full pointer-events-none z-0"
          style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)", bottom: "20%", left: "30%", filter: "blur(80px)" }}
        />

        {/* Hero content */}
        <div className="relative z-[2] flex flex-col items-center text-center max-w-[680px] px-6">
          {/* App icon */}
          <motion.div
            id="hero-icon"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: [40, 0], 
              scale: 1,
            }}
            transition={{ 
              duration: 0.8, 
              ease: [0.16, 1, 0.3, 1], // Custom ultra-smooth ease
            }}
            className="relative w-[100px] h-[100px] flex items-center justify-center mb-8 group"
          >
            {/* Continuous subtle float for "actual motion" feel */}
            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-white dark:bg-white/5 rounded-[2.5rem] blur-2xl opacity-40 dark:opacity-10 scale-110" />
              
              <div className="relative w-[88px] h-[88px] rounded-3xl flex items-center justify-center overflow-hidden
                bg-white dark:bg-white/95
                shadow-[0_8px_30px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)]
                dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_20_40px_rgba(0,0,0,0.4)] transition-transform group-hover:scale-105"
                style={{
                  maskImage: "radial-gradient(circle at center, black 55%, transparent 100%)",
                  WebkitMaskImage: "radial-gradient(circle at center, black 55%, transparent 100%)",
                }}
              >
                <img
                  src="/vision-logo.png"
                  alt="VISION logo"
                  className="w-[72px] h-[72px] object-contain mix-blend-multiply"
                />
              </div>
            </motion.div>
          </motion.div>

          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-extrabold tracking-[-0.04em] leading-none mb-5 text-[var(--foreground)]"
            style={{ fontSize: "clamp(3.5rem, 8vw, 5.5rem)", fontFamily: 'var(--font-vision)', letterSpacing: '0.02em' }}
          >
            VISION
          </motion.h1>

          <motion.p
            id="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[1.2rem] font-normal text-[var(--muted-foreground)] leading-[1.6] max-w-[520px] mb-8"
          >
            A cognitive learning agent that helps you learn and grow with AI — personalised to you.
          </motion.p>

          <motion.div
            id="hero-actions"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.40, delay: 0.18, ease }}
          >
            <Link
              id="get-started-btn"
              href="/auth"
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#1a1a1a] text-white text-[0.9rem] font-semibold rounded-full border-none cursor-pointer transition-all hover:bg-[#333] hover:-translate-y-px dark:bg-[#f0f0f8] dark:text-[#111118] dark:hover:bg-white"
            >
              Get Started for Free ↗
            </Link>
          </motion.div>
        </div>

        {/* Terminal mockup */}
        <motion.div
          id="hero-mockup"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22, ease }}
          className="relative z-[3] w-full max-w-[820px] mt-14 px-6"
        >
          <div
            className="rounded-t-2xl border overflow-hidden"
            style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 -4px 24px rgba(0,0,0,0.06), 0 32px 80px rgba(0,0,0,0.18)" }}
          >
            {/* Shell header */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.06)" }}>
              <span className="w-3 h-3 rounded-full bg-[#ff5f57] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#28c840] inline-block" />
              <span className="ml-2 font-mono text-[0.75rem] text-white/30">Vision AI — Adaptive Session</span>
            </div>
            {/* Shell body */}
            <div className="p-5 flex flex-col gap-2.5">
              <div className="terminal-line">
                <span className="t-prompt">vision</span>
                <span className="t-cmd"> &gt; Analyzing your learning profile...</span>
              </div>
              <div className="terminal-line t-delay-1">
                <span className="t-green">✓</span>
                <span className="t-dim"> Knowledge gap detected in <strong>Calculus – Integration</strong></span>
              </div>
              <div className="terminal-line t-delay-2">
                <span className="t-green">✓</span>
                <span className="t-dim"> Optimal study window: <strong>60 min, high focus mode</strong></span>
              </div>
              <div className="terminal-line t-delay-3">
                <span className="t-blue">→</span>
                <span className="t-dim"> Building personalized lesson plan...</span>
              </div>
              <div className="terminal-line t-delay-4">
                <span className="t-prompt">vision</span>
                <span className="t-cmd"> &gt; </span>
                <span className="terminal-cursor" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}
