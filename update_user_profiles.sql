ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS status status_enum DEFAULT 'active'::status_enum;
