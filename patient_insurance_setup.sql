-- ==========================================
-- PATIENT INSURANCE MODULE DATABASE SETUP
-- ==========================================

-- 1. Create status_enum if it doesn't exist (already exists in main schema, shown for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
    CREATE TYPE status_enum AS ENUM ('active', 'inactive');
  END IF;
END $$;

-- 2. Create patient_insurance table
CREATE TABLE IF NOT EXISTS public.patient_insurance (
  patient_insurance_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  insurance_provider_id integer REFERENCES public.insurance_providers(insurance_provider_id) ON DELETE CASCADE,
  insurance_number character varying NOT NULL,
  coverage_details text,
  effective_date date,
  expiration_date date,
  status status_enum DEFAULT 'active'::status_enum,
  created_at date DEFAULT CURRENT_DATE
);

-- 3. Add column extensions if patient_insurance already existed without extra fields
ALTER TABLE public.patient_insurance 
  ADD COLUMN IF NOT EXISTS coverage_details text,
  ADD COLUMN IF NOT EXISTS effective_date date,
  ADD COLUMN IF NOT EXISTS expiration_date date;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient_id ON public.patient_insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_provider_id ON public.patient_insurance(insurance_provider_id);
