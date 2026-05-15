import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- Authentication Helpers ---

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

// --- Helper Functions for Adaptive Learning ---

export const logPerformance = async (userId: string, data: any) => {
  const { error } = await supabase
    .from('performance_history')
    .insert({
      student_id: userId,
      ...data
    })
  
  return { error }
}

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle() // Use maybeSingle to avoid 406/error if user is new
  
  return { data, error }
}

export const saveOnboardingData = async (userId: string, data: any) => {
  console.log(`[SUPABASE] Attempting upsert for user: ${userId}`);
  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      id: userId, 
      onboarding_completed: true, 
      updated_at: new Date().toISOString(),
      ...data 
    })
  
  if (error) {
    console.error("[SUPABASE] Onboarding Save Error:", error.message, error.details);
  } else {
    console.log("[SUPABASE] Onboarding data persisted successfully.");
  }
  
  return { error }
}
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    // Clear local cache/state if needed
    window.location.href = '/';
  }
  return { error };
}
