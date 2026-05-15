import { CourseItem, CourseRow, NEURAL_CATALOG, RECOMMENDED_BOOKS, RECOMMENDED_RESOURCES } from "@/lib/dashboard-data";
import { supabase } from "@/lib/supabase";

export interface Course {
  id: string;
  title: string;
  img: string;
  match: string;
  duration: string;
  tags: string[];
  description: string;
}

export const RecommenderEngine = {
  // --- REAL-TIME DATA FETCHING ---
  fetchLiveCourses: async (): Promise<CourseItem[]> => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map DB schema to UI schema
      return data.map(c => ({
        id: c.id,
        title: c.title,
        img: c.thumbnail_url || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop",
        match: `${c.match_percent}%`,
        duration: c.duration || "15 min",
        tags: c.tags || [c.subject],
        video_url: c.video_url
      }));
    } catch (err) {
      console.warn("[BRAIN] Falling back to local catalog:", err);
      return NEURAL_CATALOG;
    }
  },

  getRecommendations: async (profile: any, liveCourses: CourseItem[] = []): Promise<Course[]> => {
    const catalog = liveCourses.length > 0 ? liveCourses : NEURAL_CATALOG;
    const onboarding = profile.onboarding_data || {};
    const goal = onboarding.goal?.toLowerCase() || "";
    const cognitiveLevel = profile.cognitive_level || 1;

    // 1. Fetch latest student performance for interactiveness factor
    let performanceScore = 0.5;
    try {
      const { data: logs } = await supabase
        .from('performance_history')
        .select('marks')
        .order('date', { ascending: false })
        .limit(5);
      
      if (logs && logs.length > 0) {
        performanceScore = logs.reduce((acc, l) => acc + l.marks, 0) / (logs.length * 100);
      }
    } catch (e) {
      console.warn("[BRAIN] Performance sync failed, using baseline.");
    }

    // 2. Filter by Goal
    let filtered = catalog.filter(course => {
      const tags = course.tags?.map(t => t.toLowerCase()) || [];
      if (goal.includes("science") && (tags.includes("physics") || tags.includes("biology"))) return true;
      if (goal.includes("tech") && tags.includes("cs")) return true;
      if (goal.includes("logic") && tags.includes("math")) return true;
      return true;
    });

    // 3. Sort by "Student Interactiveness" (Composite of cognitive level and performance score)
    return filtered.map(c => ({
      id: c.id,
      title: c.title,
      img: c.img,
      match: c.match,
      duration: c.duration,
      tags: c.tags || [],
      description: `Hyper-personalized neural path. Optimization Score: ${Math.round(performanceScore * 100)}%. Goal: ${onboarding.goal || "Discovery"}.`
    })).sort((a, b) => {
      const aIsAdv = a.tags?.includes("Advanced") || a.tags?.includes("Deep Research");
      const bIsAdv = b.tags?.includes("Advanced") || b.tags?.includes("Deep Research");
      
      // If student is highly active/performing, push advanced content to top
      if (performanceScore > 0.8 && aIsAdv && !bIsAdv) return -1;
      if (performanceScore < 0.5 && !aIsAdv && bIsAdv) return -1;
      return 0;
    }).slice(0, 4);
  },

  getDashboardRows: (profile: any, liveCourses: CourseItem[] = []): CourseRow[] => {
    const catalog = liveCourses.length > 0 ? liveCourses : NEURAL_CATALOG;
    const onboarding = profile.onboarding_data || {};
    const goal = onboarding.goal?.toLowerCase() || "";
    
    const goalItems = catalog.filter(c => 
      c.tags?.some(t => goal.includes(t.toLowerCase()))
    );

    return [
      {
        id: "tutor-uploads",
        title: "Recently Uploaded by Tutors",
        hasMore: false,
        items: liveCourses.slice(0, 4)
      },
      {
        id: "goal-based",
        title: `Priority: ${onboarding.goal || "Recommended"}`,
        hasMore: false,
        items: goalItems.length > 0 ? goalItems : catalog.slice(0, 4)
      }
    ];
  },

  getRecommendedBooks: (profile: any) => {
    const goal = profile.onboarding_data?.goal?.toLowerCase() || "";
    return RECOMMENDED_BOOKS.filter(book => 
      goal.includes(book.subject.toLowerCase()) || goal.includes("everything")
    );
  },

  getRecommendedResources: (profile: any) => {
    const goal = profile.onboarding_data?.goal?.toLowerCase() || "";
    return RECOMMENDED_RESOURCES.filter(res => 
      goal.includes(res.source.toLowerCase()) || goal.includes("labs") || true // Default fallback for resources
    );
  }
};
