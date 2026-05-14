"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, BookOpen, CheckCircle2, Zap, X } from "lucide-react";
import { useState } from "react";

const NOTIFICATIONS = [
  {
    id: 1,
    icon: <BookOpen size={14} className="text-[#a78bfa]" />,
    title: "New module unlocked",
    desc: "Wave Function Collapse is now available in Quantum Mechanics.",
    time: "2m ago",
    unread: true,
  },
  {
    id: 2,
    icon: <CheckCircle2 size={14} className="text-[#34d399]" />,
    title: "Quiz completed",
    desc: "You scored 94% on Calculus III: Vector Analysis.",
    time: "1h ago",
    unread: true,
  },
  {
    id: 3,
    icon: <Zap size={14} className="text-amber-400" />,
    title: "Streak reminder",
    desc: "Keep your 7-day learning streak going! Study for 15 more minutes.",
    time: "3h ago",
    unread: false,
  },
];

interface NotificationDropdownProps {
  expanded: boolean;
}

export default function NotificationDropdown({ expanded }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<number[]>([]);

  const unreadCount = NOTIFICATIONS.filter(
    (n) => n.unread && !dismissed.includes(n.id)
  ).length;

  const visible = NOTIFICATIONS.filter((n) => !dismissed.includes(n.id));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-4 px-2 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all cursor-pointer group w-full"
      >
        <div className="min-w-[32px] flex items-center justify-center group-hover:scale-110 transition-transform relative">
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#a78bfa] text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-medium whitespace-nowrap"
            >
              Notifications
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.215, 0.61, 0.355, 1] }}
              className="absolute left-[72px] bottom-0 z-[101] w-[340px] bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h4 className="text-sm font-bold">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="text-[11px] text-[#a78bfa] font-semibold">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {visible.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    All caught up! 🎉
                  </p>
                )}
                {visible.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3.5 border-b border-border last:border-0 group transition-colors hover:bg-white/3 ${
                      n.unread ? "bg-primary/3" : ""
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center shrink-0 mt-0.5">
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {n.desc}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                    </div>
                    <button
                      onClick={() => setDismissed((d) => [...d, n.id])}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all shrink-0 mt-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
