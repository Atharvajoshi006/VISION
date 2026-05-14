"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/use-user-store";

export default function SSOCallback() {
  const router = useRouter();
  const setProfile = useUserStore((state) => state.setProfile);
  const isSyncing = useRef(false);

  useEffect(() => {
    const syncUser = async (session: any) => {
      if (isSyncing.current || !session) return;
      isSyncing.current = true;

      try {
        console.log("Neural Handshake: Syncing with Intelligence Backend...");
        
        // Auth is now fully managed by Supabase JWT.
        // We just extract user metadata and proceed.
        const userData = session.user.user_metadata;
        
        setProfile({
          name: userData?.full_name || userData?.name || "New Explorer",
          email: session.user.email || "",
          role: "student",
          avatar: userData?.avatar_url || "",
          bio: "Learning accelerated by Vision AI.",
          joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          studyTime: "0h",
          retention: "0%",
        });
        
        console.log("Handshake Complete. Launching Onboarding.");
        router.push("/onboarding/student");
      } catch (err) {
        console.error("Neural Sync Failed:", err);
        router.push("/auth");
      }
    };

    const processAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        console.error("SSO Callback Error:", error);
        router.push("/auth");
        return;
      }
      
      await syncUser(data.session);
    };

    processAuth();
  }, [router, setProfile]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
        <div className="absolute inset-2 border-4 border-primary/40 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-4 border-4 border-primary rounded-full" />
      </div>
      <h2 className="text-2xl font-black tracking-tight mb-2">Establishing Neural Link</h2>
      <p className="text-muted-foreground text-sm max-w-sm text-center">
        Synchronizing your cognitive profile with the Vision Intelligence Network...
      </p>
    </div>
  );
}
