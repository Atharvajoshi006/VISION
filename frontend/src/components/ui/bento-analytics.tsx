"use client";

import { Activity, Zap, Clock, TrendingUp, Target, BookOpen } from "lucide-react";
import { useUserStore } from "@/store/use-user-store";

const SUBJECTS = [
  { label: "Physics", pct: 82, color: "#a78bfa" },
  { label: "CS", pct: 67, color: "#6366f1" },
  { label: "Biology", pct: 45, color: "#34d399" },
  { label: "Math", pct: 91, color: "#f59e0b" },
];

const STREAK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const STREAK_ACTIVE = [true, true, true, true, false, false, false];

export default function BentoAnalytics() {
  const { profile } = useUserStore();

  return (
    <div className="px-8 md:px-12 pb-20">
      <h2 className="text-xl font-bold mb-6 text-foreground tracking-tight">Your Learning Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Cognitive Capacity — wide card */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 flex items-center justify-center text-[#a78bfa]">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cognitive Capacity</p>
                <p className="text-base font-bold text-[#34d399]">{profile.cognitiveCapacity}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{profile.name}</p>
            </div>
          </div>

          {/* Subject bars */}
          <div className="space-y-2.5">
            {SUBJECTS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">{s.label}</span>
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.pct}%`, background: s.color }}
                  />
                </div>
                <span className="text-xs font-semibold text-muted-foreground w-7 text-right">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats column */}
        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 flex items-center justify-center text-[#a78bfa]">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#a78bfa]">{profile.studyTime}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Study Time</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#34d399]/15 flex items-center justify-center text-[#34d399]">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#34d399]">{profile.retention}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Retention</p>
            </div>
          </div>
        </div>

        {/* Streak card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-amber-400" />
            <p className="text-sm font-bold">Weekly Streak</p>
          </div>
          <div className="flex gap-2 justify-between">
            {STREAK_DAYS.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    STREAK_ACTIVE[i]
                      ? "bg-[#a78bfa] text-white shadow-[0_0_12px_rgba(167,139,250,0.4)]"
                      : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  {STREAK_ACTIVE[i] ? "✓" : ""}
                </div>
                <span className="text-[10px] text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            🔥 <strong className="text-foreground">4-day streak</strong> — keep it up!
          </p>
        </div>

        {/* Goals card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-[#6366f1]" />
            <p className="text-sm font-bold">Weekly Goals</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Study 10h", done: true },
              { label: "Complete 3 modules", done: true },
              { label: "Score 90%+ on quiz", done: false },
            ].map((g, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    g.done
                      ? "bg-[#34d399] border-[#34d399]"
                      : "border-border"
                  }`}
                >
                  {g.done && <span className="text-[8px] text-white font-bold">✓</span>}
                </div>
                <span className={`text-sm ${g.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {g.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modules progress */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-[#a78bfa]" />
            <p className="text-sm font-bold">Active Modules</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Quantum Mechanics", pct: 62 },
              { label: "Calculus III", pct: 75 },
              { label: "ML Foundations", pct: 30 },
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground truncate">{m.label}</span>
                  <span className="text-[#a78bfa] font-semibold ml-2">{m.pct}%</span>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${m.pct}%`,
                      background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* View Full Analytics CTA */}
      <button className="mt-6 px-6 py-3 rounded-full bg-foreground/5 border border-border hover:bg-foreground/10 font-medium text-sm transition w-full">
        View Full Analytics Dashboard →
      </button>
    </div>
  );
}
