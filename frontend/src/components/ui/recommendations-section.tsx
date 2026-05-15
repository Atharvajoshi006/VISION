"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  BookOpen, Star, Clock, ExternalLink, Plus, 
  Video, FileText, Mic, Wrench, ChevronDown, Zap 
} from "lucide-react";
import type { BookItem, ResourceItem } from "@/lib/dashboard-data";
import { RECOMMENDED_BOOKS, RECOMMENDED_RESOURCES } from "@/lib/dashboard-data";
import { useToast } from "@/components/ui/toast";
import { useUserStore } from "@/store/use-user-store";
import { RecommenderEngine, Course } from "@/lib/ml/recommender-engine";

const PAGE_SIZE = 3;

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video size={11} />,
  article: <FileText size={11} />,
  podcast: <Mic size={11} />,
  tool: <Wrench size={11} />,
};

const TYPE_COLORS: Record<string, string> = {
  video: "bg-red-500/20 text-red-400",
  article: "bg-blue-500/20 text-blue-400",
  podcast: "bg-green-500/20 text-green-400",
  tool: "bg-amber-500/20 text-amber-400",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={s <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}
        />
      ))}
    </div>
  );
}

function VideoCard({ course, onToast }: { course: Course; onToast: (msg: string, type: "success" | "info") => void }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="min-w-[280px] max-w-[280px] bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-300"
    >
      <div className="relative h-[150px] overflow-hidden">
        <img src={course.img} alt={course.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-md">
          {course.match}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
        <p className="text-[10px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{course.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> {course.duration}</span>
          <button onClick={() => onToast(`▶ Starting "${course.title}"...`, "success")} className="text-[10px] font-bold text-primary hover:underline">Launch Module</button>
        </div>
      </div>
    </motion.div>
  );
}

function BookCard({ book, onToast }: { book: BookItem; onToast: (msg: string, type: "success" | "info") => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="min-w-[200px] max-w-[200px] bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-300 flex flex-col"
    >
      <div className="relative h-[130px] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] overflow-hidden">
        <img src={book.cover} alt={book.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30">{book.match}</span>
        <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/20">{book.subject}</span>
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <StarRating rating={book.rating} />
        <div className="flex gap-2 mt-auto pt-2">
          <button onClick={() => onToast(`📖 Opening "${book.title}"...`, "info")} className="flex-1 text-xs py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors">Read</button>
          <button onClick={() => { setSaved(!saved); onToast(saved ? `Removed from library` : `✓ "${book.title}" saved to library`, "success"); }} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors border ${saved ? "bg-[#34d399]/20 border-[#34d399]/30 text-[#34d399]" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}><Plus size={13} className={saved ? "rotate-45 transition-transform" : "transition-transform"} /></button>
        </div>
      </div>
    </motion.div>
  );
}

function ResourceCard({ resource, onToast }: { resource: ResourceItem; onToast: (msg: string, type: "success" | "info") => void }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="min-w-[260px] max-w-[260px] bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-300"
    >
      <div className="relative h-[120px] overflow-hidden">
        <img src={resource.img} alt={resource.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className={`absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLORS[resource.type]}`}>{TYPE_ICONS[resource.type]} {resource.type}</span>
        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30">{resource.match}</span>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">{resource.title}</h3>
        <p className="text-xs text-muted-foreground">{resource.source}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> {resource.duration}</span>
          <button onClick={() => onToast(`→ Opening "${resource.title}"`, "info")} className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1">Open <ExternalLink size={10} /></button>
        </div>
      </div>
    </motion.div>
  );
}

export default function RecommendationsSection() {
  const { addToast } = useToast();
  const { profile } = useUserStore();
  const [booksVisible, setBooksVisible] = useState(PAGE_SIZE);
  const [resourcesVisible, setResourcesVisible] = useState(PAGE_SIZE);
  const [booksLoading, setBooksLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [liveCourses, setLiveCourses] = useState<any[]>([]);
  const [dynamicVideos, setDynamicVideos] = useState<Course[]>([]);
  const [visibleBooks, setVisibleBooks] = useState<BookItem[]>([]);
  const [visibleResources, setVisibleResources] = useState<ResourceItem[]>([]);

  useEffect(() => {
    const fetchLive = async () => {
      const live = await RecommenderEngine.fetchLiveCourses();
      setLiveCourses(live);
      
      const dynamic = await RecommenderEngine.getRecommendations(profile, live);
      setDynamicVideos(dynamic);
      
      const books = RecommenderEngine.getRecommendedBooks(profile);
      setVisibleBooks(books.slice(0, booksVisible));
      
      const resources = RecommenderEngine.getRecommendedResources(profile);
      setVisibleResources(resources.slice(0, resourcesVisible));
    };
    fetchLive();
  }, [profile, booksVisible, resourcesVisible, liveCourses.length]);

  const totalBooks = RecommenderEngine.getRecommendedBooks(profile).length;
  const totalResources = RecommenderEngine.getRecommendedResources(profile).length;

  const loadMoreBooks = async () => {
    setBooksLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setBooksVisible((v) => Math.min(v + PAGE_SIZE, totalBooks));
    setBooksLoading(false);
  };

  const loadMoreResources = async () => {
    setResourcesLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setResourcesVisible((v) => Math.min(v + PAGE_SIZE, totalResources));
    setResourcesLoading(false);
  };

  return (
    <div className="pb-12">
      {/* ── Neural Match Videos (DYNAMIC AI FIRST) ── */}
      <div className="mb-14 px-8 md:px-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
            <Zap size={16} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Neural Match Videos</h2>
            <p className="text-xs text-muted-foreground">Autonomous recommendations matched to your onboarding goals and interaction history</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          <AnimatePresence>
            {dynamicVideos.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="snap-start"
              >
                <VideoCard course={course} onToast={addToast} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Recommended Books ── */}
      <div className="mb-14 px-8 md:px-12">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/15 flex items-center justify-center text-[#a78bfa]">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Recommended Books</h2>
              <p className="text-xs text-muted-foreground">Curated by Vision AI based on your cognitive profile</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          <AnimatePresence>
            {visibleBooks.map((book, i) => (
              <motion.div key={book.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} className="snap-start">
                <BookCard book={book} onToast={addToast} />
              </motion.div>
            ))}
          </AnimatePresence>
          {booksVisible < totalBooks && (
            <button onClick={loadMoreBooks} disabled={booksLoading} className="min-w-[140px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-all">
              {booksLoading ? <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <><ChevronDown size={20} /><span className="text-xs font-semibold">Load More</span></>}
            </button>
          )}
        </div>
      </div>

      {/* ── Recommended Resources ── */}
      <div className="mb-14 px-8 md:px-12">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6366f1]/15 flex items-center justify-center text-[#6366f1]">
              <ExternalLink size={16} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Resources & Tools</h2>
              <p className="text-xs text-muted-foreground">Videos, articles, podcasts & tools matched to you</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          <AnimatePresence>
            {visibleResources.map((res, i) => (
              <motion.div key={res.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} className="snap-start">
                <ResourceCard resource={res} onToast={addToast} />
              </motion.div>
            ))}
          </AnimatePresence>
          {resourcesVisible < totalResources && (
            <button onClick={loadMoreResources} disabled={resourcesLoading} className="min-w-[140px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-all">
              {resourcesLoading ? <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <><ChevronDown size={20} /><span className="text-xs font-semibold">Load More</span></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
