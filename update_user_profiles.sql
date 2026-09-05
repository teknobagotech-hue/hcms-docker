-- ==============================================================================
-- FIX: Drop the trigger on auth.users that causes the 500 Database Error
-- ==============================================================================
-- The application (UserForm.jsx) now automatically creates and activates 
-- the user profile via supabaseAdmin. The database trigger on auth.users is 
-- not needed and causes Supabase Auth to fail with 500 (type/permission mismatch).

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ==============================================================================
-- Ensure status column exists and defaults to 'active'
-- ==============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
    CREATE TYPE status_enum AS ENUM ('active', 'inactive');
  END IF;
END $$;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS status status_enum DEFAULT 'active'::status_enum;

-- Make sure existing users have status 'active'
UPDATE public.user_profiles 
SET status = 'active' 
WHERE status IS NULL;
