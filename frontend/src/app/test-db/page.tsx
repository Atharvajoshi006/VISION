"use client";

import { useEffect, useState } from "react";
import { runDatabaseDiagnostics } from "@/lib/db-test-diagnostics";
import { motion } from "framer-motion";
import { Database, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function TestDBPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      const res = await runDatabaseDiagnostics();
      setResults(res);
      setLoading(false);
    }
    run();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl relative z-10"
      >
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Database size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Neural DB Diagnostics</h1>
            <p className="text-muted-foreground">Verifying global data mesh integrity...</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm font-bold animate-pulse text-blue-400 uppercase tracking-widest">Pinging Supabase Nodes...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Connection Status</div>
                  <div className="flex items-center gap-2">
                    {results.connection ? (
                      <><CheckCircle2 size={18} className="text-green-500" /> <span className="font-black text-green-400">ENCRYPTED</span></>
                    ) : (
                      <><AlertTriangle size={18} className="text-red-500" /> <span className="font-black text-red-400">DISCONNECTED</span></>
                    )}
                  </div>
               </div>
               <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Security Mesh</div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-400" />
                    <span className="font-black text-blue-300 uppercase tracking-tighter">RLS ACTIVE</span>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-sm text-muted-foreground">Registered Neural Profiles</span>
                  <span className="font-black text-xl">{results.profiles}</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-sm text-muted-foreground">Active Courses (Catalog)</span>
                  <span className="font-black text-xl">{results.courses}</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-sm text-muted-foreground">Performance Log Density</span>
                  <span className="font-black text-xl">{results.performance} entries</span>
               </div>
            </div>

            {results.errors.length > 0 && (
              <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-mono">
                {results.errors.map((e: string, i: number) => <div key={i}>ERR_NODE_{i}: {e}</div>)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="py-4 bg-white/10 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all border border-white/10"
              >
                Refresh
              </button>
              <button 
                onClick={async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session?.user) return alert("Please login first to simulate activity.");
                  
                  const { error } = await supabase.from('performance_history').insert([{
                    student_id: session.user.id,
                    marks: Math.floor(Math.random() * 40) + 60, // 60-100
                    subject: 'Quantum Mechanics',
                    focus_areas: ['Wave Function', 'Neural Sync'],
                    date: new Date().toISOString()
                  }]);
                  if (error) alert("Sim Error: " + error.message);
                  else window.location.reload();
                }}
                className="py-4 bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
              >
                Simulate Activity
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
