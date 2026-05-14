"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      id="main-nav"
      className={[
        "fixed top-0 left-0 w-full h-[64px] z-[100] flex items-center justify-between px-8",
        "bg-white/82 dark:bg-[rgba(13,13,20,0.85)]",
        "backdrop-blur-xl backdrop-saturate-[180%]",
        "border-b border-black/5 dark:border-white/6",
        "transition-shadow duration-300",
        scrolled ? "shadow-[0_1px_0_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.4)]" : "",
      ].join(" ")}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="relative w-9 h-9 flex items-center justify-center group">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden
            bg-white dark:bg-white/90
            shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.03)]
            dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_4_12px_rgba(0,0,0,0.4)]
            transition-transform duration-300 group-hover:scale-105"
            style={{
              maskImage: "radial-gradient(circle at center, black 60%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(circle at center, black 60%, transparent 100%)",
            }}
          >
            <img
              src="/vision-logo.png"
              alt="VISION logo"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
        </div>
        <span className="text-[1.05rem] font-bold tracking-[-0.03em] text-[var(--foreground)] bg-clip-text">
          VISION
        </span>
      </div>

      {/* Nav links */}
      <ul className="hidden md:flex items-center gap-1">
        {[
          { href: "/#features",     label: "Features" },
          { href: "/#for-students", label: "Students" },
          { href: "/#for-tutors",   label: "Tutors" },
          { href: "/#research",     label: "Research" },
        ].map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="px-[0.85rem] py-[0.4rem] text-[0.875rem] font-medium text-[var(--muted-foreground)] rounded-lg transition-colors hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/6"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/auth/student"
          className="px-[0.85rem] py-[0.4rem] text-[0.875rem] font-medium text-[var(--muted-foreground)] rounded-lg transition-colors hover:text-[var(--foreground)]"
        >
          Log In
        </Link>
      </div>
    </nav>
  );
}
