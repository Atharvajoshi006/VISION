"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Search, Bell, Upload, BarChart3, Users, PlayCircle, Settings, Plus,
  Home, ChevronRight, X, LayoutGrid, AlignJustify, Activity, Sparkles,
  ExternalLink, Trash2, LogOut
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import NotificationDropdown from "@/components/ui/notification-dropdown";
import { useEffect, useState } from "react";
import { supabase, getProfile, signOut } from "@/lib/supabase";
import { useUserStore } from "@/store/use-user-store";

import TelemetryTracker from "@/components/dashboard/telemetry-tracker";
import UploadModal from "@/components/dashboard/upload-modal";
import NeuralPulse from "@/components/dashboard/neural-pulse";
import { TutorEngine, TutorStats, CohortAlert } from "@/lib/ml/tutor-engine";
import VideoPlayerModal from "@/components/dashboard/video-player-modal";

export default function TutorDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [isSplitView, setIsSplitView] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { profile, setProfile } = useUserStore();

  const [stats, setStats] = useState<TutorStats>({
    activeStudents: "0", engagement: "0%", watchTime: "0h", rating: "0/5"
  });
  const [myContent, setMyContent] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<CohortAlert[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [activeVideoTitle, setActiveVideoTitle] = useState("");
  const [activeVideoUrl, setActiveVideoUrl] = useState("");

  const handlePlay = (video: any) => {
    setActiveVideoTitle(video.title);
    setActiveVideoUrl(video.video_url || "");
    setIsPlayerOpen(true);
  };

  const refreshData = async () => {
    setLoading(true);
    const [liveStats, liveContent, liveAlerts] = await Promise.all([
      TutorEngine.getLiveStats(),
      TutorEngine.fetchMyContent(),
      TutorEngine.getCohortAlerts()
    ]);
    setStats(liveStats);
    setMyContent(liveContent);
    setAlerts(liveAlerts);
    setLoading(false);
  };

  useEffect(() => {
    const syncNeuralProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: dbProfile } = await getProfile(session.user.id);
        const registrationName = session.user.user_metadata?.full_name || "Neural Instructor";

        if (dbProfile) {
          const finalProfile = {
            ...dbProfile,
            name: dbProfile.name || registrationName
          };
          setProfile(finalProfile);
          
          if (!dbProfile.name) {
             await supabase.from('profiles').update({ name: registrationName }).eq('id', session.user.id);
          }
        } else {
          setProfile({ name: registrationName, role: "Tutor" });
        }
      }
      refreshData();
    };
    syncNeuralProfile();
  }, [setProfile]);

  const NAV_ITEMS = [
    { icon: <BarChart3 size={22} />, label: "Dashboard", view: "dashboard" },
    { icon: <PlayCircle size={22} />, label: "Content", view: "content" },
    { icon: <Users size={22} />, label: "Students", view: "students" },
    { icon: <Settings size={22} />, label: "Settings", view: "settings" },
  ];

  const STAT_CARDS = [
    { label: "Active Students", value: stats.activeStudents, icon: <Users size={20} />, color: "from-blue-500 to-indigo-600" },
    { label: "Engagement", value: stats.engagement, icon: <Activity size={20} />, color: "from-primary to-purple-600" },
    { label: "Neural Delivery", value: stats.watchTime, icon: <PlayCircle size={20} />, color: "from-amber-500 to-orange-600" },
    { label: "Instructor Rating", value: stats.rating, icon: <Sparkles size={20} />, color: "from-emerald-500 to-teal-600" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex transition-colors duration-300 overflow-x-hidden selection:bg-primary selection:text-white">
      <TelemetryTracker />

      {/* --- PREMIUM BACKGROUND DEPTH --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[50%] bg-primary/5 blur-[100px] rounded-full" />
      </div>
      
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
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4">
          <NotificationDropdown expanded={sidebarExpanded} role="tutor" />
          <div className="flex items-center gap-4 px-2 py-3">
            <div className="min-w-[32px] flex items-center justify-center"><ThemeToggle /></div>
          </div>
          <button 
            onClick={() => signOut()}
            className="flex items-center gap-4 px-2 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all group"
          >
            <div className="min-w-[32px] flex items-center justify-center transition-transform group-hover:scale-110"><LogOut size={22} /></div>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-medium whitespace-nowrap">Sign Out</motion.span>
              )}
            </AnimatePresence>
          </button>
          <button onClick={() => setActiveView("settings")} className="pt-3 border-t border-border flex items-center gap-4 px-2 group w-full text-left">
            <img src={profile?.avatar || "/default-avatar.png"} alt={profile?.name || "Tutor"} className="w-8 h-8 rounded-full border border-border shrink-0 object-cover min-w-[32px] group-hover:scale-110 transition-transform" />
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col overflow-hidden whitespace-nowrap">
                  <span className="text-sm font-bold text-foreground">{profile?.name || "Instructor"}</span>
                  <span className="text-xs text-muted-foreground">{profile?.role || "Educator"}</span>
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
          <h1 className="text-xl font-bold tracking-tight uppercase tracking-[0.2em]">{activeView}</h1>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#f59e0b] to-[#ffca28] text-black px-6 py-2.5 rounded-full text-sm font-black shadow-[0_4px_14px_rgba(255,202,40,0.3)] hover:-translate-y-0.5 transition-all uppercase tracking-widest"
            >
              <Upload size={16} /> Deploy Content
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeView === "dashboard" && (
              <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* Welcome */}
                <div className="mb-10">
                  <h2 className="text-4xl font-black mb-2 tracking-tight">System Status: Optimal</h2>
                  <p className="text-muted-foreground">Instructor Identity: <span className="text-primary font-mono">{profile?.name?.toUpperCase() || "ADMIN"}</span> | All neural nodes active.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {STAT_CARDS.map((stat, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-card/40 backdrop-blur-xl border border-border rounded-[2rem] p-6 shadow-sm hover:border-primary/30 transition-all group overflow-hidden relative"
                    >
                      <div className={`absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-[0.05] group-hover:opacity-[0.15] blur-2xl rounded-full transition-opacity`} />
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-xl shadow-primary/10 transition-transform group-hover:scale-110`}>
                          {stat.icon}
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</div>
                      <div className="text-3xl font-black tracking-tighter">{loading ? "---" : stat.value}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Recent Uploads (Dynamic) */}
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Your Neural Catalog</h3>
                        <button onClick={() => setActiveView("content")} className="text-xs font-black text-primary hover:underline uppercase tracking-widest">Manage All</button>
                      </div>
                      <div className="flex flex-col gap-4">
                        {myContent.slice(0, 3).map((video, i) => (
                          <div key={i} className="flex gap-6 p-6 rounded-[2rem] border border-border bg-card/40 hover:bg-foreground/[0.03] transition-all group relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4">
                               <div className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-black uppercase">{video.subject}</div>
                             </div>
                            <div onClick={() => handlePlay(video)} className="w-48 aspect-video rounded-2xl overflow-hidden shrink-0 relative shadow-2xl cursor-pointer">
                              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlayCircle size={32} color="#fff" />
                              </div>
                            </div>
                            <div className="flex-1 py-1">
                              <h4 className="text-lg font-black mb-2 tracking-tight group-hover:text-primary transition-colors">{video.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{video.description}</p>
                              <div className="flex gap-8">
                                <div>
                                  <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Students</div>
                                  <div className="font-black text-sm">{video.match_percent}% Sync</div>
                                </div>
                                <div>
                                  <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Date</div>
                                  <div className="font-black text-sm">{new Date(video.created_at).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {myContent.length === 0 && !loading && (
                          <div className="p-12 text-center border-2 border-dashed border-border rounded-[2rem] text-muted-foreground">
                            No content found. Start by deploying your first module.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Cohort Alerts (Dynamic) */}
                    <div className="border border-border rounded-[2.5rem] bg-card/60 backdrop-blur-xl p-8 shadow-sm">
                      <h3 className="font-black text-sm mb-8 flex items-center justify-between uppercase tracking-widest text-muted-foreground">
                        Cohort Intelligence
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      </h3>
                      <div className="space-y-4">
                        {alerts.map((alert, i) => (
                          <div key={i} className={`p-6 rounded-2xl border ${alert.severity === "High" ? "border-red-500/20 bg-red-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                            <h4 className={`font-black text-xs uppercase mb-2 ${alert.severity === "High" ? "text-red-500" : "text-amber-500"}`}>{alert.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-4">{alert.message}</p>
                            <button className="w-full py-2.5 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition">
                              Intervene Now
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-border rounded-[2.5rem] bg-primary/5 p-8 relative overflow-hidden group">
                       <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
                       <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-primary mb-4">Neural Suggestion</h3>
                       <p className="text-sm italic text-muted-foreground leading-relaxed relative z-10">
                         "Based on your cohort's performance, adding a conceptual bridge for {myContent[0]?.subject || "advanced topics"} could improve retention by 18%."
                       </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === "content" && (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex justify-between items-end">
                   <h2 className="text-3xl font-black tracking-tight uppercase">Neural Catalog</h2>
                   <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{myContent.length} Modules Online</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {myContent.map((video, i) => (
                     <div key={i} className="bg-card border border-border rounded-3xl overflow-hidden group hover:border-primary/50 transition-all shadow-lg">
                        <div onClick={() => handlePlay(video)} className="aspect-video relative overflow-hidden cursor-pointer">
                           <img src={video.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle size={48} className="text-white" />
                           </div>
                           <div className="absolute top-4 left-4">
                              <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">{video.subject}</span>
                           </div>
                        </div>
                        <div className="p-6">
                           <h4 className="font-black text-lg mb-2 tracking-tight truncate">{video.title}</h4>
                           <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">{video.description}</p>
                           <div className="flex items-center justify-between pt-6 border-t border-border/50">
                              <div className="flex gap-4">
                                 <button className="text-muted-foreground hover:text-primary transition-colors"><ExternalLink size={18} /></button>
                                 <button className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                              </div>
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{video.match_percent}% Accuracy</span>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            {activeView === "students" && (
              <motion.div key="students" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
                 <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <Users size={40} />
                 </div>
                 <h2 className="text-3xl font-black mb-4">Cohort Management</h2>
                 <p className="text-muted-foreground max-w-md mb-8">Access detailed cognitive maps and individual performance telemetry for all 1,248 students in your network.</p>
                 <button className="bg-foreground text-background px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition shadow-xl">Launch Student Mesh</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Upload Modal (Real-time Sync) */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={() => {
           refreshData();
           setActiveView("content");
        }}
      />

      <VideoPlayerModal 
        isOpen={isPlayerOpen} 
        onClose={() => setIsPlayerOpen(false)} 
        videoTitle={activeVideoTitle} 
        videoUrl={activeVideoUrl}
      />
    </div>
  );
}

function SparklesIcon(props: any) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>;
}

function ArrowRightIcon(props: any) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
}
