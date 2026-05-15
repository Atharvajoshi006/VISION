import { supabase } from "./supabase";

async function runDatabaseDiagnostics() {
  console.log("🚀 STARTING VISION DB DIAGNOSTICS...");
  
  const results = {
    connection: false,
    profiles: 0,
    courses: 0,
    performance: 0,
    errors: [] as string[]
  };

  try {
    // 1. Test Connection & Profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id').limit(1);
    if (pError) throw pError;
    results.connection = true;
    
    const { count: pCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    results.profiles = pCount || 0;

    // 2. Test Courses
    const { count: cCount, error: cError } = await supabase.from('courses').select('*', { count: 'exact', head: true });
    if (cError) throw cError;
    results.courses = cCount || 0;

    // 3. Test Performance History
    const { count: hCount, error: hError } = await supabase.from('performance_history').select('*', { count: 'exact', head: true });
    if (hError) throw hError;
    results.performance = hCount || 0;

    console.log("✅ DIAGNOSTICS COMPLETE");
    console.table(results);

  } catch (err: any) {
    console.error("❌ DIAGNOSTICS FAILED:", err.message);
    results.errors.push(err.message);
  }

  return results;
}

// For manual execution via browser console or a temporary route
if (typeof window !== 'undefined') {
  (window as any).runDBTest = runDatabaseDiagnostics;
} else {
  // CLI Mode
  runDatabaseDiagnostics().then(res => {
    if (res.errors.length > 0) process.exit(1);
    process.exit(0);
  });
}

export { runDatabaseDiagnostics };
