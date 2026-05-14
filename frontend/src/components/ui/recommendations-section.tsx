"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { BookOpen, Star, Clock, ExternalLink, Plus, Video, FileText, Mic, Wrench, ChevronDown } from "lucide-react";
import type { BookItem, ResourceItem } from "@/lib/dashboard-data";
import { RECOMMENDED_BOOKS, RECOMMENDED_RESOURCES } from "@/lib/dashboard-data";
import { useToast } from "@/components/ui/toast";

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

function BookCard({ book, onToast }: { book: BookItem; onToast: (msg: string, type: "success" | "info") => void }) {
  const [saved, setSaved] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="min-w-[200px] max-w-[200px] bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-300 flex flex-col"
    >
      {/* Cover */}
      <div className="relative h-[130px] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] overflow-hidden">
        <img
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Match badge */}
        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30">
          {book.match}
        </span>
        {/* Subject */}
        <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/20">
          {book.subject}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <StarRating rating={book.rating} />
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
          <Clock size={10} />
          {book.readTime}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={() => onToast(`📖 Opening "${book.title}"...`, "info")}
            className="flex-1 text-xs py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors"
          >
            Read
          </button>
          <button
            onClick={() => {
              setSaved(!saved);
              onToast(saved ? `Removed from library` : `✓ "${book.title}" saved to library`, "success");
            }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors border ${
              saved
                ? "bg-[#34d399]/20 border-[#34d399]/30 text-[#34d399]"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            <Plus size={13} className={saved ? "rotate-45 transition-transform" : "transition-transform"} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ResourceCard({ resource, onToast }: { resource: ResourceItem; onToast: (msg: string, type: "success" | "info") => void }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="min-w-[260px] max-w-[260px] bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-300"
    >
      <div className="relative h-[120px] overflow-hidden">
        <img
          src={resource.img}
          alt={resource.title}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span
          className={`absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLORS[resource.type]}`}
        >
          {TYPE_ICONS[resource.type]} {resource.type}
        </span>
        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30">
          {resource.match}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {resource.title}
        </h3>
        <p className="text-xs text-muted-foreground">{resource.source}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock size={10} /> {resource.duration}
          </span>
          <button
            onClick={() => onToast(`→ Opening "${resource.title}"`, "info")}
            className="flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline"
          >
            Open <ExternalLink size={10} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function RecommendationsSection() {
  const { addToast } = useToast();
  const [booksVisible, setBooksVisible] = useState(PAGE_SIZE);
  const [resourcesVisible, setResourcesVisible] = useState(PAGE_SIZE);
  const [booksLoading, setBooksLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // Simulate API load-more (replace with: fetch(`/api/recommendations/books?page=N`))
  const loadMoreBooks = async () => {
    setBooksLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setBooksVisible((v) => Math.min(v + PAGE_SIZE, RECOMMENDED_BOOKS.length));
    setBooksLoading(false);
  };

  const loadMoreResources = async () => {
    setResourcesLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setResourcesVisible((v) => Math.min(v + PAGE_SIZE, RECOMMENDED_RESOURCES.length));
    setResourcesLoading(false);
  };

  const visibleBooks = RECOMMENDED_BOOKS.slice(0, booksVisible);
  const visibleResources = RECOMMENDED_RESOURCES.slice(0, resourcesVisible);

  return (
    <div className="pb-24">
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
          <span className="text-xs text-muted-foreground hidden md:block">
            {visibleBooks.length} of {RECOMMENDED_BOOKS.length}
          </span>
        </div>

        {/* Horizontal scroll row */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          <AnimatePresence>
            {visibleBooks.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i > PAGE_SIZE - 1 ? (i % PAGE_SIZE) * 0.07 : 0 }}
                className="snap-start"
              >
                <BookCard book={book} onToast={addToast} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load More card */}
          {booksVisible < RECOMMENDED_BOOKS.length && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={loadMoreBooks}
              disabled={booksLoading}
              className="min-w-[140px] h-full min-h-[250px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all group snap-start"
            >
              {booksLoading ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <ChevronDown size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Load More</span>
                </>
              )}
            </motion.button>
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
          <span className="text-xs text-muted-foreground hidden md:block">
            {visibleResources.length} of {RECOMMENDED_RESOURCES.length}
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          <AnimatePresence>
            {visibleResources.map((res, i) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i > PAGE_SIZE - 1 ? (i % PAGE_SIZE) * 0.07 : 0 }}
                className="snap-start"
              >
                <ResourceCard resource={res} onToast={addToast} />
              </motion.div>
            ))}
          </AnimatePresence>

          {resourcesVisible < RECOMMENDED_RESOURCES.length && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={loadMoreResources}
              disabled={resourcesLoading}
              className="min-w-[140px] h-full min-h-[200px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all group snap-start"
            >
              {resourcesLoading ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <ChevronDown size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Load More</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
