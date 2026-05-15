"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getProfile } from "@/lib/supabase";
import { useUserStore } from "@/store/use-user-store";

/**
 * VISION Auth Callback Handler
 * 
 * Synchronizes the Supabase session with the global user store 
 * and determines the correct entry point (Onboarding vs Dashboard).
 */
export default function AuthCallback() {
  const router = useRouter();
  const setProfile = useUserStore(state => state.setProfile);

  useEffect(() => {
    const handleAuth = async () => {
      console.log("[AUTH] Initializing session handshake...");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.warn("[AUTH] No session found. Redirecting to login.");
        router.push("/auth");
        return;
      }

      const user = session.user;
      console.log(`[AUTH] Session active for user: ${user.id} (${user.email})`);
      
      // Fetch or Initialize Profile
      const { data: profile, error } = await getProfile(user.id);

      if (error || !profile) {
        // New User -> Set base profile and go to Onboarding
        const newProfile = {
          email: user.email!,
          name: user.user_metadata.full_name || "New Explorer",
          role: "Student", // Default for Google Auth
          onboarding_completed: false
        };
        setProfile(newProfile);
        router.push("/onboarding/student");
      } else if (!profile.onboarding_completed) {
        // Returning but didn't finish onboarding
        setProfile(profile);
        router.push("/onboarding/student");
      } else {
        // Established User -> Go to Dashboard
        setProfile(profile);
        router.push(profile.role === "Tutor" ? "/dashboard/tutor" : "/dashboard/student");
      }
    };

    handleAuth();
  }, [router, setProfile]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-primary font-bold tracking-widest uppercase text-xs">Synchronizing Neural Session...</p>
      </div>
    </div>
  );
}
