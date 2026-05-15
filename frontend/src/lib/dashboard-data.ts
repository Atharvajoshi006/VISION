/**
 * DASHBOARD DATA LAYER
 * ---------------------
 * All static data is defined here with the EXACT same shape your backend API should return.
 * When your backend is ready, replace these with API calls (e.g. fetch('/api/dashboard/...'))
 * and the UI components will work with zero changes — they only depend on these types.
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface CourseItem {
  id: string;
  title: string;
  img: string;
  match: string;
  duration: string;
  progress?: number; // 0–100, only for in-progress courses
  tags?: string[];
  video_url?: string;
}

export interface CourseRow {
  id: string;
  title: string;
  items: CourseItem[];
  /** backend: GET /api/dashboard/rows/:id?page=N  */
  hasMore: boolean;
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  cover: string;        // image URL
  subject: string;
  rating: number;       // 1–5
  readTime: string;     // e.g. "4h read"
  match: string;        // AI match %
  description: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  type: "video" | "article" | "podcast" | "tool";
  source: string;       // e.g. "YouTube", "arXiv", "Spotify"
  img: string;
  duration: string;
  match: string;
}

export interface RecommendationSection {
  id: string;
  title: string;
  type: "books" | "resources";
  hasMore: boolean;
  /** backend: GET /api/dashboard/recommendations/:id?page=N  */
}

export interface FeaturedCourse {
  id: string;
  title: string;
  match: string;
  year: string;
  description: string;
  tags: string[];
  img: string;
}

// ─── Static fallback data (replace with API responses) ─────────────────────

// ─── Neural Catalog (Master Content Library) ─────────────────────

export const MASTER_FEATURED: FeaturedCourse = {
  id: "quantum-mechanics-adv",
  title: "Advanced Quantum Mechanics",
  match: "98% Match",
  year: "2026",
  description:
    "Dive deep into the fundamental principles of quantum theory, tailored to your accelerated cognitive profile. Master superposition, entanglement, and wave-function collapse in this interactive neural module.",
  tags: ["Physics", "Accelerated", "Interactive"],
  img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2000&auto=format&fit=crop",
};

export const NEURAL_CATALOG: CourseItem[] = [
  { id: "c1", title: "Calculus III: Vector Analysis", duration: "45 min", match: "94%", img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop", tags: ["Math", "Advanced"] },
  { id: "c2", title: "Machine Learning Foundations", duration: "2h 10m", match: "88%", img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop", tags: ["CS", "AI"] },
  { id: "c3", title: "Neuroscience 101", duration: "3h 20m", match: "79%", img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=800&auto=format&fit=crop", tags: ["Biology"] },
  { id: "c4", title: "Linear Algebra", duration: "1h 30m", match: "91%", img: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=800&auto=format&fit=crop", tags: ["Math"] },
  { id: "c5", title: "Quantum Computing Basics", duration: "5h", match: "87%", img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop", tags: ["Physics", "CS"] },
  { id: "t1", title: "Data Structures & Algorithms", duration: "6h", match: "91%", img: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=800&auto=format&fit=crop", tags: ["CS"] },
  { id: "p1", title: "Abstract Algebra", duration: "7h", match: "96%", img: "https://images.unsplash.com/photo-1632516643720-e7f5d7d6eba1?q=80&w=800&auto=format&fit=crop", tags: ["Math"] },
  { id: "p3", title: "Astrophysics", duration: "9h", match: "92%", img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop", tags: ["Physics"] },
  { id: "p4", title: "Genetics & Evolution", duration: "5h", match: "83%", img: "https://images.unsplash.com/photo-1530213786676-4189f1756947?q=80&w=800&auto=format&fit=crop", tags: ["Biology"] },
];

export const RECOMMENDED_BOOKS: BookItem[] = [
  {
    id: "b1",
    title: "The Feynman Lectures on Physics",
    author: "Richard P. Feynman",
    cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop",
    subject: "Physics",
    rating: 5,
    readTime: "40h read",
    match: "97%",
    description: "The legendary physics lectures by Nobel laureate Richard Feynman, presented in a readable, insightful format.",
  },
  {
    id: "b2",
    title: "Gödel, Escher, Bach",
    author: "Douglas Hofstadter",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=400&auto=format&fit=crop",
    subject: "Mathematics",
    rating: 5,
    readTime: "30h read",
    match: "93%",
    description: "A metaphorical fugue on minds and machines in the spirit of Lewis Carroll.",
  },
  {
    id: "b3",
    title: "The Art of Problem Solving",
    author: "Sandor Lehoczky",
    cover: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&auto=format&fit=crop",
    subject: "Mathematics",
    rating: 4,
    readTime: "15h read",
    match: "91%",
    description: "The classic guide to mastering competition mathematics and advanced problem-solving techniques.",
  },
  {
    id: "b4",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
    subject: "Psychology",
    rating: 5,
    readTime: "12h read",
    match: "88%",
    description: "Kahneman's groundbreaking account of the two systems that drive the way we think.",
  },
  {
    id: "b5",
    title: "The Gene: An Intimate History",
    author: "Siddhartha Mukherjee",
    cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=400&auto=format&fit=crop",
    subject: "Biology",
    rating: 4,
    readTime: "18h read",
    match: "85%",
    description: "A sweeping history of the gene and its role in our understanding of life, identity, and destiny.",
  },
  {
    id: "b6",
    title: "Algorithms to Live By",
    author: "Brian Christian",
    cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400&auto=format&fit=crop",
    subject: "Computer Science",
    rating: 4,
    readTime: "10h read",
    match: "90%",
    description: "How computer algorithms can be applied to everyday life to solve common decision-making problems.",
  },
];

export const RECOMMENDED_RESOURCES: ResourceItem[] = [
  {
    id: "r1",
    title: "Quantum Computing: An Applied Approach",
    type: "video",
    source: "Vision AI Labs",
    img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop",
    duration: "2h 15m",
    match: "95%",
  },
  {
    id: "r2",
    title: "The Mathematics of Neural Networks",
    type: "article",
    source: "arXiv",
    img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400&auto=format&fit=crop",
    duration: "25 min read",
    match: "92%",
  },
  {
    id: "r3",
    title: "Sean Carroll's Mindscape",
    type: "podcast",
    source: "Spotify",
    img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=400&auto=format&fit=crop",
    duration: "60 min/ep",
    match: "89%",
  },
  {
    id: "r4",
    title: "Wolfram Alpha Pro",
    type: "tool",
    source: "Wolfram",
    img: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=400&auto=format&fit=crop",
    duration: "Interactive",
    match: "94%",
  },
  {
    id: "r5",
    title: "3Blue1Brown: Essence of Linear Algebra",
    type: "video",
    source: "YouTube",
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=400&auto=format&fit=crop",
    duration: "3h series",
    match: "96%",
  },
];
