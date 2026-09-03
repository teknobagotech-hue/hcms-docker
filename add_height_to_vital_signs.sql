-- ==============================================================================
-- Migration: Add Height to Vital Signs Table
-- ==============================================================================

-- 1. If you are creating the table from scratch:
CREATE TABLE IF NOT EXISTS public.vital_signs (
  vital_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  patient_id integer NOT NULL,
  record_date date NULL DEFAULT CURRENT_DATE,
  age integer NULL,
  height_cm numeric NULL,
  weight_kg numeric NULL,
  bp character varying NULL,
  spo2 numeric NULL,
  pr integer NULL,
  temperature_c numeric NULL,
  notes text NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT vital_signs_pkey PRIMARY KEY (vital_id),
  CONSTRAINT vital_signs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients (patient_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. If the table ALREADY exists, execute this migration command in the Supabase SQL Editor:
ALTER TABLE public.vital_signs 
ADD COLUMN IF NOT EXISTS height_cm numeric NULL;
