-- =====================================================
-- LMS Platform — Supabase Database Migration
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. PROFILES (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'LMS User',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. COURSES
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'Beginner',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  instructor TEXT NOT NULL DEFAULT 'Platform Instructor',
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
  students INTEGER NOT NULL DEFAULT 0,
  duration TEXT DEFAULT '0 hours',
  thumbnail TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MODULES
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LESSONS
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'rich-text',
  sort_order INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ASSESSMENTS (module quizzes and final exams)
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_percentage INTEGER NOT NULL DEFAULT 60,
  timer_seconds INTEGER NOT NULL DEFAULT 120,
  questions JSONB NOT NULL DEFAULT '[]',
  is_final BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ENROLLMENTS
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- 7. PROGRESS (lesson completion tracking)
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- 8. ATTEMPTS (assessment submission history)
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CERTIFICATES
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- 10. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  course_title TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'successful',
  method TEXT NOT NULL DEFAULT 'Free Enrollment',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT 'all',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11B. ENQUIRIES & ADMISSIONS LEADS
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'landing_modal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. SYSTEM SETTINGS (single-row config)
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_name TEXT NOT NULL DEFAULT 'LMS Platform',
  contact_email TEXT NOT NULL DEFAULT 'support@lms.com',
  razorpay_key TEXT DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  bunny_library_id TEXT DEFAULT '',
  bunny_api_key TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_assessments_course ON assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessments_module ON assessments(module_id);
CREATE INDEX IF NOT EXISTS idx_assessments_lesson ON assessments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_course ON progress(course_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

-- =====================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP (trigger)
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'LMS User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- COURSES (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
CREATE POLICY "Anyone can view courses" ON courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
CREATE POLICY "Admins can insert courses" ON courses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update courses" ON courses;
CREATE POLICY "Admins can update courses" ON courses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
CREATE POLICY "Admins can delete courses" ON courses FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- MODULES (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view modules" ON modules;
CREATE POLICY "Anyone can view modules" ON modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage modules" ON modules;
CREATE POLICY "Admins can manage modules" ON modules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- LESSONS (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ASSESSMENTS (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view assessments" ON assessments;
CREATE POLICY "Anyone can view assessments" ON assessments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage assessments" ON assessments;
CREATE POLICY "Admins can manage assessments" ON assessments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ENROLLMENTS (user can read own, admin can read all)
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
CREATE POLICY "Admins can view all enrollments" ON enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can enroll themselves" ON enrollments;
CREATE POLICY "Users can enroll themselves" ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PROGRESS (user can read/write own, admin can read all)
DROP POLICY IF EXISTS "Users can view own progress" ON progress;
CREATE POLICY "Users can view own progress" ON progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all progress" ON progress;
CREATE POLICY "Admins can view all progress" ON progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can insert own progress" ON progress;
CREATE POLICY "Users can insert own progress" ON progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON progress;
CREATE POLICY "Users can update own progress" ON progress FOR UPDATE USING (auth.uid() = user_id);

-- ATTEMPTS (user can read/write own, admin can read all)
DROP POLICY IF EXISTS "Users can view own attempts" ON attempts;
CREATE POLICY "Users can view own attempts" ON attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all attempts" ON attempts;
CREATE POLICY "Admins can view all attempts" ON attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can insert own attempts" ON attempts;
CREATE POLICY "Users can insert own attempts" ON attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CERTIFICATES (public read for verification)
DROP POLICY IF EXISTS "Anyone can view certificates" ON certificates;
CREATE POLICY "Anyone can view certificates" ON certificates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own certificates" ON certificates;
CREATE POLICY "Users can insert own certificates" ON certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PAYMENTS (user can view own, admin can view all)
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ANNOUNCEMENTS (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view announcements" ON announcements;
CREATE POLICY "Anyone can view announcements" ON announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ENQUIRIES (public insert, admin manage)
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit enquiries" ON enquiries;
CREATE POLICY "Anyone can submit enquiries" ON enquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage enquiries" ON enquiries;
CREATE POLICY "Admins can manage enquiries" ON enquiries FOR ALL USING (true);

-- SYSTEM SETTINGS (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view settings" ON system_settings;
CREATE POLICY "Anyone can view settings" ON system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update settings" ON system_settings;
CREATE POLICY "Admins can update settings" ON system_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- 13. SUBSCRIPTIONS (Membership Plans)
-- =====================================================
CREATE TYPE membership_tier AS ENUM ('free', 'standard_tier', 'premium_vip');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'expired');

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier membership_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- 14. ROADBLOCKS & PROGRESS ANALYTICS VIEW
-- =====================================================
CREATE OR REPLACE VIEW public.vw_lesson_roadblocks AS
SELECT 
  l.id AS lesson_id,
  l.title AS lesson_title,
  c.title AS program_title,
  COUNT(DISTINCT p.user_id) FILTER (WHERE p.completed IS NOT TRUE) AS stuck_members_count
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
LEFT JOIN progress p ON l.id = p.lesson_id
GROUP BY l.id, l.title, c.title;

-- =====================================================
-- 15. ATOMIC COURSE & SYLLABI CREATION TRANSACTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_full_course(
  course_data JSONB,
  modules_data JSONB
) RETURNS UUID AS $$
DECLARE
  new_course_id UUID;
  mod_record JSONB;
  les_record JSONB;
  new_mod_id UUID;
  new_les_id UUID;
BEGIN
  -- 1. Insert course metadata
  INSERT INTO courses (title, description, category, difficulty, price, instructor, thumbnail, published)
  VALUES (
    course_data->>'title',
    course_data->>'description',
    COALESCE(course_data->>'category', 'General'),
    COALESCE(course_data->>'difficulty', 'Beginner'),
    COALESCE((course_data->>'price')::NUMERIC, 0),
    COALESCE(course_data->>'instructor', 'Platform Instructor'),
    course_data->>'thumbnail',
    COALESCE((course_data->>'published')::BOOLEAN, true)
  ) RETURNING id INTO new_course_id;

  -- 2. Insert modules and nested lessons
  FOR mod_record IN SELECT * FROM jsonb_array_elements(modules_data) LOOP
    INSERT INTO modules (course_id, title, sort_order)
    VALUES (
      new_course_id,
      mod_record->>'title',
      COALESCE((mod_record->>'sort_order')::INTEGER, 0)
    ) RETURNING id INTO new_mod_id;

    IF mod_record ? 'lessons' THEN
      FOR les_record IN SELECT * FROM jsonb_array_elements(mod_record->'lessons') LOOP
        INSERT INTO lessons (module_id, title, type, sort_order, content)
        VALUES (
          new_mod_id,
          les_record->>'title',
          COALESCE(les_record->>'type', 'rich-text'),
          COALESCE((les_record->>'sort_order')::INTEGER, 0),
          COALESCE(les_record->'content', '{}'::JSONB)
        ) RETURNING id INTO new_les_id;
      END LOOP;
    END IF;
  END LOOP;

  RETURN new_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 16. SEED DATA (TAMIL NADU NAMES & GYM CATALOG)
-- =====================================================

BEGIN;

-- Temporarily disable foreign key constraints to allow seeding profiles directly
SET session_replication_role = 'replica';

-- Seed auth.users with matching credentials (compatible with all Supabase setups)
INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
VALUES 
  ('da896585-64ad-438f-a89e-2dc7ff520448', 'karthik@acfitacademy.com', '{"full_name":"Karthik Raja","role":"admin"}', 'authenticated', 'authenticated'),
  ('f9b00de9-75a7-47b1-9b16-95ff372076ad', 'suganth@acfitacademy.com', '{"full_name":"Suganth Selvam","role":"user"}', 'authenticated', 'authenticated'),
  ('c2d10ae9-15a7-47b1-9b16-95ff372076ac', 'priya@acfitacademy.com', '{"full_name":"Priya Krishnan","role":"user"}', 'authenticated', 'authenticated'),
  ('b1a20de9-25a7-47b1-9b16-95ff372076ab', 'vignesh@acfitacademy.com', '{"full_name":"Vignesh Swamy","role":"user"}', 'authenticated', 'authenticated'),
  ('a3f40de9-35a7-47b1-9b16-95ff372076aa', 'anitha@acfitacademy.com', '{"full_name":"Anitha Loganathan","role":"user"}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Seed profiles directly into public.profiles
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES 
  ('da896585-64ad-438f-a89e-2dc7ff520448', 'karthik@acfitacademy.com', 'Karthik Raja', 'admin', 'active'),
  ('f9b00de9-75a7-47b1-9b16-95ff372076ad', 'suganth@acfitacademy.com', 'Suganth Selvam', 'user', 'active'),
  ('c2d10ae9-15a7-47b1-9b16-95ff372076ac', 'priya@acfitacademy.com', 'Priya Krishnan', 'user', 'active'),
  ('b1a20de9-25a7-47b1-9b16-95ff372076ab', 'vignesh@acfitacademy.com', 'Vignesh Swamy', 'user', 'active'),
  ('a3f40de9-35a7-47b1-9b16-95ff372076aa', 'anitha@acfitacademy.com', 'Anitha Loganathan', 'user', 'active')
ON CONFLICT (id) DO NOTHING;

-- Restore foreign key checks
SET session_replication_role = 'origin';

-- Seed 5 gym courses
INSERT INTO public.courses (id, title, description, category, difficulty, price, instructor, thumbnail, published)
VALUES 
  ('10101010-1010-1010-1010-101010101010', '30-Day Lean Muscle & Strength Blueprint', 'Master progressive overload, lift with correct form, and build a strong foundation using compound exercises.', 'Strength Training', 'Beginner', 49.00, 'Karthik Raja', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600', true),
  ('20202020-2020-2020-2020-202020202020', 'HIIT Cardio & Athletic Conditioning Masterclass', 'High intensity conditioning circuit to optimize cardiovascular performance and burn fat fast.', 'Cardio Fitness', 'Intermediate', 29.00, 'Suganth Selvam', 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600', true),
  ('30303030-3030-3030-3030-303030303030', 'Yoga Flow & Mindful Mobility Plan', 'Restore active range of motion, improve muscle length, and optimize recovery parameters.', 'Mobility & Recovery', 'Beginner', 19.00, 'Priya Krishnan', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', true),
  ('40404040-4040-4040-4040-404040404040', 'Fat Loss and Kettlebell Conditioning', 'Explosive functional movements for conditioning, stamina, and quick calorie burns.', 'General Fitness', 'Intermediate', 39.00, 'Vignesh Swamy', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600', true),
  ('50505050-5050-5050-5050-505050505050', 'Powerlifting Peak Performance Program', 'Focused training on heavy squat, bench press, and deadlift peaking schedules.', 'Strength Training', 'Advanced', 59.00, 'Anitha Loganathan', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600', true)
ON CONFLICT (id) DO NOTHING;

-- Seed 5 modules (one for each course)
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '10101010-1010-1010-1010-101010101010', 'Compound Lift Mechanics', 1),
  ('22222222-2222-2222-2222-222222222222', '20202020-2020-2020-2020-202020202020', 'High-Intensity Aerobic Thresholds', 1),
  ('33333333-3333-3333-3333-333333333333', '30303030-3030-3030-3030-303030303030', 'Vinyasa Flow Foundation', 1),
  ('44444444-4444-4444-4444-444444444444', '40404040-4040-4040-4040-404040404040', 'Kettlebell Swings & Snatch Basics', 1),
  ('55555555-5555-5555-5555-555555555555', '50505050-5050-5050-5050-505050505050', 'Squat & Bench Press peaking setups', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed lessons (10 total, 2 for each module)
INSERT INTO public.lessons (id, module_id, title, type, sort_order, content)
VALUES 
  ('11111111-1111-1111-1111-11111111111a', '11111111-1111-1111-1111-111111111111', 'Squat Form & Core Bracing', 'rich-text', 1, '{"body":"Proper low bar squat setup guidelines..."}'),
  ('11111111-1111-1111-1111-11111111111b', '11111111-1111-1111-1111-111111111111', 'Barbell Deadlift Setup Video', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('22222222-2222-2222-2222-22222222222a', '22222222-2222-2222-2222-222222222222', 'Tabata Cardio Intervals', 'rich-text', 1, '{"body":"Execute 20 seconds work, 10 seconds rest..."}'),
  ('22222222-2222-2222-2222-22222222222b', '22222222-2222-2222-2222-222222222222', 'VO2 Max Conditioning Drill', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('33333333-3333-3333-3333-33333333333a', '33333333-3333-3333-3333-333333333333', 'Sun Salutation A Flow', 'rich-text', 1, '{"body":"Step-by-step upward dog and downward dog pose sequence..."}'),
  ('33333333-3333-3333-3333-33333333333b', '33333333-3333-3333-3333-333333333333', 'Deep Hip Opening stretch routine', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('44444444-4444-4444-4444-44444444444a', '44444444-4444-4444-4444-444444444444', 'Kettlebell Swing Hip Hinge Mechanics', 'rich-text', 1, '{"body":"Keep a neutral spine while swinging the kettlebell..."}'),
  ('44444444-4444-4444-4444-44444444444b', '44444444-4444-4444-4444-444444444444', 'Turkish Getup Setup Instruction', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('55555555-5555-5555-5555-55555555555a', '55555555-5555-5555-5555-555555555555', 'Bench Press Setup & Shoulder Retraction', 'rich-text', 1, '{"body":"Arch your back slightly and retract scapula..."}'),
  ('55555555-5555-5555-5555-55555555555b', '55555555-5555-5555-5555-555555555555', 'Sumo vs Conventional deadlifts', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}')
ON CONFLICT (id) DO NOTHING;

-- Seed 5 enrollments
INSERT INTO public.enrollments (id, user_id, course_id)
VALUES 
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '10101010-1010-1010-1010-101010101010'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', '20202020-2020-2020-2020-202020202020'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'b1a20de9-25a7-47b1-9b16-95ff372076ab', '30303030-3030-3030-3030-303030303030'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', 'a3f40de9-35a7-47b1-9b16-95ff372076aa', '40404040-4040-4040-4040-404040404040'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '50505050-5050-5050-5050-505050505050')
ON CONFLICT (id) DO NOTHING;

-- Seed 5 payments
INSERT INTO public.payments (id, user_id, course_id, student_name, student_email, course_title, amount, currency, status, method)
VALUES 
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a1', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '10101010-1010-1010-1010-101010101010', 'Suganth Selvam', 'suganth@acfitacademy.com', '30-Day Lean Muscle & Strength Blueprint', 49.00, 'USD', 'successful', 'Razorpay'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', '20202020-2020-2020-2020-202020202020', 'Priya Krishnan', 'priya@acfitacademy.com', 'HIIT Cardio & Athletic Conditioning Masterclass', 29.00, 'USD', 'successful', 'Razorpay'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a3', 'b1a20de9-25a7-47b1-9b16-95ff372076ab', '30303030-3030-3030-3030-303030303030', 'Vignesh Swamy', 'vignesh@acfitacademy.com', 'Yoga Flow & Mindful Mobility Plan', 19.00, 'USD', 'successful', 'Razorpay'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a4', 'a3f40de9-35a7-47b1-9b16-95ff372076aa', '40404040-4040-4040-4040-404040404040', 'Anitha Loganathan', 'anitha@acfitacademy.com', 'Fat Loss and Kettlebell Conditioning', 39.00, 'USD', 'successful', 'Razorpay'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a5', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '50505050-5050-5050-5050-505050505050', 'Suganth Selvam', 'suganth@acfitacademy.com', 'Powerlifting Peak Performance Program', 59.00, 'USD', 'successful', 'Razorpay')
ON CONFLICT (id) DO NOTHING;

-- Seed 5 subscriptions
INSERT INTO public.subscriptions (id, user_id, tier, status, current_period_start, current_period_end)
VALUES 
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f1', 'da896585-64ad-438f-a89e-2dc7ff520448', 'premium_vip', 'active', now(), now() + interval '1 year'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', 'standard_tier', 'active', now(), now() + interval '1 month'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f3', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', 'standard_tier', 'active', now(), now() + interval '1 month'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f4', 'b1a20de9-25a7-47b1-9b16-95ff372076ab', 'standard_tier', 'active', now(), now() + interval '1 month'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f5', 'a3f40de9-35a7-47b1-9b16-95ff372076aa', 'free', 'active', now(), now() + interval '1 month')
ON CONFLICT (id) DO NOTHING;

-- Seed 5 progress records
INSERT INTO public.progress (id, user_id, course_id, lesson_id, completed)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '10101010-1010-1010-1010-101010101010', '11111111-1111-1111-1111-11111111111a', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', '20202020-2020-2020-2020-202020202020', '22222222-2222-2222-2222-22222222222a', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'b1a20de9-25a7-47b1-9b16-95ff372076ab', '30303030-3030-3030-3030-303030303030', '33333333-3333-3333-3333-33333333333a', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'a3f40de9-35a7-47b1-9b16-95ff372076aa', '40404040-4040-4040-4040-404040404040', '44444444-4444-4444-4444-44444444444a', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '50505050-5050-5050-5050-505050505050', '55555555-5555-5555-5555-55555555555a', true)
ON CONFLICT (id) DO NOTHING;

-- Seed 5 certificates
INSERT INTO public.certificates (id, user_id, course_id, full_name, course_title)
VALUES 
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '10101010-1010-1010-1010-101010101010', 'Suganth Selvam', '30-Day Lean Muscle & Strength Blueprint'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', '20202020-2020-2020-2020-202020202020', 'Priya Krishnan', 'HIIT Cardio & Athletic Conditioning Masterclass'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'b1a20de9-25a7-47b1-9b16-95ff372076ab', '30303030-3030-3030-3030-303030303030', 'Vignesh Swamy', 'Yoga Flow & Mindful Mobility Plan'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'a3f40de9-35a7-47b1-9b16-95ff372076aa', '40404040-4040-4040-4040-404040404040', 'Anitha Loganathan', 'Fat Loss and Kettlebell Conditioning'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '50505050-5050-5050-5050-505050505050', 'Suganth Selvam', 'Powerlifting Peak Performance Program')
ON CONFLICT (id) DO NOTHING;

-- Seed 5 announcements
INSERT INTO public.announcements (id, title, body, target)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'ACFIT Academy Server Maintenance', 'We will undergo system maintenance on Sunday at 2 AM IST.', 'all'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'New Compound Movements Program Added', 'Check out the new Powerlifting peaking schedule released today!', 'all'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Strength Class Tip: Spine Alignment', 'Always brace your core and keep spine neutral during heavy squats.', '10101010-1010-1010-1010-101010101010'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Mobility Flow Tip: Recovery Frequency', 'Do the Yoga sun salutation sequence daily for active restoration.', '30303030-3030-3030-3030-303030303030'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Kettlebell swing safety checklist', 'Make sure to pivot your hips instead of squatting during kb swings.', '40404040-4040-4040-4040-404040404040')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 17. ADDITIONAL ESSENTIAL LMS & GYM PLATFORM TABLES
-- =====================================================

-- 17.1 COURSE REVIEWS
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);
ALTER TABLE public.course_reviews ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5;
ALTER TABLE public.course_reviews ADD COLUMN IF NOT EXISTS review_text TEXT;

-- 17.2 LESSON COMMENTS / DISCUSSION FORUM
CREATE TABLE IF NOT EXISTS public.lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17.3 USER NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17.4 LIVE SESSIONS & WEBINARS
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  meeting_provider TEXT DEFAULT 'Zoom',
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS meeting_url TEXT;
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS meeting_provider TEXT DEFAULT 'Zoom';
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';

-- 17.5 INSTRUCTORS & TRAINER PROFILES
CREATE TABLE IF NOT EXISTS public.instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  social_links JSONB DEFAULT '{}'
);

-- 17.6 DYNAMIC CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;

-- 17.7 COUPONS & DISCOUNT PROMO CODES
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  valid_until TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 100;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 17.8 AUDIT & ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR NEW TABLES
CREATE INDEX IF NOT EXISTS idx_reviews_course ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_comments_lesson ON lesson_comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_course ON live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- RLS FOR NEW TABLES
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR NEW TABLES
CREATE POLICY "Anyone can view reviews" ON course_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON lesson_comments FOR SELECT USING (true);
CREATE POLICY "Users can post comments" ON lesson_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view live sessions" ON live_sessions FOR SELECT USING (true);
CREATE POLICY "Admins manage live sessions" ON live_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can view instructors" ON instructors FOR SELECT USING (true);
CREATE POLICY "Admins manage instructors" ON instructors FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can view active coupons" ON coupons FOR SELECT USING (active = true);
CREATE POLICY "Admins manage coupons" ON coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins view audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- SEED DATA FOR NEW TABLES
INSERT INTO public.categories (name, slug, icon, description) VALUES
  ('Strength Training', 'strength-training', 'Dumbbell', 'Heavy lifts, progressive overload, and power mechanics'),
  ('Cardio Fitness', 'cardio-fitness', 'Activity', 'HIIT, aerobic conditioning, and fat loss drills'),
  ('Mobility & Recovery', 'mobility-recovery', 'Heart', 'Active stretching, yoga flows, and joint health'),
  ('General Fitness', 'general-fitness', 'Zap', 'Functional movement and total body conditioning')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.coupons (code, discount_percent, valid_until) VALUES
  ('FLEX20', 20.00, NOW() + INTERVAL '30 days'),
  ('WELCOME10', 10.00, NOW() + INTERVAL '60 days')
ON CONFLICT (code) DO NOTHING;

COMMIT;
