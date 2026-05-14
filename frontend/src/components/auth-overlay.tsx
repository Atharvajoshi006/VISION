"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { X, GraduationCap, Presentation } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

interface AuthOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthOverlay({ isOpen, onClose }: AuthOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xl"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="absolute top-6 right-8 flex items-center gap-6">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl transition-colors bg-transparent border-none cursor-pointer"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>

          <div className="text-center max-w-[680px] w-full px-8">
            <h2 className="text-[2.5rem] font-extrabold text-foreground tracking-[-0.03em] mb-3">
              Choose your path
            </h2>
            <p className="text-muted-foreground text-base mb-10">
              Select your role to enter the VISION network.
            </p>

            <div className="flex gap-6 justify-center flex-wrap">
              {[
                {
                  id: "auth-student",
                  href: "/auth/student",
                  icon: <GraduationCap size={48} className="text-primary mb-2" />,
                  title: "Student",
                  desc: "Enter the adaptive learning environment.",
                  delay: 0,
                },
                {
                  id: "auth-tutor",
                  href: "/auth/tutor",
                  icon: <Presentation size={48} className="text-primary mb-2" />,
                  title: "Tutor",
                  desc: "Access the cognitive dashboard & manage content.",
                  delay: 0.12,
                },
              ].map((card) => (
                <motion.div
                  key={card.id}
                  id={card.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: card.delay + 0.1, ease: [0.215, 0.61, 0.355, 1] }}
                >
                  <Link
                    href={card.href}
                    className="flex-1 min-w-[200px] bg-card/50 border border-border backdrop-blur-xl rounded-2xl py-10 px-8 text-foreground flex flex-col items-center gap-3 transition-all duration-300 hover:bg-card hover:border-primary/50 hover:-translate-y-1.5 block shadow-sm"
                    style={{
                      borderRadius: 20,
                      padding: "2.5rem 2rem",
                    }}
                  >
                    <div>{card.icon}</div>
                    <h3 className="text-[1.4rem] font-bold">{card.title}</h3>
                    <p className="text-sm text-muted-foreground text-center leading-relaxed">{card.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
