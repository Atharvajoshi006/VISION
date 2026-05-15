"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Volume2, Settings, Play, Pause } from "lucide-react";
import { useState } from "react";

import { getYouTubeId } from "@/lib/utils";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  videoUrl?: string;
}

export default function VideoPlayerModal({ isOpen, onClose, videoTitle, videoUrl }: VideoPlayerModalProps) {
  const [playing, setPlaying] = useState(true);
  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-5xl aspect-video bg-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-primary/20"
          >
            {/* Header */}
            <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Now Streaming Neural Module</span>
                <h3 className="text-xl font-bold text-white">{videoTitle}</h3>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors text-white">
                <X size={24} />
              </button>
            </div>

            {/* Video Content */}
            <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center relative group">
              {youtubeId ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={videoTitle}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <img 
                    src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2000&auto=format&fit=crop" 
                    className="w-full h-full object-cover opacity-40 grayscale"
                    alt="Video Backdrop"
                  />
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPlaying(!playing)}
                      className="w-20 h-20 rounded-full bg-primary/20 border border-primary/50 backdrop-blur-md flex items-center justify-center text-primary"
                    >
                      {playing ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </motion.button>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 inset-x-0 p-6 pt-10 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="h-1 w-full bg-white/20 rounded-full mb-4 overflow-hidden relative">
                      <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "45%" }}
                        className="absolute inset-y-0 left-0 bg-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between text-white/70 text-xs font-bold tabular-nums">
                      <div className="flex items-center gap-6">
                        <span>12:45 / 28:00</span>
                        <Volume2 size={16} />
                      </div>
                      <div className="flex items-center gap-6">
                        <Settings size={16} />
                        <Maximize2 size={16} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
