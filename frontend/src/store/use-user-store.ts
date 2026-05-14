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
  };
  savedCourses: SavedCourse[];
  activeView: 'home' | 'mylist' | 'analytics' | 'profile';

  // Actions — shape stays identical when backend replaces local state
  setProfile: (profile: Partial<UserState['profile']>) => void;
  saveCourse: (course: SavedCourse) => void;
  removeCourse: (id: string) => void;
  isSaved: (id: string) => boolean;
  setActiveView: (view: UserState['activeView']) => void;
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
      },
      savedCourses: [],
      activeView: 'home',

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
    }),
    {
      name: 'vision-ai-user-store',
      partialize: (state) => ({
        profile: state.profile,
        savedCourses: state.savedCourses,
      }),
    }
  )
);
