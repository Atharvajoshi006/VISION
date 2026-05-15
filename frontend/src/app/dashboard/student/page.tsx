"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import Link from "next/link";
import {
  Play, Info, Brain, Home, List, BarChart2, User,
  ChevronRight, X, Plus, Clock, Search, ChevronDown,
  LayoutGrid, AlignJustify, LogOut,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { useUserStore } from "@/store/use-user-store";
import NeuralHeroCanvas from "@/components/neural-hero-canvas";
import NotificationDropdown from "@/components/ui/notification-dropdown";
import CommandPalette from "@/components/ui/command-palette";
import RecommendationsSection from "@/components/ui/recommendations-section";
import MyListView from "@/components/dashboard/my-list-view";
import AnalyticsView from "@/components/dashboard/analytics-view";
import ProfileView from "@/components/dashboard/profile-view";
import { useToast } from "@/components/ui/toast";
import { MASTER_FEATURED, NEURAL_CATALOG } from "@/lib/dashboard-data";
import type { CourseItem } from "@/lib/dashboard-data";
import { RecommenderEngine } from "@/lib/ml/recommender-engine";
import NeuralPulse from "@/components/dashboard/neural-pulse";
import VideoPlayerModal from "@/components/dashboard/video-player-modal";
import RemedialRoadmap from "@/components/dashboard/remedial-roadmap";
import NeuralActivityGraph, { GlobalLiveFeed, AIQuickStats } from "@/components/dashboard/premium-filler";

const INITIAL_VISIBLE = 4;
const LOAD_MORE_COUNT = 3;

// ─── Course Card ─────────────────────────────────────────────────────────────
function CourseCard({
  item, onPlay, onSave, isSaved, grid,
}: {
  item: CourseItem;
  onPlay: (item: CourseItem) => void;
  onSave: (item: CourseItem) => void;
  isSaved: boolean;
  grid?: boolean;
}) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -5 }}
      className={`relative ${grid ? "w-full" : "min-w-[340px] md:min-w-[380px] shrink-0"} aspect-video rounded-2xl overflow-hidden cursor-pointer group bg-card border border-border/40 hover:border-primary/50 transition-all duration-500 shadow-xl hover:shadow-primary/10`}
    >
      <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      
      {/* Neural Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
      
      <div className="absolute inset-0 p-6 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest">
            {item.match} MATCH
          </div>
          <div className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/70 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
            <Clock size={10} /> {item.duration}
          </div>
        </div>
        
        <h3 className="font-black text-xl text-white mb-2 leading-tight tracking-tight drop-shadow-lg">{item.title}</h3>
        
        <div className="flex gap-1.5 mb-4 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
          {item.tags?.map((t) => (
            <span key={t} className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/50 font-bold uppercase tracking-tighter">{t}</span>
          ))}
        </div>

        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 delay-150">
          <button onClick={() => onPlay(item)} className="h-10 px-6 rounded-xl bg-white text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-primary hover:text-white transition-colors shadow-lg">
            <Play size={12} fill="currentColor" /> Play Module
          </button>
          <button
            onClick={() => onSave(item)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${isSaved ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/20 text-white hover:bg-white/10"}`}
          >
            <Plus size={16} className={isSaved ? "rotate-45" : ""} />
          </button>
        </div>
      </div>

      {item.progress !== undefined && (
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${item.progress}%` }}
            className="h-full bg-gradient-to-r from-primary to-blue-400" 
          />
        </div>
      )}
    </motion.div>
  );
}

// ─── Course Row — horizontal scroll + load more + grid toggle ─────────────────
function CourseRow({ row, onPlay, onSave, isSavedFn }: {
  row: any;
  onPlay: (item: CourseItem) => void;
  onSave: (item: CourseItem) => void;
  isSavedFn: (id: string) => boolean;
}) {
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const [loading, setLoading] = useState(false);
  const [gridView, setGridView] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMore = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setVisible((v) => Math.min(v + LOAD_MORE_COUNT, row.items.length));
    setLoading(false);
  };

  const canLoadMore = visible < row.items.length;
  const shownItems = row.items.slice(0, visible);

  return (
    <div className="mb-20 px-8 md:px-12 relative">
      {/* Row header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">{row.title}</h2>
          <div className="h-1 w-12 bg-primary rounded-full mt-1" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-card border border-border px-3 py-1 rounded-full">
            {visible} <span className="opacity-40">/</span> {row.items.length} Modules
          </div>
          <button
            onClick={() => setGridView(!gridView)}
            className={`p-2 rounded-xl border transition-all ${gridView ? "border-primary text-primary bg-primary/10 shadow-lg shadow-primary/10" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"}`}
          >
            {gridView ? <AlignJustify size={16} /> : <LayoutGrid size={16} />}
          </button>
        </div>
      </div>

      {/* Grid view */}
      {gridView ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {shownItems.map((item: any, j: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: j * 0.05 }}
              >
                <CourseCard item={item} onPlay={onPlay} onSave={onSave} isSaved={isSavedFn(item.id)} grid />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Horizontal scroll view */
        <div ref={scrollRef} className="flex gap-8 overflow-x-auto pb-10 scrollbar-hide snap-x scroll-smooth">
          <AnimatePresence>
            {shownItems.map((item: any, j: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: j * 0.05 }}
                className="snap-start"
              >
                <CourseCard item={item} onPlay={onPlay} onSave={onSave} isSaved={isSavedFn(item.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
          {canLoadMore && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={loadMore}
              disabled={loading}
              className="min-w-[180px] shrink-0 aspect-video rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all group snap-start"
            >
              {loading
                ? <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                : <><div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover:scale-110 transition-transform"><ChevronRight size={24} /></div><span className="text-[10px] font-black uppercase tracking-widest">Load More</span></>}
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
type View = "home" | "mylist" | "analytics" | "profile" | "search";

import TelemetryTracker from "@/components/dashboard/telemetry-tracker";
import { useAutoPredict } from "@/lib/ml/use-auto-predict";

import { useEffect } from "react";
import { supabase, getProfile, signOut } from "@/lib/supabase";

export default function StudentDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const { profile, setProfile, saveCourse, removeCourse, isSaved, activeView, setActiveView, setCommandPaletteOpen } = useUserStore();
  const { addToast } = useToast();

  const [liveCourses, setLiveCourses] = useState<CourseItem[]>([]);
  const [activeVideoUrl, setActiveVideoUrl] = useState("");
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [activeVideoTitle, setActiveVideoTitle] = useState("");

  const handlePlay = (course: any) => {
    setActiveVideoTitle(course.title);
    setActiveVideoUrl(course.video_url || "");
    setIsPlayerOpen(true);
    addToast(`▶ Streaming: ${course.title}`, "success");
  };

  // --- BRAIN SYNC: PERSISTENCE LAYER ---
  useEffect(() => {
    const syncNeuralProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // 1. Fetch Profile
        const { data: dbProfile } = await getProfile(session.user.id);
        
        // Use registration name if DB name is missing
        const registrationName = session.user.user_metadata?.full_name || "Neural Explorer";
        
        if (dbProfile) {
          console.log("[BRAIN] Synchronizing neural state with cloud...");
          // If DB has a generic name but session has a real one, prioritize session
          const finalProfile = {
            ...dbProfile,
            name: dbProfile.name || registrationName
          };
          setProfile(finalProfile);
          
          // Silently update DB if name was missing
          if (!dbProfile.name) {
             await supabase.from('profiles').update({ name: registrationName }).eq('id', session.user.id);
          }
        } else {
          // New profile setup if not exists
          setProfile({ name: registrationName, role: "Student" });
        }
        
        // 2. Fetch Performance History (Real Logs)
        const { data: history } = await supabase
          .from('performance_history')
          .select('*')
          .order('date', { ascending: false });
        
        if (history) {
          // Update global store with live history
          useUserStore.setState({ 
            performanceHistory: history.map(h => ({
              date: h.date,
              marks: h.marks,
              cognitiveLoad: h.cognitive_load_at_time || 0.5,
              focusAreas: h.focus_areas || [],
              subject: h.subject || "General Neural Stream"
            }))
          });
        }

        // 3. Fetch Live Courses from Tutors
        const live = await RecommenderEngine.fetchLiveCourses();
        setLiveCourses(live);
      }
    };
    syncNeuralProfile();
  }, [setProfile]);

  const handleSave = (item: CourseItem) => {
    if (isSaved(item.id)) {
      removeCourse(item.id);
      addToast(`Removed "${item.title}" from My List`, "info");
    } else {
      saveCourse({ ...item, savedAt: new Date().toISOString() });
      addToast(`✓ "${item.title}" added to My List`, "success");
    }
  };

  const NAV_ITEMS: { icon: React.ReactNode; label: string; view: View }[] = [
    { icon: <BarChart2 size={22} />, label: "Analytics", view: "analytics" },
    { icon: <Home size={22} />, label: "Home", view: "home" },
    { icon: <List size={22} />, label: "My List", view: "mylist" },
    { icon: <User size={22} />, label: "Profile", view: "profile" },
  ];

  const analysis = useAutoPredict();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex transition-colors duration-300 selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <TelemetryTracker />

      {/* --- PREMIUM BACKGROUND DEPTH --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[50%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <CommandPalette onToast={(msg) => addToast(msg, "info")} />

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
                  onClick={() => {
                    if (item.view === 'search') {
                      setCommandPaletteOpen(true);
                    } else {
                      setActiveView(item.view);
                    }
                  }}
                  className={`flex items-center gap-4 px-2 py-3 rounded-xl transition-all group text-left w-full ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                >
                  <div className="min-w-[32px] flex items-center justify-center transition-transform group-hover:scale-110">{item.icon}</div>
                  <AnimatePresence>
                    {sidebarExpanded && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-medium whitespace-nowrap">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                </button>
              );
            })}

            <button
              onClick={() => setIsSplitView(!isSplitView)}
              className={`flex items-center gap-4 px-2 py-3 rounded-xl transition-all group ${isSplitView ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
            >
              <div className="min-w-[32px] flex items-center justify-center transition-transform group-hover:scale-110">
                <ChevronRight size={22} className={`transition-transform ${isSplitView ? "rotate-180" : ""}`} />
              </div>
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-medium whitespace-nowrap">
                    Command Center
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {sidebarExpanded && (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all text-xs"
                >
                  <Search size={13} />
                  <span>Commands</span>
                  <kbd className="ml-auto font-mono text-[10px] bg-background/50 border border-border px-1.5 py-0.5 rounded">⌘K</kbd>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4">
          <NotificationDropdown expanded={sidebarExpanded} role="student" />
          <div className="flex items-center gap-4 px-2 py-3">
            <div className="min-w-[32px] flex items-center justify-center"><ThemeToggle /></div>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium whitespace-nowrap text-muted-foreground">Theme</motion.span>
              )}
            </AnimatePresence>
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
          <button
            onClick={() => setActiveView("profile")}
            className="pt-3 border-t border-border flex items-center gap-4 px-2 group w-full text-left"
          >
            <img src={profile.avatar} alt={profile.name} className="w-8 h-8 rounded-full border border-border object-cover min-w-[32px] group-hover:scale-110 transition-transform" />
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col overflow-hidden whitespace-nowrap">
                  <span className="text-sm font-bold text-foreground">{profile.name}</span>
                  <span className="text-xs text-muted-foreground">{profile.role}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.nav>

      {/* ── Main Content ── */}
      <div className={`flex-1 ml-[80px] transition-all duration-500 ${isSplitView ? "pr-[320px]" : ""}`}>
        <AnimatePresence mode="wait">

          {/* HOME VIEW */}
          {activeView === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {/* Hero */}
              <div className="relative h-[85vh] w-full flex items-center px-12 md:px-24 overflow-hidden">
                <NeuralHeroCanvas />
                <div className="absolute inset-0 z-0">
                  <img src={MASTER_FEATURED.img} alt="Hero" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative z-10 max-w-2xl pt-10">
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 text-[#a78bfa]">
                    <Brain size={16} /> Neural Match Series
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black mb-4 leading-[1.1] tracking-[-0.02em]">{MASTER_FEATURED.title}</h1>
                  <div className="flex items-center gap-4 text-sm font-semibold mb-6">
                    <span className="text-[#34d399]">{MASTER_FEATURED.match}</span>
                    <span className="text-muted-foreground">{MASTER_FEATURED.year}</span>
                    <div className="flex gap-2">
                      {MASTER_FEATURED.tags.map((tag) => (
                        <span key={tag} className="border border-border px-2 py-0.5 rounded text-muted-foreground text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-lg text-foreground/80 mb-8 max-w-xl leading-relaxed">{MASTER_FEATURED.description}</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handlePlay(MASTER_FEATURED)} className="flex items-center gap-2 bg-foreground text-background px-8 py-3 rounded-md font-bold text-lg hover:opacity-90 transition-opacity">
                      <Play size={20} fill="currentColor" /> Play
                    </button>
                    <button
                      onClick={() => handleSave({ id: MASTER_FEATURED.id, title: MASTER_FEATURED.title, img: MASTER_FEATURED.img, match: MASTER_FEATURED.match, duration: "9h total", tags: MASTER_FEATURED.tags })}
                      className="flex items-center gap-2 bg-foreground/10 backdrop-blur-md text-foreground px-8 py-3 rounded-md font-bold text-lg hover:bg-foreground/20 transition-colors"
                    >
                      <Info size={20} /> {isSaved(MASTER_FEATURED.id) ? "Saved ✓" : "Add to List"}
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* LIVE GLOBAL FEED */}
              <GlobalLiveFeed />

              {/* Dynamic Roadmap (For Struggling Students) */}
              {analysis?.risk.riskLevel === "Critical" && <RemedialRoadmap />}

              {/* Recommendations (Dynamic AI First) */}
              <RecommendationsSection />

              {/* Course Rows */}
              <div className="relative z-20 pt-8">
                {RecommenderEngine.getDashboardRows(profile, liveCourses).map((row) => (
                  <CourseRow key={row.id} row={row} onPlay={handlePlay} onSave={handleSave} isSavedFn={isSaved} />
                ))}
              </div>
            </motion.div>
          )}

          {/* MY LIST VIEW */}
          {activeView === "mylist" && (
            <motion.div key="mylist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <MyListView />
            </motion.div>
          )}

          {/* ANALYTICS VIEW */}
          {activeView === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AnalyticsView />
            </motion.div>
          )}

          {/* PROFILE VIEW */}
          {activeView === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <ProfileView />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Command Center ── */}
      <AnimatePresence>
        {isSplitView && (
          <motion.div initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
            className="fixed right-0 top-0 w-[320px] h-screen bg-card/40 backdrop-blur-xl border-l border-border z-40 p-6 pt-8 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Command Center</h3>
              <button onClick={() => setIsSplitView(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            
            <NeuralPulse />

            <div className="mt-6 space-y-6">
              <NeuralActivityGraph />
              <AIQuickStats />
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <h4 className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">AI Insight</h4>
                <p className="text-sm text-muted-foreground italic leading-relaxed">"Based on your click patterns, you are processing logic 20% faster than your baseline."</p>
              </div>
            </div>

            <div className="space-y-3 mt-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Recent Activity</h4>
                {[
                  { label: "Completed Quiz #3 — 94%", time: "2h ago" },
                  { label: "Unlocked: Wave Function module", time: "Yesterday" },
                  { label: "7-day streak milestone", time: "3 days ago" },
                ].map((act, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">{act.label}</p>
                      <p className="text-xs text-muted-foreground">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-card border border-border mt-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">Quick Actions</h4>
                <div className="flex flex-col gap-1">
                  {[
                    { label: "Resume Quantum Mechanics", view: "home" as View },
                    { label: "View My List", view: "mylist" as View },
                    { label: "Open Analytics", view: "analytics" as View },
                  ].map((action, i) => (
                    <button key={i} onClick={() => { setActiveView(action.view); setIsSplitView(false); }}
                      className="text-sm text-left px-3 py-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                      → {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <VideoPlayerModal 
          isOpen={isPlayerOpen} 
          onClose={() => setIsPlayerOpen(false)} 
          videoTitle={activeVideoTitle} 
          videoUrl={activeVideoUrl}
        />
      </div>
  );
}
