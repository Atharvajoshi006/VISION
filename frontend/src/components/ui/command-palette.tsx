"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Home, List, BarChart2, User, Moon, Sun, Search, Zap, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

const COMMANDS = [
  { id: "home", label: "Go to Home", icon: <Home size={16} />, action: "nav", target: "/dashboard/student", group: "Navigate" },
  { id: "mylist", label: "My List", icon: <List size={16} />, action: "nav", target: "#", group: "Navigate" },
  { id: "analytics", label: "View Analytics", icon: <BarChart2 size={16} />, action: "nav", target: "#", group: "Navigate" },
  { id: "profile", label: "My Profile", icon: <User size={16} />, action: "nav", target: "#", group: "Navigate" },
  { id: "quantum", label: "Resume: Quantum Mechanics", icon: <BookOpen size={16} />, action: "toast", msg: "▶ Resuming Quantum Mechanics...", group: "Quick Actions" },
  { id: "calculus", label: "Resume: Calculus III", icon: <BookOpen size={16} />, action: "toast", msg: "▶ Resuming Calculus III...", group: "Quick Actions" },
  { id: "focus", label: "Enter Focus Mode", icon: <Zap size={16} />, action: "toast", msg: "⚡ Focus Mode activated", group: "Quick Actions" },
];

interface CommandPaletteProps {
  onToast?: (msg: string) => void;
}

export default function CommandPalette({ onToast }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setSelected(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const groups = [...new Set(filtered.map((c) => c.group))];

  const run = (cmd: typeof COMMANDS[0]) => {
    setOpen(false);
    if (cmd.action === "nav") router.push(cmd.target!);
    if (cmd.action === "toast" && onToast) onToast(cmd.msg!);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") setSelected((s) => Math.min(s + 1, filtered.length - 1));
      if (e.key === "ArrowUp") setSelected((s) => Math.max(s - 1, 0));
      if (e.key === "Enter" && filtered[selected]) run(filtered[selected]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, selected, filtered]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[8000] bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.18, ease: [0.215, 0.61, 0.355, 1] }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[8001] w-full max-w-[560px] mx-4 bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                placeholder="Search commands..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-background/50 px-1.5 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[360px] overflow-y-auto py-2">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No commands found.</p>
              )}
              {groups.map((group) => (
                <div key={group}>
                  <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{group}</p>
                  {filtered
                    .filter((c) => c.group === group)
                    .map((cmd, i) => {
                      const idx = filtered.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => run(cmd)}
                          onMouseEnter={() => setSelected(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            selected === idx
                              ? "bg-primary/10 text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className={selected === idx ? "text-primary" : "text-muted-foreground"}>
                            {cmd.icon}
                          </span>
                          {cmd.label}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground/60">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> select</span>
              <span><kbd className="font-mono">Esc</kbd> close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
