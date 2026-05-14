"use client";

import { motion } from "framer-motion";
import { Activity, Clock, TrendingUp, Zap, Target, BookOpen, BarChart2 } from "lucide-react";
import { useUserStore } from "@/store/use-user-store";

const SUBJECTS = [
  { label: "Physics", pct: 82, color: "#a78bfa" },
  { label: "CS", pct: 67, color: "#6366f1" },
  { label: "Biology", pct: 45, color: "#34d399" },
  { label: "Math", pct: 91, color: "#f59e0b" },
];

const STREAK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const STREAK_ACTIVE = [true, true, true, true, false, false, false];

const WEEKLY_HOURS = [2.5, 3.0, 1.5, 4.0, 2.0, 0, 0];
const MAX_HOURS = 5;

export default function AnalyticsView() {
  const { profile, savedCourses } = useUserStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-12 pb-24 px-8 md:px-12"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#6366f1]/15 flex items-center justify-center text-[#6366f1]">
          <BarChart2 size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Your cognitive performance overview</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Clock size={18} />, label: "Study Time", value: profile.studyTime, color: "#a78bfa" },
          { icon: <TrendingUp size={18} />, label: "Retention", value: profile.retention, color: "#34d399" },
          { icon: <Activity size={18} />, label: "Capacity", value: profile.cognitiveCapacity, color: "#6366f1" },
          { icon: <BookOpen size={18} />, label: "Saved", value: `${savedCourses.length} courses`, color: "#f59e0b" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Weekly hours bar chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Zap size={14} className="text-[#a78bfa]" /> Daily Study Hours
          </h3>
          <div className="flex items-end gap-3 h-28">
            {WEEKLY_HOURS.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">{h > 0 ? `${h}h` : ""}</span>
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  style={{ height: `${(h / MAX_HOURS) * 80}%`, originY: 1, background: h > 0 ? "linear-gradient(180deg,#a78bfa,#7c3aed)" : undefined }}
                  className={`w-full rounded-t-md ${h === 0 ? "bg-border h-1" : ""}`}
                />
                <span className="text-[10px] text-muted-foreground">{STREAK_DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject breakdown */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Activity size={14} className="text-[#6366f1]" /> Subject Mastery
          </h3>
          <div className="space-y-3">
            {SUBJECTS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-14">{s.label}</span>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: s.color }}
                  />
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color: s.color }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Streak */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Zap size={14} className="text-amber-400" /> Weekly Streak
          </h3>
          <div className="flex gap-2 justify-between mb-4">
            {STREAK_DAYS.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${STREAK_ACTIVE[i] ? "bg-[#a78bfa] text-white shadow-[0_0_12px_rgba(167,139,250,0.4)]" : "bg-card border border-border text-muted-foreground"}`}>
                  {STREAK_ACTIVE[i] ? "✓" : ""}
                </div>
                <span className="text-[10px] text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">🔥 <strong className="text-foreground">4-day streak</strong> — study today to keep it going!</p>
        </div>

        {/* Goals */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Target size={14} className="text-[#34d399]" /> Weekly Goals
          </h3>
          <div className="space-y-3">
            {[
              { label: "Study 10h", done: true },
              { label: "Complete 3 modules", done: true },
              { label: "Score 90%+ on quiz", done: false },
              { label: "Read 1 recommended book", done: false },
            ].map((g, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${g.done ? "bg-[#34d399] border-[#34d399]" : "border-border"}`}>
                  {g.done && <span className="text-[8px] text-white font-black">✓</span>}
                </div>
                <span className={`text-sm ${g.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{g.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
