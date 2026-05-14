"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Bell, Upload, BarChart3, Users, PlayCircle, Settings, Plus } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

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
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-[0_4px_16px_rgba(255,202,40,0.2)]" style={{ background: "linear-gradient(135deg, #f59e0b, #ffca28)" }}>
              <svg width="14" height="14" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16L20 24L12 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24 32H36" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold tracking-tight">Vision AI Tutor</span>
          </Link>
        </div>
        
        <div className="px-4 flex-1">
          <nav className="flex flex-col gap-2 mt-4">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#ffca28]/10 text-[#f59e0b] dark:text-[#ffca28] font-medium border border-[#ffca28]/20">
              <BarChart3 size={18} /> Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 font-medium transition-colors">
              <PlayCircle size={18} /> Content Library
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 font-medium transition-colors">
              <Users size={18} /> Cohort Progress
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 font-medium transition-colors">
              <Settings size={18} /> Settings
            </a>
          </nav>
        </div>

        <div className="p-6 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 border border-border"></div>
            <div>
              <div className="text-sm font-bold">Prof. Sarah J.</div>
              <div className="text-xs text-muted-foreground">Physics Dept</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="h-20 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <h1 className="text-xl font-bold tracking-tight">Overview</h1>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Search students, modules..." className="bg-foreground/5 border border-border rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#ffca28] w-64 transition-colors text-foreground" />
            </div>
            <Bell size={20} className="text-muted-foreground hover:text-foreground cursor-pointer transition" />
            <button className="flex items-center gap-2 bg-gradient-to-r from-[#f59e0b] to-[#ffca28] text-black px-4 py-2 rounded-full text-sm font-bold shadow-[0_4px_14px_rgba(255,202,40,0.3)] hover:-translate-y-0.5 transition-transform">
              <Upload size={16} /> Upload Video
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Welcome */}
          <div className="mb-10">
            <h2 className="text-3xl font-black mb-2">Welcome back, Sarah.</h2>
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
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
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
                  <a href="#" className="text-sm text-[#f59e0b] dark:text-[#ffca28] hover:underline">View all</a>
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
                <h3 className="font-bold text-lg mb-6">AI Insights</h3>
                <div className="relative p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full"></div>
                  <SparklesIcon className="text-amber-600 dark:text-[#ffca28] mb-3" />
                  <p className="text-sm leading-relaxed text-foreground/80">
                    Based on your recent uploads, creating a bridge course between Machine Learning and Vector Calculus could increase platform engagement by an estimated 24%.
                  </p>
                  <button className="mt-4 text-xs font-bold text-amber-600 dark:text-[#ffca28] flex items-center gap-1 hover:underline">
                    Explore Topic <ArrowRightIcon size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SparklesIcon(props: any) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>;
}

function ArrowRightIcon(props: any) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
}
