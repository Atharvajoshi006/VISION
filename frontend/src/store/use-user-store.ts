import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedCourse {
  id: string;
  title: string;
  img: string;
  match: string;
  duration: string;
  progress?: number;
  tags?: string[];
  savedAt: string; // ISO date — backend: timestamp from DB
}

interface UserState {
  profile: {
    name: string;
    role: string;
    avatar: string;
    cognitiveCapacity: string;
    studyTime: string;
    retention: string;
    bio: string;
    email: string;
    joinDate: string;
    cognitiveLevel: number; // 1-10
    performanceScore: number; // 0-1
  };
  performanceHistory: Array<{
    date: string;
    marks: number;
    cognitiveLoad: number;
    focusAreas: string[];
    subject: string;
  }>;
  savedCourses: SavedCourse[];
  activeView: 'home' | 'mylist' | 'analytics' | 'profile' | 'search';
  isCommandPaletteOpen: boolean;

  // Actions — shape stays identical when backend replaces local state
  setProfile: (profile: Partial<UserState['profile']>) => void;
  saveCourse: (course: SavedCourse) => void;
  removeCourse: (id: string) => void;
  isSaved: (id: string) => boolean;
  setActiveView: (view: UserState['activeView']) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  addPerformanceLog: (log: UserState['performanceHistory'][0]) => void;
  setCognitiveLevel: (level: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: {
        name: "Alex Mercer",
        role: "Student",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
        cognitiveCapacity: "Optimal",
        studyTime: "12.5h",
        retention: "98%",
        bio: "Passionate about quantum physics and machine learning. Learning faster every day.",
        email: "alex.mercer@visionai.edu",
        joinDate: "January 2026",
        cognitiveLevel: 1,
        performanceScore: 0.5,
      },
      performanceHistory: [
        { date: "2026-05-10", marks: 82, cognitiveLoad: 0.6, focusAreas: ["Foundations"], subject: "CS" },
        { date: "2026-05-12", marks: 88, cognitiveLoad: 0.7, focusAreas: ["Applied Logic"], subject: "Math" }
      ],
      savedCourses: [],
      activeView: 'home',
      isCommandPaletteOpen: false,

      setProfile: (newProfile) =>
        set((state) => ({ profile: { ...state.profile, ...newProfile } })),

      saveCourse: (course) =>
        set((state) => ({
          savedCourses: state.savedCourses.find((c) => c.id === course.id)
            ? state.savedCourses
            : [...state.savedCourses, course],
        })),

      removeCourse: (id) =>
        set((state) => ({
          savedCourses: state.savedCourses.filter((c) => c.id !== id),
        })),

      isSaved: (id) => get().savedCourses.some((c) => c.id === id),

      setActiveView: (view) => set({ activeView: view }),
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      
      addPerformanceLog: (log) => 
        set((state) => ({ performanceHistory: [log, ...state.performanceHistory].slice(0, 50) })),
        
      setCognitiveLevel: (level) => 
        set((state) => ({ profile: { ...state.profile, cognitiveLevel: level } })),
    }),
    {
      name: 'vision-ai-user-store',
      partialize: (state) => ({
        profile: state.profile,
        savedCourses: state.savedCourses,
        performanceHistory: state.performanceHistory,
      }),
    }
  )
);
