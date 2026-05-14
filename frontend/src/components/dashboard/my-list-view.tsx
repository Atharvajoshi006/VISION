"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Trash2, BookOpen, List } from "lucide-react";
import { useUserStore } from "@/store/use-user-store";
import { useToast } from "@/components/ui/toast";

export default function MyListView() {
  const { savedCourses, removeCourse } = useUserStore();
  const { addToast } = useToast();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-12 pb-24 px-8 md:px-12"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 flex items-center justify-center text-[#a78bfa]">
          <List size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">My List</h1>
          <p className="text-sm text-muted-foreground">{savedCourses.length} saved course{savedCourses.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {savedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground">
            <BookOpen size={28} />
          </div>
          <p className="text-lg font-bold text-foreground">Your list is empty</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Hover over any course and click the + button to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {savedCourses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                layout
                className="relative group rounded-xl overflow-hidden aspect-video bg-card border border-border hover:border-primary/30 transition-all duration-300 cursor-pointer"
              >
                <img
                  src={course.img}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                  <h3 className="text-sm font-bold text-white mb-1 leading-snug">{course.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[#34d399] text-[10px] font-semibold">{course.match} match</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => addToast(`▶ Starting "${course.title}"...`, "success")}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Play size={12} className="text-black ml-0.5" fill="currentColor" />
                    </button>
                    <button
                      onClick={() => {
                        removeCourse(course.id);
                        addToast(`Removed "${course.title}" from list`, "info");
                      }}
                      className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/40 transition-colors"
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
                {course.progress !== undefined && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                    <div
                      className="h-full"
                      style={{ width: `${course.progress}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)" }}
                    />
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/50 text-white/70">
                    {course.savedAt ? new Date(course.savedAt).toLocaleDateString() : "Saved"}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
