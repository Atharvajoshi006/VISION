"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import Link from "next/link";
import {
  Play, Info, Brain, Home, List, BarChart2, User,
  ChevronRight, X, Plus, Clock, Search, ChevronDown,
  LayoutGrid, AlignJustify,
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
import { FEATURED_COURSE, COURSE_ROWS } from "@/lib/dashboard-data";
import type { CourseItem } from "@/lib/dashboard-data";

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
      whileHover={{ scale: grid ? 1.02 : 1.04, zIndex: 30 }}
      className={`relative ${grid ? "w-full" : "min-w-[300px] md:min-w-[310px] shrink-0"} aspect-video rounded-xl overflow-hidden cursor-pointer group bg-card border border-transparent hover:border-primary/30 transition-all duration-300`}
    >
      <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
        <h3 className="font-bold text-sm text-white mb-1 leading-snug">{item.title}</h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#34d399] text-xs font-semibold">{item.match} match</span>
          <span className="flex items-center gap-1 text-white/60 text-xs"><Clock size={11} />{item.duration}</span>
        </div>
        {item.tags && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {item.tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">{t}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => onPlay(item)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform">
            <Play size={14} className="text-black ml-0.5" fill="currentColor" />
          </button>
          <button
            onClick={() => onSave(item)}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isSaved ? "bg-[#34d399]/20 border-[#34d399]/40" : "bg-white/20 border-white/30 hover:bg-white/30"}`}
          >
            <Plus size={14} className={isSaved ? "text-[#34d399] rotate-45" : "text-white"} />
          </button>
        </div>
      </div>
      {item.progress !== undefined && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div className="h-full" style={{ width: `${item.progress}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)" }} />
        </div>
      )}
    </motion.div>
  );
}

// ─── Course Row — horizontal scroll + load more + grid toggle ─────────────────
function CourseRow({ row, onPlay, onSave, isSavedFn }: {
  row: typeof COURSE_ROWS[0];
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
    await new Promise((r) => setTimeout(r, 500));
    setVisible((v) => Math.min(v + LOAD_MORE_COUNT, row.items.length));
    setLoading(false);
    // After loading, scroll right to show new cards
    setTimeout(() => scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" }), 100);
  };

  const canLoadMore = visible < row.items.length;
  const shownItems = row.items.slice(0, visible);

  return (
    <div className="mb-12 px-8 md:px-12">
      {/* Row header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground tracking-tight">{row.title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{visible} of {row.items.length}</span>
          <button
            onClick={() => setGridView(!gridView)}
            className={`p-1.5 rounded-lg border transition-all ${gridView ? "border-primary/40 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}
            title={gridView ? "Scroll view" : "Grid view"}
          >
            {gridView ? <AlignJustify size={14} /> : <LayoutGrid size={14} />}
          </button>
        </div>
      </div>

      {/* Grid view */}
      {gridView ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {shownItems.map((item, j) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: j * 0.04 }}
              >
                <CourseCard item={item} onPlay={onPlay} onSave={onSave} isSaved={isSavedFn(item.id)} grid />
              </motion.div>
            ))}
          </AnimatePresence>
          {canLoadMore && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={loadMore}
              disabled={loading}
              className="aspect-video rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all group"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                : <><ChevronDown size={18} className="group-hover:scale-110 transition-transform" /><span className="text-xs font-semibold">Load More</span></>}
            </motion.button>
          )}
        </div>
      ) : (
        /* Horizontal scroll view */
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x scroll-smooth">
          <AnimatePresence>
            {shownItems.map((item, j) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: j >= INITIAL_VISIBLE ? (j % LOAD_MORE_COUNT) * 0.06 : 0 }}
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
              className="min-w-[120px] shrink-0 aspect-video rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all group snap-start"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                : <><ChevronDown size={18} className="group-hover:scale-110 transition-transform" /><span className="text-xs font-semibold">Load More</span></>}
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
type View = "home" | "mylist" | "analytics" | "profile";

export default function StudentDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [activeView, setActiveView] = useState<View>("home");
  const { profile, saveCourse, removeCourse, isSaved } = useUserStore();
  const { addToast } = useToast();

  const handlePlay = (item: CourseItem) => addToast(`▶ Starting "${item.title}"...`, "success");

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
    { icon: <Home size={22} />, label: "Home", view: "home" },
    { icon: <List size={22} />, label: "My List", view: "mylist" },
    { icon: <BarChart2 size={22} />, label: "Analytics", view: "analytics" },
    { icon: <User size={22} />, label: "Profile", view: "profile" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-[#a78bfa] selection:text-white transition-colors duration-300 flex">

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
                  onClick={() => setActiveView(item.view)}
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
                  <img src={FEATURED_COURSE.img} alt="Hero" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative z-10 max-w-2xl pt-10">
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest mb-4 text-[#a78bfa]">
                    <Brain size={16} /> Neural Match Series
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black mb-4 leading-[1.1] tracking-[-0.02em]">{FEATURED_COURSE.title}</h1>
                  <div className="flex items-center gap-4 text-sm font-semibold mb-6">
                    <span className="text-[#34d399]">{FEATURED_COURSE.match}</span>
                    <span className="text-muted-foreground">{FEATURED_COURSE.year}</span>
                    <div className="flex gap-2">
                      {FEATURED_COURSE.tags.map((tag) => (
                        <span key={tag} className="border border-border px-2 py-0.5 rounded text-muted-foreground text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-lg text-foreground/80 mb-8 max-w-xl leading-relaxed">{FEATURED_COURSE.description}</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => addToast(`▶ Starting "${FEATURED_COURSE.title}"...`, "success")} className="flex items-center gap-2 bg-foreground text-background px-8 py-3 rounded-md font-bold text-lg hover:opacity-90 transition-opacity">
                      <Play size={20} fill="currentColor" /> Play
                    </button>
                    <button
                      onClick={() => handleSave({ id: FEATURED_COURSE.id, title: FEATURED_COURSE.title, img: FEATURED_COURSE.img, match: FEATURED_COURSE.match, duration: "9h total", tags: FEATURED_COURSE.tags })}
                      className="flex items-center gap-2 bg-foreground/10 backdrop-blur-md text-foreground px-8 py-3 rounded-md font-bold text-lg hover:bg-foreground/20 transition-colors"
                    >
                      <Info size={20} /> {isSaved(FEATURED_COURSE.id) ? "Saved ✓" : "Add to List"}
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Course Rows */}
              <div className="relative z-20 pt-8">
                {COURSE_ROWS.map((row) => (
                  <CourseRow key={row.id} row={row} onPlay={handlePlay} onSave={handleSave} isSavedFn={isSaved} />
                ))}
              </div>

              {/* Recommendations */}
              <RecommendationsSection />
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
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <h4 className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">AI Insight</h4>
                <p className="text-sm text-muted-foreground italic leading-relaxed">"You are 98% matched with Quantum Mechanics. Focus on Wave Function Collapse to reach 100%."</p>
              </div>
              <div className="space-y-3">
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
              <div className="p-4 rounded-xl bg-card border border-border">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
