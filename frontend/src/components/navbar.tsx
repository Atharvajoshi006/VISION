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
      <div className="text-[1.1rem] font-bold tracking-[-0.02em] text-[var(--foreground)]">
        Vision AI
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
