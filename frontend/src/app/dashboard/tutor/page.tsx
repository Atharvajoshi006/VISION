"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { 
  Search, Bell, Upload, BarChart3, Users, PlayCircle, Settings, Plus,
  Home, ChevronRight, X, LayoutGrid, AlignJustify
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import NotificationDropdown from "@/components/ui/notification-dropdown";

const STATS = [
  { label: "Active Students", value: "1,248", change: "+12%" },
  { label: "Avg Engagement", value: "84%", change: "+5%" },
  { label: "Total Watch Time", value: "3.2k hrs", change: "+18%" },
  { label: "Course Rating", value: "4.9/5", change: "0%" },
];

const RECENT_VIDEOS = [
  { title: "Advanced Quantum Mechanics - Ep 4", views: "1.2k", engagement: "94%", date: "2 days ago", img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop" },
  { title: "Calculus III: Vector Analysis", views: "840", engagement: "88%", date: "5 days ago", img: "https://images.unsplash.com/photo-1632516643720-e7f5d7d6eba1?q=80&w=400&auto=format&fit=crop" },
  { title: "Machine Learning Foundations", views: "2.1k", engagement: "96%", date: "1 week ago", img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400&auto=format&fit=crop" },
];

export default function TutorDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [isSplitView, setIsSplitView] = useState(false);

  const NAV_ITEMS = [
    { icon: <BarChart3 size={22} />, label: "Dashboard", view: "dashboard" },
    { icon: <PlayCircle size={22} />, label: "Content", view: "content" },
    { icon: <Users size={22} />, label: "Students", view: "students" },
    { icon: <Settings size={22} />, label: "Settings", view: "settings" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex transition-colors duration-300 overflow-x-hidden selection:bg-[#ffca28] selection:text-black">
      
      {/* Sidebar blur */}
      <AnimatePresence>
        {sidebarExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/20 backdrop-blur-sm"
            onClick={() => setSidebarExpanded(false)} />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.nav
        initial={false}
        animate={{ width: sidebarExpanded ? 260 : 80 }}
        className="fixed left-0 top-0 h-screen z-50 bg-background/80 dark:bg-background/90 backdrop-blur-md border-r border-border flex flex-col justify-between py-6 overflow-visible"
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="flex flex-col gap-6 px-4">
          <Link href="/" className="flex items-center gap-3 px-2 shrink-0 group">
            <div className="min-w-[36px] w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] overflow-hidden transition-transform group-hover:scale-105">
              <img src="/vision-logo.png" alt="VISION logo" className="w-7 h-7 object-contain mix-blend-multiply" />
            </div>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="font-bold tracking-tight whitespace-nowrap uppercase text-[1rem]"
                  style={{ fontFamily: 'var(--font-vision)' }}
                >
                  VISION
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = activeView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => setActiveView(item.view)}
                  className={`flex items-center gap-4 px-2 py-3 rounded-xl transition-all group text-left w-full ${active ? "bg-[#ffca28]/10 text-amber-600 dark:text-[#ffca28]" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                >
                  <div className="min-w-[32px] flex items-center justify-center transition-transform group-hover:scale-110">{item.icon}</div>
                  <AnimatePresence>
                    {sidebarExpanded && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-medium whitespace-nowrap">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ffca28] shrink-0" />}
                </button>
              );
            })}

            <button
              onClick={() => setIsSplitView(!isSplitView)}
              className={`flex items-center gap-4 px-2 py-3 rounded-xl transition-all group ${isSplitView ? "text-amber-600 dark:text-[#ffca28] bg-amber-500/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
            >
              <div className="min-w-[32px] flex items-center justify-center transition-transform group-hover:scale-110">
                <ChevronRight size={22} className={`transition-transform ${isSplitView ? "rotate-180" : ""}`} />
              </div>
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-medium whitespace-nowrap">
                    AI Command
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4">
          <NotificationDropdown expanded={sidebarExpanded} role="tutor" />
          <div className="flex items-center gap-4 px-2 py-3">
            <div className="min-w-[32px] flex items-center justify-center"><ThemeToggle /></div>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium whitespace-nowrap text-muted-foreground">Theme</motion.span>
              )}
            </AnimatePresence>
          </div>
          <button className="pt-3 border-t border-border flex items-center gap-4 px-2 group w-full text-left">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 border border-border shrink-0 min-w-[32px] group-hover:scale-110 transition-transform"></div>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col overflow-hidden whitespace-nowrap">
                  <span className="text-sm font-bold text-foreground">Prof. Sarah J.</span>
                  <span className="text-xs text-muted-foreground">Physics Dept</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.nav>

      {/* ── Main Content ── */}
      <main className={`flex-1 ml-[80px] transition-all duration-500 ${isSplitView ? "pr-[320px]" : ""}`}>
        {/* Header */}
        <header className="h-20 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <h1 className="text-xl font-bold tracking-tight">Overview</h1>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Search students, modules..." className="bg-foreground/5 border border-border rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#ffca28] w-64 transition-colors text-foreground" />
            </div>
            <button className="flex items-center gap-2 bg-gradient-to-r from-[#f59e0b] to-[#ffca28] text-black px-4 py-2 rounded-full text-sm font-bold shadow-[0_4px_14px_rgba(255,202,40,0.3)] hover:-translate-y-0.5 transition-transform">
              <Upload size={16} /> Upload Video
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Welcome */}
          <div className="mb-10">
            <h2 className="text-4xl font-black mb-2 tracking-tight">Welcome back, Sarah.</h2>
            <p className="text-muted-foreground">Here's what's happening in your cognitive cohorts today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {STATS.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-black">{stat.value}</div>
                  <div className={`text-sm font-bold ${stat.change.startsWith('+') ? 'text-[#34d399]' : 'text-muted-foreground'}`}>
                    {stat.change}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Upload & Recent Videos */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Upload Zone */}
              <div className="border border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-foreground/[0.02] hover:bg-foreground/[0.04] hover:border-[#ffca28]/50 transition-colors cursor-pointer group">
                <div className="w-16 h-16 rounded-full bg-[#ffca28]/10 flex items-center justify-center text-[#f59e0b] dark:text-[#ffca28] mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={28} />
                </div>
                <h3 className="text-lg font-bold mb-2">Drag & drop to upload new content</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">Upload cinematic lectures, interactive modules, or VR cognitive environments.</p>
                <button className="px-6 py-2.5 rounded-full border border-border font-medium text-sm hover:bg-foreground/5 transition">
                  Browse Files
                </button>
              </div>

              {/* Recent Content */}
              <div>
                <div className="flex justify-between items-end mb-6">
                  <h3 className="text-xl font-bold">Recent Uploads</h3>
                  <a href="#" className="text-sm text-amber-600 dark:text-[#ffca28] hover:underline">View all</a>
                </div>
                <div className="flex flex-col gap-4">
                  {RECENT_VIDEOS.map((video, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:bg-foreground/[0.02] transition shadow-sm group">
                      <div className="w-40 aspect-video rounded-lg overflow-hidden shrink-0 relative">
                        <img src={video.img} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle size={24} color="#fff" />
                        </div>
                      </div>
                      <div className="flex-1 py-1">
                        <h4 className="font-bold mb-1">{video.title}</h4>
                        <div className="text-xs text-muted-foreground mb-3">{video.date}</div>
                        <div className="flex gap-6">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Views</div>
                            <div className="font-semibold text-sm">{video.views}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Engagement</div>
                            <div className="font-semibold text-sm text-[#34d399]">{video.engagement}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Cohort Analytics */}
            <div className="flex flex-col gap-8">
              <div className="border border-border rounded-2xl bg-card p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-6 flex items-center justify-between">
                  Cohort Needs Attention
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                    <h4 className="font-bold text-sm text-red-600 dark:text-red-400 mb-1">Calculus III Cohort</h4>
                    <p className="text-xs text-muted-foreground mb-3">54% of students are showing cognitive overload on "Vector Fields".</p>
                    <button className="text-xs font-bold text-background bg-foreground px-3 py-1.5 rounded hover:opacity-90 transition">
                      Generate Remedial Module
                    </button>
                  </div>
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400 mb-1">Physics 101</h4>
                    <p className="text-xs text-muted-foreground mb-3">Engagement dropped by 12% in the last lecture. Consider interactive review.</p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-2xl bg-card p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-6 text-foreground">AI Insights</h3>
                <div className="relative p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full"></div>
                  <div className="flex gap-1 mb-3 text-amber-600 dark:text-[#ffca28]">
                    <Plus size={16} />
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80 italic">
                    "Based on your recent uploads, creating a bridge course between Machine Learning and Vector Calculus could increase platform engagement by an estimated 24%."
                  </p>
                  <button className="mt-4 text-xs font-bold text-amber-600 dark:text-[#ffca28] flex items-center gap-1 hover:underline">
                    Explore Topic <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Command Center (Parity with Student) ── */}
      <AnimatePresence>
        {isSplitView && (
          <motion.div initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
            className="fixed right-0 top-0 w-[320px] h-screen bg-card/40 backdrop-blur-xl border-l border-border z-40 p-6 pt-8 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">AI Command Center</h3>
              <button onClick={() => setIsSplitView(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <h4 className="text-xs font-bold text-amber-600 dark:text-[#ffca28] mb-2 uppercase tracking-wider">Cohort Health</h4>
                <p className="text-sm text-muted-foreground italic leading-relaxed">"Calculus III cohort is 15% ahead of schedule. Consider introducing Advanced Vector Tensors."</p>
              </div>
              {/* Add more AI center items here */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function SparklesIcon(props: any) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>;
}

function ArrowRightIcon(props: any) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
}
