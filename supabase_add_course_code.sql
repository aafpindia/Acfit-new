-- =====================================================================
-- Migration: Add 'code' Column to 'courses' Table in Supabase
--
-- Run this single statement in your Supabase Dashboard:
-- 1. Open https://supabase.com/dashboard/project/dnjlkecohsagbvmkgymg
-- 2. Go to "SQL Editor" in the left sidebar
-- 3. Paste and run:
-- =====================================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS code TEXT;

-- Update existing live courses with initial standard course codes
UPDATE courses 
SET code = 'AC-FIT-101' 
WHERE (title ILIKE '%Fitness Fundamentals%' OR id = '9fc3320d-4b4a-45cf-89e3-a11e839a66f1')
  AND (code IS NULL OR code = '');

UPDATE courses 
SET code = 'AC-FIT-201' 
WHERE (title ILIKE '%personal trainer%' OR id = 'f1068915-d6ee-4e0f-ace1-4bc561fdbd03')
  AND (code IS NULL OR code = '');

-- Soft-delete & account recovery support (if not yet run)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

