-- ==========================================
-- 1. CUSTOM ENUM TYPES
-- ==========================================
CREATE TYPE status_enum AS ENUM ('active', 'inactive');
CREATE TYPE appointment_status_enum AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE record_status_enum AS ENUM ('active', 'archived');
CREATE TYPE prescription_status_enum AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE sale_type_enum AS ENUM ('retail', 'wholesale');
CREATE TYPE withdrawal_payment_status_enum AS ENUM ('unpaid', 'paid');
CREATE TYPE discount_type_enum AS ENUM ('percentage', 'fixed');
CREATE TYPE withdrawal_status_enum AS ENUM ('pending', 'completed');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid');
CREATE TYPE insurance_status_enum AS ENUM ('pending', 'approved', 'rejected');

-- ==========================================
-- 2. BASE PROFILES & SYSTEM
-- ==========================================
-- Note: This assumes auth.users is already managed by Supabase Auth.
CREATE TABLE public.user_profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  role character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.roles (
  role_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role_name character varying NOT NULL
);

CREATE TABLE public.sessions (
  id character varying PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(id),
  ip_address character varying,
  user_agent text,
  payload jsonb,
  last_activity integer
);

CREATE TABLE public.system_logs (
  log_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(id),
  action text,
  log_timestamp timestamp without time zone DEFAULT now()
);

CREATE TABLE public.departments (
  department_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  department_name character varying NOT NULL,
  location character varying,
  status status_enum DEFAULT 'active'::status_enum,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.doctors (
  doctor_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(id),
  first_name character varying,
  middle_name character varying,
  last_name character varying,
  specialty character varying,
  contact_number character varying,
  email character varying,
  department_id integer REFERENCES public.departments(department_id),
  schedule text,
  status status_enum DEFAULT 'active'::status_enum,
  license_number text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- ==========================================
-- 3. PATIENTS & CLINICAL TRACKING
-- ==========================================
CREATE TABLE public.patients (
  patient_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name character varying,
  middle_name character varying,
  last_name character varying,
  date_of_birth date,
  gender character varying,
  marital_status character varying,
  occupation character varying,
  gravida integer,
  para integer,
  lmp character varying,
  menopause_age integer,
  contact_number character varying,
  email character varying,
  address text,
  medical_history text,
  surgical_history text,
  allergies text,
  alcoholic_intake character varying,
  smoking_history character varying,
  emergency_contact_name character varying,
  emergency_contact_relationship character varying,
  emergency_contact_phone character varying,
  emergency_contact_address text,
  guardian_name character varying,
  guardian_relationship character varying,
  guardian_phone character varying,
  guardian_address text,
  profile_picture text,
  status status_enum DEFAULT 'active'::status_enum,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.appointments (
  appointment_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer REFERENCES public.patients(patient_id),
  doctor_id integer REFERENCES public.doctors(doctor_id),
  appointment_date timestamp without time zone,
  purpose text,
  status appointment_status_enum DEFAULT 'scheduled'::appointment_status_enum,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.patient_cardio_history (
  history_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer NOT NULL REFERENCES public.patients(patient_id),
  smoker_status character varying,
  hypertension boolean DEFAULT false,
  diabetes boolean DEFAULT false,
  family_history_heart_disease boolean DEFAULT false,
  previous_heart_attack boolean DEFAULT false,
  pacemaker_details text,
  last_updated timestamp without time zone DEFAULT now()
);

CREATE TABLE public.medical_records (
  record_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer REFERENCES public.patients(patient_id),
  doctor_id integer REFERENCES public.doctors(doctor_id),
  diagnosis text,
  treatment text,
  subjective text,
  objective text,
  assessment text,
  plan text,
  chief_complaint text,
  height_cm numeric,
  weight_kg numeric,
  bmi numeric,
  blood_pressure character varying,
  heart_rate integer,
  temperature_c numeric,
  respiratory_rate integer,
  spo2 numeric,
  ecg_findings text,
  echo_findings text,
  ejection_fraction numeric,
  lipid_profile_ldl numeric,
  lipid_profile_hdl numeric,
  triglycerides numeric,
  cardiovascular_risk_score numeric,
  lab_results jsonb,
  radiology_reports jsonb,
  lab_images jsonb,
  status record_status_enum DEFAULT 'active'::record_status_enum,
  record_date timestamp without time zone DEFAULT now(),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.vital_signs (
  vital_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer NOT NULL REFERENCES public.patients(patient_id),
  record_date date DEFAULT CURRENT_DATE,
  age integer,
  weight_kg numeric,
  bp character varying,
  spo2 numeric,
  pr integer,
  temperature_c numeric,
  notes text,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.lab_cbc (
  cbc_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer NOT NULL REFERENCES public.patients(patient_id),
  test_date date NOT NULL,
  wbc numeric,
  rbc numeric,
  hemoglobin numeric,
  hematocrit numeric,
  platelet_count numeric,
  segmenters numeric,
  neutrophils numeric,
  lymphocytes numeric,
  monocytes numeric,
  eosinophils numeric,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.lab_chemistry (
  chem_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer NOT NULL REFERENCES public.patients(patient_id),
  test_date date NOT NULL,
  creatinine numeric,
  sodium numeric,
  potassium numeric,
  chloride numeric,
  ionized_calcium numeric,
  bun numeric,
  uric_acid numeric,
  phosphorous numeric,
  sgpt_alt numeric,
  sgot_ast numeric,
  hba1c numeric,
  fbs numeric,
  rbs numeric,
  total_cholesterol numeric,
  triglycerides numeric,
  hdl numeric,
  ldl numeric,
  vldl numeric,
  chol_hdl_ratio numeric,
  d_dimer numeric,
  procalcitonin numeric,
  albumin numeric,
  trop_i numeric,
  pro_bnp numeric,
  ptpa_patient numeric,
  ptpa_control numeric,
  percent_activity numeric,
  inr numeric,
  ptpa_ratio numeric,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.lab_serology (
  serology_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer NOT NULL REFERENCES public.patients(patient_id),
  test_date date NOT NULL,
  tsh numeric,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.lab_urinalysis (
  ua_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer NOT NULL REFERENCES public.patients(patient_id),
  test_date date NOT NULL,
  color character varying,
  transparency character varying,
  protein character varying,
  ph numeric,
  specific_gravity numeric,
  glucose character varying,
  pus_cells character varying,
  rbc_micro character varying,
  epithelial_cells character varying,
  bacteria character varying,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.imaging_reports (
  imaging_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer NOT NULL REFERENCES public.patients(patient_id),
  modality character varying NOT NULL,
  location character varying,
  impression text,
  record_date date,
  file_url text,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.medical_documents (
  document_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer NOT NULL REFERENCES public.patients(patient_id),
  doctor_id integer REFERENCES public.doctors(doctor_id),
  document_type character varying NOT NULL,
  diagnosis_impression text,
  remarks_recommendations text,
  purpose text,
  referred_to_doctor character varying,
  issue_date timestamp without time zone DEFAULT now(),
  created_at timestamp without time zone DEFAULT now()
);

-- ==========================================
-- 4. TRIGGERS FOR MEDICAL RECORDS
-- ==========================================
CREATE OR REPLACE FUNCTION update_latest_med_record_labs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.medical_records
  SET lab_results = jsonb_build_object(
      'last_updated_table', TG_TABLE_NAME,
      'test_date', NEW.test_date,
      'update_time', NOW()
  )
  WHERE record_id = (
      SELECT record_id FROM public.medical_records
      WHERE patient_id = NEW.patient_id
      ORDER BY created_at DESC LIMIT 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_labs_cbc
AFTER INSERT OR UPDATE ON public.lab_cbc
FOR EACH ROW EXECUTE FUNCTION update_latest_med_record_labs();

CREATE TRIGGER trg_update_labs_chemistry
AFTER INSERT OR UPDATE ON public.lab_chemistry
FOR EACH ROW EXECUTE FUNCTION update_latest_med_record_labs();

CREATE TRIGGER trg_update_labs_serology
AFTER INSERT OR UPDATE ON public.lab_serology
FOR EACH ROW EXECUTE FUNCTION update_latest_med_record_labs();

CREATE TRIGGER trg_update_labs_urinalysis
AFTER INSERT OR UPDATE ON public.lab_urinalysis
FOR EACH ROW EXECUTE FUNCTION update_latest_med_record_labs();

CREATE OR REPLACE FUNCTION update_latest_med_record_imaging()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.medical_records
  SET radiology_reports = jsonb_build_object(
      'modality', NEW.modality,
      'impression', NEW.impression,
      'update_time', NOW()
  )
  WHERE record_id = (
      SELECT record_id FROM public.medical_records
      WHERE patient_id = NEW.patient_id
      ORDER BY created_at DESC LIMIT 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_imaging
AFTER INSERT OR UPDATE ON public.imaging_reports
FOR EACH ROW EXECUTE FUNCTION update_latest_med_record_imaging();

-- ==========================================
-- 5. PHARMACY, INVENTORY, & BILLING
-- ==========================================
CREATE TABLE public.medicines (
  medicine_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  medicine_name character varying NOT NULL,
  dosage_form character varying,
  strength character varying,
  created_at date DEFAULT CURRENT_DATE
);

CREATE TABLE public.prescriptions (
  prescription_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer REFERENCES public.patients(patient_id),
  doctor_id integer REFERENCES public.doctors(doctor_id),
  prescription_date timestamp without time zone DEFAULT now(),
  notes text,
  status prescription_status_enum DEFAULT 'active'::prescription_status_enum,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.prescription_print_data (
  prescription_id integer NOT NULL PRIMARY KEY REFERENCES public.prescriptions(prescription_id),
  med_cert_data jsonb,
  hearing_data jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.inventory_categories (
  category_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_name character varying NOT NULL,
  created_at date DEFAULT CURRENT_DATE
);

CREATE TABLE public.inventory_items (
  item_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_name character varying NOT NULL,
  item_description text,
  serial_number character varying,
  product_number character varying,
  category_id integer REFERENCES public.inventory_categories(category_id),
  quantity_in_stock integer DEFAULT 0,
  unit character varying,
  price numeric DEFAULT 0.00,
  reorder_level integer DEFAULT 0,
  last_updated timestamp without time zone DEFAULT now(),
  status status_enum DEFAULT 'active'::status_enum,
  created_at date DEFAULT CURRENT_DATE
);

CREATE TABLE public.prescription_items (
  prescription_item_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prescription_id integer REFERENCES public.prescriptions(prescription_id),
  medicine_id integer REFERENCES public.medicines(medicine_id),
  inventory_item_id integer REFERENCES public.inventory_items(item_id),
  dosage character varying,
  frequency character varying,
  duration_days integer,
  quantity integer,
  instructions text,
  created_at date DEFAULT CURRENT_DATE
);

CREATE TABLE public.suppliers (
  supplier_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  supplier_name character varying NOT NULL,
  contact_person character varying,
  contact_number character varying,
  email character varying,
  address text,
  status status_enum DEFAULT 'active'::status_enum,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.stock_receipts (
  receipt_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  supplier_id integer REFERENCES public.suppliers(supplier_id),
  receipt_date timestamp without time zone DEFAULT now(),
  reference_number character varying,
  total_cost numeric DEFAULT 0.00,
  received_by uuid REFERENCES public.user_profiles(id),
  notes text,
  status character varying DEFAULT 'completed'::character varying,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.stock_receipt_items (
  receipt_item_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  receipt_id integer NOT NULL REFERENCES public.stock_receipts(receipt_id),
  item_id integer NOT NULL REFERENCES public.inventory_items(item_id),
  quantity_received integer NOT NULL,
  unit_cost numeric NOT NULL DEFAULT 0.00,
  batch_number character varying,
  expiry_date date
);

CREATE TABLE public.inventory_movements (
  movement_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_id integer REFERENCES public.inventory_items(item_id),
  movement_type character varying NOT NULL,
  quantity integer NOT NULL,
  movement_date timestamp without time zone DEFAULT now(),
  notes text,
  performed_by uuid REFERENCES public.user_profiles(id)
);

CREATE TABLE public.inventory_withdrawals (
  withdrawal_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  withdrawal_date timestamp without time zone DEFAULT now(),
  notes text,
  customer_name character varying,
  customer_id integer REFERENCES public.patients(patient_id),
  sale_type sale_type_enum DEFAULT 'retail'::sale_type_enum,
  payment_status withdrawal_payment_status_enum DEFAULT 'unpaid'::withdrawal_payment_status_enum,
  amount_due numeric DEFAULT 0.00,
  amount_paid numeric DEFAULT 0.00,
  discount_value numeric DEFAULT 0.00,
  discount_type discount_type_enum DEFAULT 'percentage'::discount_type_enum,
  performed_by uuid REFERENCES public.user_profiles(id),
  status withdrawal_status_enum DEFAULT 'pending'::withdrawal_status_enum,
  created_at date DEFAULT CURRENT_DATE
);

CREATE TABLE public.inventory_withdrawal_items (
  withdrawal_item_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  withdrawal_id integer REFERENCES public.inventory_withdrawals(withdrawal_id),
  item_id integer REFERENCES public.inventory_items(item_id),
  quantity integer NOT NULL,
  created_at date DEFAULT CURRENT_DATE
);

CREATE TABLE public.insurance_providers (
  insurance_provider_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_name character varying NOT NULL,
  contact_number character varying,
  address text,
  status status_enum DEFAULT 'active'::status_enum,
  created_at date DEFAULT CURRENT_DATE
);

CREATE TABLE public.patient_insurance (
  patient_insurance_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer REFERENCES public.patients(patient_id),
  insurance_provider_id integer REFERENCES public.insurance_providers(insurance_provider_id),
  insurance_number character varying,
  coverage_details text,
  effective_date date,
  expiration_date date,
  status status_enum DEFAULT 'active'::status_enum,
  created_at date DEFAULT CURRENT_DATE
);

CREATE TABLE public.billing (
  billing_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id integer REFERENCES public.patients(patient_id),
  appointment_id integer REFERENCES public.appointments(appointment_id),
  amount numeric,
  payment_status payment_status_enum DEFAULT 'pending'::payment_status_enum,
  insurance_claim_status insurance_status_enum DEFAULT 'pending'::insurance_status_enum,
  billing_date timestamp without time zone DEFAULT now(),
  created_at date DEFAULT CURRENT_DATE,
  consultation_fee numeric DEFAULT 0,
  treatment_fee numeric DEFAULT 0,
  medication_fee numeric DEFAULT 0,
  lab_fee numeric DEFAULT 0,
  other_fees numeric DEFAULT 0,
  discount numeric DEFAULT 0
);