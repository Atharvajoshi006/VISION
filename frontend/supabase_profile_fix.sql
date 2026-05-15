-- ==========================================
-- 🛡️ VISION AUTOMATED PROFILE TRIGGER
-- This script ensures every signup automatically
-- creates a profile in the public table.
-- ==========================================

-- 1. Create the Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, onboarding_completed)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill missing profiles (Optional)
INSERT INTO public.profiles (id, name, role, onboarding_completed)
SELECT id, 
       COALESCE(raw_user_meta_data->>'full_name', 'New User'), 
       COALESCE(raw_user_meta_data->>'role', 'student'),
       FALSE
FROM auth.users
ON CONFLICT (id) DO NOTHING;
