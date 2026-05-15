"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getThumbnailUrl } from "@/lib/utils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "CS",
    thumbnail_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop",
    match_percent: 95,
    video_url: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('courses')
        .insert([{
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          thumbnail_url: formData.thumbnail_url,
          match_percent: formData.match_percent,
          video_url: formData.video_url,
          tags: [formData.subject, "New"]
        }]);

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
        setFormData({ title: "", description: "", subject: "CS", thumbnail_url: "", match_percent: 95, video_url: "" });
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to upload content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-foreground/[0.02]">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Upload size={20} className="text-primary" /> Upload Neural Module
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {success ? (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Upload Successful!</h3>
                  <p className="text-muted-foreground text-sm">Your video is now reflecting on the student portals.</p>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Module Title</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Advanced Quantum Mechanics"
                      className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors appearance-none"
                      >
                        <option value="CS">Computer Science</option>
                        <option value="Physics">Physics</option>
                        <option value="Math">Mathematics</option>
                        <option value="Biology">Biology</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Neural Match %</label>
                      <input
                        type="number"
                        value={formData.match_percent}
                        onChange={(e) => setFormData({ ...formData, match_percent: parseInt(e.target.value) })}
                        className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Neural Source (Video URL)</label>
                    <input
                      required
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => {
                        const url = e.target.value;
                        setFormData({ 
                          ...formData, 
                          video_url: url,
                          thumbnail_url: getThumbnailUrl(url) 
                        });
                      }}
                      placeholder="e.g. https://youtube.com/watch?v=..."
                      className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What will students learn in this module?"
                      rows={3}
                      className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded-xl text-sm">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : "Publish to Student Network"}
                  </button>
                </>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
