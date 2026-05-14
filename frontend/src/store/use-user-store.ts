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
  savedAt: string;
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

  // Actions
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
        name: "Explorer",
        role: "Student",
        avatar: "",
        cognitiveCapacity: "Optimal",
        studyTime: "0h",
        retention: "0%",
        bio: "Learning accelerated by Vision AI.",
        email: "",
        joinDate: "",
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
