"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { User, Camera, Mail, Calendar, BookOpen, Edit3, Save, X } from "lucide-react";
import { useUserStore } from "@/store/use-user-store";
import { useToast } from "@/components/ui/toast";

export default function ProfileView() {
  const { profile, setProfile, savedCourses } = useUserStore();
  const { addToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: profile.name, bio: profile.bio, email: profile.email });

  const handleSave = () => {
    setProfile({ name: form.name, bio: form.bio, email: form.email });
    setEditing(false);
    addToast("✓ Profile updated successfully", "success");
  };

  const handleCancel = () => {
    setForm({ name: profile.name, bio: profile.bio, email: profile.email });
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-12 pb-24 px-8 md:px-12 max-w-2xl"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 flex items-center justify-center text-[#a78bfa]">
          <User size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account details</p>
        </div>
      </div>

      {/* Avatar + name */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-5 flex items-center gap-6">
        <div className="relative">
          <img
            src={profile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
            alt={profile.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
          />
          <button
            onClick={() => addToast("Avatar upload coming soon!", "info")}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Camera size={13} className="text-primary-foreground" />
          </button>
        </div>
        <div className="flex-1">
          {editing ? (
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="text-xl font-black bg-background border border-border rounded-lg px-3 py-1.5 w-full outline-none focus:border-primary/50 transition-colors"
            />
          ) : (
            <h2 className="text-xl font-black">{profile.name}</h2>
          )}
          <p className="text-sm text-muted-foreground mt-1">{profile.role} · Joined {profile.joinDate}</p>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span><strong className="text-[#a78bfa]">{savedCourses.length}</strong> saved</span>
            <span><strong className="text-[#34d399]">{profile.studyTime}</strong> studied</span>
            <span><strong className="text-[#6366f1]">{profile.retention}</strong> retention</span>
          </div>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            <Edit3 size={14} /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Save size={14} /> Save
            </button>
            <button onClick={handleCancel} className="px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-5 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Details</h3>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail size={12} /> Email</label>
          {editing ? (
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50 transition-colors"
            />
          ) : (
            <p className="text-sm text-foreground">{profile.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar size={12} /> Member Since</label>
          <p className="text-sm text-foreground">{profile.joinDate}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Bio</label>
          {editing ? (
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50 transition-colors resize-none"
            />
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Learning Preferences */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Learning Preferences</h3>
        <div className="space-y-3">
          {[
            { label: "Visual Learning", desc: "Prefers diagrams and videos", active: true },
            { label: "Accelerated Modules", desc: "Skip basics, go deep fast", active: true },
            { label: "Peer Challenges", desc: "Compete with cohort", active: false },
            { label: "Daily Reminders", desc: "Streak and goal notifications", active: true },
          ].map((pref, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{pref.label}</p>
                <p className="text-xs text-muted-foreground">{pref.desc}</p>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${pref.active ? "bg-[#a78bfa]" : "bg-border"}`}
                onClick={() => addToast("Preferences saved to your profile", "success")}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${pref.active ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
