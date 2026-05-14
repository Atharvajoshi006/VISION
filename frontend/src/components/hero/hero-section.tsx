"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import dynamic from "next/dynamic";
import AuthOverlay from "@/components/auth-overlay";

const PlasmaCanvas = dynamic(
  () => import("@/components/hero/plasma-canvas"),
  { ssr: false }
);

const ease = [0.215, 0.61, 0.355, 1] as [number, number, number, number];

export default function HeroSection() {
  const [authOpen, setAuthOpen] = useState(false);

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
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.70, delay: 0.2, ease }}
            className="w-[72px] h-[72px] rounded-3xl flex items-center justify-center mb-8"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
              boxShadow: "0 8px 32px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 16L20 24L12 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 32H36" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </motion.div>

          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.35, ease }}
            className="font-extrabold tracking-[-0.04em] leading-none mb-5 text-[var(--foreground)]"
            style={{ fontSize: "clamp(3.5rem, 8vw, 5.5rem)" }}
          >
            Vision AI
          </motion.h1>

          <motion.p
            id="hero-subtitle"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.5, ease }}
            className="text-[1.2rem] font-normal text-[var(--muted-foreground)] leading-[1.6] max-w-[520px] mb-8"
          >
            A cognitive learning agent that helps you learn and grow with AI — personalised to you.
          </motion.p>

          <motion.div
            id="hero-actions"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.6, ease }}
          >
            <button
              id="get-started-btn"
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#1a1a1a] text-white text-[0.9rem] font-semibold rounded-full border-none cursor-pointer transition-all hover:bg-[#333] hover:-translate-y-px dark:bg-[#f0f0f8] dark:text-[#111118] dark:hover:bg-white"
            >
              Get Started for Free ↗
            </button>
          </motion.div>
        </div>

        {/* Terminal mockup */}
        <motion.div
          id="hero-mockup"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease }}
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

      <AuthOverlay isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
