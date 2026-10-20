-- =====================================================
-- ACFIT Academy LMS — Complete Seed Data Script
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

BEGIN;

-- Temporarily bypass foreign key constraints for bulk insertion
SET session_replication_role = 'replica';

-- 1. SEED AUTH.USERS (Bypass credentials setup)
INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
VALUES 
  ('da896585-64ad-438f-a89e-2dc7ff520448', 'karthik@acfitacademy.com', '{"full_name":"Karthik Raja","role":"admin"}', 'authenticated', 'authenticated'),
  ('f9b00de9-75a7-47b1-9b16-95ff372076ad', 'suganth@acfitacademy.com', '{"full_name":"Suganth Selvam","role":"user"}', 'authenticated', 'authenticated'),
  ('c2d10ae9-15a7-47b1-9b16-95ff372076ac', 'priya@acfitacademy.com', '{"full_name":"Priya Krishnan","role":"user"}', 'authenticated', 'authenticated'),
  ('b1a20de9-25a7-47b1-9b16-95ff372076ab', 'vignesh@acfitacademy.com', '{"full_name":"Vignesh Swamy","role":"user"}', 'authenticated', 'authenticated'),
  ('a3f40de9-35a7-47b1-9b16-95ff372076aa', 'anitha@acfitacademy.com', '{"full_name":"Anitha Loganathan","role":"user"}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED PUBLIC.PROFILES
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

-- 3. SEED COURSES (Gym Catalog)
INSERT INTO public.courses (id, title, description, category, difficulty, price, instructor, thumbnail, published)
VALUES 
  ('10101010-1010-1010-1010-101010101010', '30-Day Lean Muscle & Strength Blueprint', 'Master progressive overload, lift with correct form, and build a strong foundation using compound exercises.', 'Strength Training', 'Beginner', 49.00, 'Karthik Raja', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600', true),
  ('20202020-2020-2020-2020-202020202020', 'HIIT Cardio & Athletic Conditioning Masterclass', 'High intensity conditioning circuit to optimize cardiovascular performance and burn fat fast.', 'Cardio Fitness', 'Intermediate', 29.00, 'Suganth Selvam', 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600', true),
  ('30303030-3030-3030-3030-303030303030', 'Yoga Flow & Mindful Mobility Plan', 'Restore active range of motion, improve muscle length, and optimize recovery parameters.', 'Mobility & Recovery', 'Beginner', 19.00, 'Priya Krishnan', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', true),
  ('40404040-4040-4040-4040-404040404040', 'Fat Loss and Kettlebell Conditioning', 'Explosive functional movements for conditioning, stamina, and quick calorie burns.', 'General Fitness', 'Intermediate', 39.00, 'Vignesh Swamy', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600', true),
  ('50505050-5050-5050-5050-505050505050', 'Powerlifting Peak Performance Program', 'Focused training on heavy squat, bench press, and deadlift peaking schedules.', 'Strength Training', 'Advanced', 59.00, 'Anitha Loganathan', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600', true)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED MODULES (Multiple modules per course)
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES 
  -- Course 1 (Strength) Modules
  ('11111111-1111-1111-1111-111111111111', '10101010-1010-1010-1010-101010101010', 'Compound Lift Mechanics', 1),
  ('11111111-1111-1111-1111-111111111112', '10101010-1010-1010-1010-101010101010', 'Progressive Overload Planning', 2),
  ('11111111-1111-1111-1111-111111111113', '10101010-1010-1010-1010-101010101010', 'Strength Peak Cycles', 3),

  -- Course 2 (Cardio) Modules
  ('22222222-2222-2222-2222-222222222222', '20202020-2020-2020-2020-202020202020', 'High-Intensity Aerobic Thresholds', 1),
  ('22222222-2222-2222-2222-222222222223', '20202020-2020-2020-2020-202020202020', 'Endurance & Speed Building', 2),

  -- Course 3 (Yoga) Modules
  ('33333333-3333-3333-3333-333333333333', '30303030-3030-3030-3030-303030303030', 'Vinyasa Flow Foundation', 1),
  ('33333333-3333-3333-3333-333333333334', '30303030-3030-3030-3030-303030303030', 'Mobility & Recovery Rest', 2)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED LESSONS (Multiple lessons per module, mix of videos, rich text, and PDFs)
INSERT INTO public.lessons (id, module_id, title, type, sort_order, content)
VALUES 
  -- Course 1, Module 1 Lessons
  ('11111111-1111-1111-1111-11111111111a', '11111111-1111-1111-1111-111111111111', 'Squat Form & Core Bracing', 'rich-text', 1, 
    '{"body": "<h1>Proper Squat Form & Spine Safety</h1><p>The barbell squat is one of the most effective compound lifts for lower body hypertrophy. Achieving depth while keeping the spine neutral is critical.</p><h3>Key Checkpoints:</h3><ul><li><strong>Foot Stance:</strong> Shoulder-width apart, toes flared out about 15-30 degrees.</li><li><strong>Core Bracing:</strong> Take a deep belly breath and tighten your abs as if you are about to get punched.</li><li><strong>Depth:</strong> Lower your hips until the crease of your hip goes below the top of your kneecap (parallel).</li></ul>"}'),
  
  ('11111111-1111-1111-1111-11111111111b', '11111111-1111-1111-1111-111111111111', 'Barbell Deadlift Setup Video', 'video', 2, 
    '{"videoUrl": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4", "duration": "3:45", "body": "Watch this deadlift walkthrough outlining correct hip hinge and bar path guidelines."}'),
  
  ('11111111-1111-1111-1111-11111111111c', '11111111-1111-1111-1111-111111111111', 'Bench Press Setup & Retraction', 'pdf', 3, 
    '{"pdfUrl": "https://pdfobject.com/pdf/sample.pdf", "body": "Download this setup checklist for proper shoulder blade retraction and leg drive during the bench press."}'),

  -- Course 1, Module 2 Lessons
  ('11111111-1111-1111-1111-11111111112a', '11111111-1111-1111-1111-111111111112', 'Understanding Progressive Overload', 'rich-text', 1, 
    '{"body": "<h1>Progressive Overload Core Principles</h1><p>To force adaptations and build lean muscle, you must increase the work demands on your skeletal muscle. This can be accomplished by:</p><ul><li>Increasing weight load</li><li>Increasing repetitions per set</li><li>Reducing rest periods between sets</li><li>Improving range of motion</li></ul>"}'),
  
  ('11111111-1111-1111-1111-11111111112b', '11111111-1111-1111-1111-111111111112', 'Weekly Volume Tracking Guide', 'video', 2, 
    '{"videoUrl": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4", "duration": "4:20", "body": "Learn how to record working sets in your training logs and adjust volume parameter variables."}'),

  -- Course 2, Module 1 Lessons
  ('22222222-2222-2222-2222-22222222222a', '22222222-2222-2222-2222-222222222222', 'Tabata Cardio Intervals', 'rich-text', 1, 
    '{"body": "<h1>High-Intensity Tabata Intervals</h1><p>Tabata training is a quick 4-minute conditioning workout protocol. Perform 20 seconds of maximum effort, followed by 10 seconds of complete rest. Repeat for 8 cycles.</p>"}'),
  
  ('22222222-2222-2222-2222-22222222222b', '22222222-2222-2222-2222-222222222222', 'VO2 Max Conditioning Drill', 'video', 2, 
    '{"videoUrl": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4", "duration": "5:30", "body": "High heart-rate training video detailing threshold paces and rest splits."}'),

  -- Course 3, Module 1 Lessons
  ('33333333-3333-3333-3333-33333333333a', '33333333-3333-3333-3333-333333333333', 'Sun Salutation A Flow', 'rich-text', 1, 
    '{"body": "<h1>Vinyasa Sun Salutations</h1><p>Perform the classic Vinyasa flow transition sequence linking breath with physical movement. Focus on spinal extension and core bracing.</p>"}'),
  
  ('33333333-3333-3333-3333-33333333333b', '33333333-3333-3333-3333-333333333333', 'Deep Hip Opening Stretch Routine', 'video', 2, 
    '{"videoUrl": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4", "duration": "8:15", "body": "Follow along with this slow yoga recovery session focused on joint mobility and active stretching."}')
ON CONFLICT (id) DO NOTHING;

-- 6. SEED ASSESSMENTS (Module-level quizzes with JSON questions)
INSERT INTO public.assessments (id, course_id, module_id, title, passing_percentage, timer_seconds, questions, is_final)
VALUES 
  -- Strength Module 1 Assessment
  ('11111111-1111-1111-1111-11111111111c', '10101010-1010-1010-1010-101010101010', '11111111-1111-1111-1111-111111111111', 'Module 1 Assessment: Compound Lift Form', 50, 120, 
    '[
      {
        "id": "q-strength-1",
        "question": "Which of the following is crucial to do before starting a heavy barbell squat?",
        "type": "mcq",
        "options": [
          { "text": "Take a deep belly breath and brace the core", "isCorrect": true },
          { "text": "Exhale fully to release back tension", "isCorrect": false },
          { "text": "Look down directly at your feet", "isCorrect": false }
        ],
        "explanation": "Bracing the core by breathing into the diaphragm creates intra-abdominal pressure that protects the lower spine."
      },
      {
        "id": "q-strength-2",
        "question": "True or False: The feet must always point exactly forward during a squat.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": false },
          { "text": "False", "isCorrect": true }
        ],
        "explanation": "False. A slight outward toe flare of 15 to 30 degrees is anatomically natural for most hip sockets to hit depth."
      }
    ]'::jsonb, false),

  -- Cardio Module 1 Assessment
  ('22222222-2222-2222-2222-22222222222c', '20202020-2020-2020-2020-202020202020', '22222222-2222-2222-2222-222222222222', 'Module 1 Assessment: High-Intensity Thresholds', 60, 180, 
    '[
      {
        "id": "q-cardio-1",
        "question": "What is the standard workout-to-rest ratio in a classical Tabata interval cycle?",
        "type": "mcq",
        "options": [
          { "text": "20 seconds effort, 10 seconds rest", "isCorrect": true },
          { "text": "30 seconds effort, 30 seconds rest", "isCorrect": false },
          { "text": "10 seconds effort, 20 seconds rest", "isCorrect": false }
        ],
        "explanation": "Tabata consists of 8 intervals of 20 seconds high-intensity activity followed by 10 seconds rest."
      }
    ]'::jsonb, false)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED ENROLLMENTS
INSERT INTO public.enrollments (id, user_id, course_id)
VALUES 
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '10101010-1010-1010-1010-101010101010'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', '20202020-2020-2020-2020-202020202020'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'b1a20de9-25a7-47b1-9b16-95ff372076ab', '30303030-3030-3030-3030-303030303030'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', 'a3f40de9-35a7-47b1-9b16-95ff372076aa', '40404040-4040-4040-4040-404040404040'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '50505050-5050-5050-5050-505050505050')
ON CONFLICT (id) DO NOTHING;

-- 8. SEED PAYMENTS (Logs successful sales invoices)
INSERT INTO public.payments (id, user_id, course_id, student_name, student_email, course_title, amount, currency, status, method)
VALUES 
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a1', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '10101010-1010-1010-1010-101010101010', 'Suganth Selvam', 'suganth@acfitacademy.com', '30-Day Lean Muscle & Strength Blueprint', 49.00, 'USD', 'successful', 'Razorpay'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', '20202020-2020-2020-2020-202020202020', 'Priya Krishnan', 'priya@acfitacademy.com', 'HIIT Cardio & Athletic Conditioning Masterclass', 29.00, 'USD', 'successful', 'Razorpay'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a3', 'b1a20de9-25a7-47b1-9b16-95ff372076ab', '30303030-3030-3030-3030-303030303030', 'Vignesh Swamy', 'vignesh@acfitacademy.com', 'Yoga Flow & Mindful Mobility Plan', 19.00, 'USD', 'successful', 'Razorpay'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a4', 'a3f40de9-35a7-47b1-9b16-95ff372076aa', '40404040-4040-4040-4040-404040404040', 'Anitha Loganathan', 'anitha@acfitacademy.com', 'Fat Loss and Kettlebell Conditioning', 39.00, 'USD', 'successful', 'Razorpay'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a5', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '50505050-5050-5050-5050-505050505050', 'Suganth Selvam', 'suganth@acfitacademy.com', 'Powerlifting Peak Performance Program', 59.00, 'USD', 'successful', 'Razorpay')
ON CONFLICT (id) DO NOTHING;

-- 9. SEED SUBSCRIPTIONS
INSERT INTO public.subscriptions (id, user_id, tier, status, current_period_start, current_period_end)
VALUES 
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f1', 'da896585-64ad-438f-a89e-2dc7ff520448', 'premium_vip', 'active', now(), now() + interval '1 year'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', 'standard_tier', 'active', now(), now() + interval '1 month'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f3', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', 'standard_tier', 'active', now(), now() + interval '1 month'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f4', 'b1a20de9-25a7-47b1-9b16-95ff372076ab', 'standard_tier', 'active', now(), now() + interval '1 month'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f5', 'a3f40de9-35a7-47b1-9b16-95ff372076aa', 'free', 'active', now(), now() + interval '1 month')
ON CONFLICT (id) DO NOTHING;

-- 10. SEED PROGRESS (Lesson complete marks)
INSERT INTO public.progress (id, user_id, course_id, lesson_id, completed)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '10101010-1010-1010-1010-101010101010', '11111111-1111-1111-1111-11111111111a', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', '20202020-2020-2020-2020-202020202020', '22222222-2222-2222-2222-22222222222a', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'b1a20de9-25a7-47b1-9b16-95ff372076ab', '30303030-3030-3030-3030-303030303030', '33333333-3333-3333-3333-33333333333a', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'a3f40de9-35a7-47b1-9b16-95ff372076aa', '40404040-4040-4040-4040-404040404040', '44444444-4444-4444-4444-44444444444a', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '50505050-5050-5050-5050-505050505050', '55555555-5555-5555-5555-55555555555a', true)
ON CONFLICT (id) DO NOTHING;

-- 11. SEED CERTIFICATES
INSERT INTO public.certificates (id, user_id, course_id, full_name, course_title)
VALUES 
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '10101010-1010-1010-1010-101010101010', 'Suganth Selvam', '30-Day Lean Muscle & Strength Blueprint'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', '20202020-2020-2020-2020-202020202020', 'Priya Krishnan', 'HIIT Cardio & Athletic Conditioning Masterclass'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'b1a20de9-25a7-47b1-9b16-95ff372076ab', '30303030-3030-3030-3030-303030303030', 'Vignesh Swamy', 'Yoga Flow & Mindful Mobility Plan'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'a3f40de9-35a7-47b1-9b16-95ff372076aa', '40404040-4040-4040-4040-404040404040', 'Anitha Loganathan', 'Fat Loss and Kettlebell Conditioning'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', '50505050-5050-5050-5050-505050505050', 'Suganth Selvam', 'Powerlifting Peak Performance Program')
ON CONFLICT (id) DO NOTHING;

-- 12. SEED ANNOUNCEMENTS
INSERT INTO public.announcements (id, title, body, target)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'ACFIT Academy Server Maintenance', 'We will undergo system maintenance on Sunday at 2 AM IST.', 'all'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'New Compound Movements Program Added', 'Check out the new Powerlifting peaking schedule released today!', 'all'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Strength Class Tip: Spine Alignment', 'Always brace your core and keep spine neutral during heavy squats.', '10101010-1010-1010-1010-101010101010'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Mobility Flow Tip: Recovery Frequency', 'Do the Yoga sun salutation sequence daily for active restoration.', '30303030-3030-3030-3030-303030303030'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Kettlebell swing safety checklist', 'Make sure to pivot your hips instead of squatting during kb swings.', '40404040-4040-4040-4040-404040404040')
ON CONFLICT (id) DO NOTHING;

COMMIT;
