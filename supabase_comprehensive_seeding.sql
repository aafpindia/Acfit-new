-- =====================================================
-- ACFIT Academy LMS — Comprehensive Course Seeding Script
-- Creates 6 modules per course, with 2 lessons,
-- 1 module-level quiz per module (max 3 questions),
-- and 1 final exam per course.
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

BEGIN;

-- Temporarily bypass foreign key constraints for clean truncate/re-seed
SET session_replication_role = 'replica';

-- Clear existing modules, lessons, and assessments to prevent duplication
TRUNCATE TABLE public.assessments CASCADE;
TRUNCATE TABLE public.lessons CASCADE;
TRUNCATE TABLE public.modules CASCADE;

-- Restore foreign key checks
SET session_replication_role = 'origin';

-- =====================================================
-- 1. SEED MODULES (6 modules per course)
-- =====================================================
INSERT INTO public.modules (id, course_id, title, sort_order)
VALUES 
  -- Course 1 (Strength Training Blueprint)
  ('11111111-1111-1111-1111-111111111111', '10101010-1010-1010-1010-101010101010', 'Compound Lift Foundations', 1),
  ('11111111-1111-1111-1111-111111111112', '10101010-1010-1010-1010-101010101010', 'Squat & Leg Mechanics', 2),
  ('11111111-1111-1111-1111-111111111113', '10101010-1010-1010-1010-101010101010', 'Upper Body Push & Press', 3),
  ('11111111-1111-1111-1111-111111111114', '10101010-1010-1010-1010-101010101010', 'Deadlift & Posterior Chain', 4),
  ('11111111-1111-1111-1111-111111111115', '10101010-1010-1010-1010-101010101010', 'Progressive Overload Tactics', 5),
  ('11111111-1111-1111-1111-111111111116', '10101010-1010-1010-1010-101010101010', 'Peaking & Max Testing', 6),

  -- Course 2 (HIIT Cardio & Athletic Masterclass)
  ('22222222-2222-2222-2222-222222222221', '20202020-2020-2020-2020-202020202020', 'Aerobic Foundations', 1),
  ('22222222-2222-2222-2222-222222222222', '20202020-2020-2020-2020-202020202020', 'Tabata & Interval Protocols', 2),
  ('22222222-2222-2222-2222-222222222223', '20202020-2020-2020-2020-202020202020', 'VO2 Max Threshold Conditioning', 3),
  ('22222222-2222-2222-2222-222222222224', '20202020-2020-2020-2020-202020202020', 'Agility & Explosive Speed', 4),
  ('22222222-2222-2222-2222-222222222225', '20202020-2020-2020-2020-202020202020', 'Fat Oxidation & Heart Rate Zones', 5),
  ('22222222-2222-2222-2222-222222222226', '20202020-2020-2020-2020-202020202020', 'Metcon Endurance Test', 6),

  -- Course 3 (Yoga Flow & Mindful Mobility Plan)
  ('33333333-3333-3333-3333-333333333331', '30303030-3030-3030-3030-303030303030', 'Sun Salutations & Breathing', 1),
  ('33333333-3333-3333-3333-333333333332', '30303030-3030-3030-3030-303030303030', 'Hip & Hamstring Mobility', 2),
  ('33333333-3333-3333-3333-333333333333', '30303030-3030-3030-3030-303030303030', 'Spinal Extension & Flexibility', 3),
  ('33333333-3333-3333-3333-333333333334', '30303030-3030-3030-3030-303030303030', 'Active Balance & Stability', 4),
  ('33333333-3333-3333-3333-333333333335', '30303030-3030-3030-3030-303030303030', 'Deep Restoration & Recovery', 5),
  ('33333333-3333-3333-3333-333333333336', '30303030-3030-3030-3030-303030303030', 'Full Vinyasa Flow Challenge', 6),

  -- Course 4 (Fat Loss and Kettlebell Conditioning)
  ('44444444-4444-4444-4444-444444444441', '40404040-4040-4040-4040-404040404040', 'Kettlebell Handing & Safety', 1),
  ('44444444-4444-4444-4444-444444444442', '40404040-4040-4040-4040-404040404040', 'Hip Hinge & Swing Basics', 2),
  ('44444444-4444-4444-4444-444444444443', '40404040-4040-4040-4040-404040404040', 'The Turkish Getup Form', 3),
  ('44444444-4444-4444-4444-444444444444', '40404040-4040-4040-4040-404040404040', 'Clean, Press & Squat Links', 4),
  ('44444444-4444-4444-4444-444444444445', '40404040-4040-4040-4040-404040404040', 'Kettlebell Snatch Progression', 5),
  ('44444444-4444-4444-4444-444444444446', '40404040-4040-4040-4040-404040404040', 'Kettlebell Complex Finisher', 6),

  -- Course 5 (Powerlifting Peak Performance)
  ('55555555-5555-5555-5555-555555555551', '50505050-5050-5050-5050-505050505050', 'Powerlifting Rules & Setup', 1),
  ('55555555-5555-5555-5555-555555555552', '50505050-5050-5050-5050-505050505050', 'Max Squat Force Setup', 2),
  ('55555555-5555-5555-5555-555555555553', '50505050-5050-5050-5050-505050505050', 'Arch & Scapula Bench Setup', 3),
  ('55555555-5555-5555-5555-555555555554', '50505050-5050-5050-5050-505050505050', 'Deadlift Pulling Mechanics', 4),
  ('55555555-5555-5555-5555-555555555555', '50505050-5050-5050-5050-505050505050', 'Powerlifting Peaking Blocks', 5),
  ('55555555-5555-5555-5555-555555555556', '50505050-5050-5050-5050-505050505050', 'Meet Day Strategy & Attempt Rules', 6)
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- 2. SEED LESSONS (2 lessons per module = 12 per course)
-- =====================================================
INSERT INTO public.lessons (id, module_id, title, type, sort_order, content)
VALUES 
  -- Course 1 Lessons
  ('11111111-1111-1111-1111-11111111111a', '11111111-1111-1111-1111-111111111111', 'The Core Lift Architecture', 'rich-text', 1, '{"body":"<h1>Introduction to Compound Lifts</h1><p>Compound exercises utilize multiple joints and large muscle groups concurrently. They form the base of hypertrophic and strength-based regimens.</p>"}'),
  ('11111111-1111-1111-1111-11111111111b', '11111111-1111-1111-1111-111111111111', 'Core Bracing & Diaphragm Breathing', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('11111111-1111-1111-1111-11111111112a', '11111111-1111-1111-1111-111111111112', 'Squat Depth & Hip Alignment', 'rich-text', 1, '{"body":"<h1>Achieving Parallel Squat Depth</h1><p>Lowering your hips until the crease of the hip goes below the knee joint is critical to fully engage lower-body muscle fibers safely.</p>"}'),
  ('11111111-1111-1111-1111-11111111112b', '11111111-1111-1111-1111-111111111112', 'Lower-Body Warmup Mechanics', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('11111111-1111-1111-1111-11111111113a', '11111111-1111-1111-1111-111111111113', 'Bench Press Bar Path Guide', 'rich-text', 1, '{"body":"<h1>Optimal Bench Press Alignment</h1><p>Ensure your shoulder blades are retracted and flush against the pad. Touch the bar to the lower sternum and push in a diagonal path upwards.</p>"}'),
  ('11111111-1111-1111-1111-11111111113b', '11111111-1111-1111-1111-111111111113', 'Shoulder Retraction Protocols', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('11111111-1111-1111-1111-11111111114a', '11111111-1111-1111-1111-111111111114', 'Deadlift Spinal Safety Checklist', 'rich-text', 1, '{"body":"<h1>Neutral Spine Mechanics</h1><p>Keep your back flat during the deadlift pulling phase. Avoid rounding the lumbar spine under load to protect your spinal discs.</p>"}'),
  ('11111111-1111-1111-1111-11111111114b', '11111111-1111-1111-1111-111111111114', 'Sumo vs Conventional Pulling', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('11111111-1111-1111-1111-11111111115a', '11111111-1111-1111-1111-111111111115', 'Adjusting Load & RPE Scales', 'rich-text', 1, '{"body":"<h1>Rate of Perceived Exertion (RPE)</h1><p>RPE allows you to scale weight selections based on daily strength limits. RPE 8 means you could execute exactly 2 more reps before failure.</p>"}'),
  ('11111111-1111-1111-1111-11111111115b', '11111111-1111-1111-1111-111111111115', 'Weekly Volume Tracking Guide', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('11111111-1111-1111-1111-11111111116a', '11111111-1111-1111-1111-111111111116', '1-Rep Max Calculation Protocols', 'rich-text', 1, '{"body":"<h1>Calculating 1RM Safely</h1><p>Use estimated multi-rep formulas rather than maxing out to failure too frequently, ensuring long-term connective tissue health.</p>"}'),
  ('11111111-1111-1111-1111-11111111116b', '11111111-1111-1111-1111-111111111116', 'Max Load Attempt Setup', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),

  -- Course 2 Lessons
  ('22222222-2222-2222-2222-22222222221a', '22222222-2222-2222-2222-222222222221', 'Aerobic Base Building Basics', 'rich-text', 1, '{"body":"<h1>Aerobic Endurance</h1><p>Consistent, low-intensity steady state (LISS) training builds a baseline stroke volume in your heart, priming your recovery splits.</p>"}'),
  ('22222222-2222-2222-2222-22222222221b', '22222222-2222-2222-2222-222222222221', 'Zone 2 Heart Rate Training', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('22222222-2222-2222-2222-22222222222a', '22222222-2222-2222-2222-222222222222', 'Introduction to Tabata intervals', 'rich-text', 1, '{"body":"<h1>Tabata Protocol</h1><p>Tabata requires 20 seconds of max effort followed by 10 seconds of complete rest, repeated for 8 full rounds.</p>"}'),
  ('22222222-2222-2222-2222-22222222222b', '22222222-2222-2222-2222-222222222222', 'Interval Rest Scaling Videos', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('22222222-2222-2222-2222-22222222223a', '22222222-2222-2222-2222-222222222223', 'VO2 Max Thresholds Explained', 'rich-text', 1, '{"body":"<h1>Maximal Oxygen Uptake</h1><p>VO2 max marks the highest rate of oxygen consumption possible. Training near this threshold boosts aerobic stamina.</p>"}'),
  ('22222222-2222-2222-2222-22222222223b', '22222222-2222-2222-2222-222222222223', 'Conditioning Pacing Mechanics', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('22222222-2222-2222-2222-22222222224a', '22222222-2222-2222-2222-222222222224', 'Agility Footwork Drill Guidelines', 'rich-text', 1, '{"body":"<h1>Rapid Footwork Control</h1><p>Coordinate foot movements through ladders and cone grids to build nervous system responsiveness and joint stability.</p>"}'),
  ('22222222-2222-2222-2222-22222222224b', '22222222-2222-2222-2222-222222222224', 'Explosive Plyometric Drills', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('22222222-2222-2222-2222-22222222225a', '22222222-2222-2222-2222-222222222225', 'Fat Oxidation Heart Rate Zones', 'rich-text', 1, '{"body":"<h1>Active Fat Burning Zone</h1><p>Maximize lipolysis by performing steady movements at 60-70% of maximum heart rate bounds.</p>"}'),
  ('22222222-2222-2222-2222-22222222225b', '22222222-2222-2222-2222-222222222225', 'Calculating MHR Limits', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('22222222-2222-2222-2222-22222222226a', '22222222-2222-2222-2222-222222222226', 'Full Metcon Workout Challenge', 'rich-text', 1, '{"body":"<h1>Metcon Endurance Test</h1><p>Perform the combined structural conditioning challenge under 15 minutes, tracking final completion rounds.</p>"}'),
  ('22222222-2222-2222-2222-22222222226b', '22222222-2222-2222-2222-222222222226', 'Conditioning Peak Showcase', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),

  -- Course 3 Lessons
  ('33333333-3333-3333-3333-33333333331a', '33333333-3333-3333-3333-333333333331', 'Sun Salutation Flow Basics', 'rich-text', 1, '{"body":"<h1>Vinyasa Alignments</h1><p>Coordinate breathing patterns through down dog, plank, chaturanga, and upward facing dog sequences.</p>"}'),
  ('33333333-3333-3333-3333-33333333331b', '33333333-3333-3333-3333-333333333331', 'Ujjayi Pranayama Breath Guide', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('33333333-3333-3333-3333-33333333332a', '33333333-3333-3333-3333-333333333332', 'Deep Hip Opening Stretch Positions', 'rich-text', 1, '{"body":"<h1>Hip Mobilities</h1><p>Release glutes, hip flexors, and groin insertions using deep pigeon pose holds to restore pelvic range of motion.</p>"}'),
  ('33333333-3333-3333-3333-33333333332b', '33333333-3333-3333-3333-333333333332', 'Active Hamstring Stretches', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('33333333-3333-3333-3333-33333333333a', '33333333-3333-3333-3333-333333333333', 'Spinal Extension Movements', 'rich-text', 1, '{"body":"<h1>Thoracic Mobility</h1><p>Improve overhead shoulder press lines and posture setups by releasing blockages along the thoracic spine.</p>"}'),
  ('33333333-3333-3333-3333-33333333333b', '33333333-3333-3333-3333-333333333333', 'Cobra & Camel Pose Alignments', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('33333333-3333-3333-3333-33333333334a', '33333333-3333-3333-3333-333333333334', 'Active balance & single leg postures', 'rich-text', 1, '{"body":"<h1>Tree Pose & Warrior Balancing</h1><p>Engage stabilizer muscles in the ankle, foot, and hip rotators to reinforce overall functional stability.</p>"}'),
  ('33333333-3333-3333-3333-33333333334b', '33333333-3333-3333-3333-333333333334', 'Core Stability Posture Holds', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('33333333-3333-3333-3333-33333333335a', '33333333-3333-3333-3333-333333333335', 'Deep Restorative Yin postures', 'rich-text', 1, '{"body":"<h1>Yin Restoration</h1><p>Focus on slow, passive holds (3-5 mins) to stretch connective fascia tissues and downregulate the nervous system.</p>"}'),
  ('33333333-3333-3333-3333-33333333335b', '33333333-3333-3333-3333-333333333335', 'Nervous System Recovery guides', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('33333333-3333-3333-3333-33333333336a', '33333333-3333-3333-3333-333333333336', 'Full Vinyasa Flow Sequence', 'rich-text', 1, '{"body":"<h1>Flow Mastery</h1><p>Link all modules into a challenging 30-minute steady-flow movement pattern, monitoring respiration rate.</p>"}'),
  ('33333333-3333-3333-3333-33333333336b', '33333333-3333-3333-3333-333333333336', 'Advanced Flow Practice', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),

  -- Course 4 Lessons
  ('44444444-4444-4444-4444-44444444441a', '44444444-4444-4444-4444-444444444441', 'Kettlebell handling and grips', 'rich-text', 1, '{"body":"<h1>Holding the Kettlebell</h1><p>Understand the difference between loose-hook grip structures, rack holds, and overhead lockouts to avoid wrist strain.</p>"}'),
  ('44444444-4444-4444-4444-44444444441b', '44444444-4444-4444-4444-444444444441', 'Wrist Protection Mechanics', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('44444444-4444-4444-4444-44444444442a', '44444444-4444-4444-4444-444444444442', 'Hip Hinge Swing Mechanics', 'rich-text', 1, '{"body":"<h1>The KB Hip Hinge</h1><p>Do not squat during kettlebell swings. Hinge forward at the hip joints and snap hips straight using hamstrings and glutes.</p>"}'),
  ('44444444-4444-4444-4444-44444444442b', '44444444-4444-4444-4444-444444444442', 'Two-Hand vs One-Hand Swings', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('44444444-4444-4444-4444-44444444443a', '44444444-4444-4444-4444-444444444443', 'Turkish Getup Step-by-Step setup', 'rich-text', 1, '{"body":"<h1>Turkish Getup Breakdown</h1><p>Break the movement into steps: roll to elbow, push to hand, lift hips, sweep knee, lunge, stand. Keep eyes locked on the bell.</p>"}'),
  ('44444444-4444-4444-4444-44444444443b', '44444444-4444-4444-4444-444444444443', 'Turkish Getup Setup Instruction', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('44444444-4444-4444-4444-44444444444a', '44444444-4444-4444-4444-444444444444', 'Clean and Front Squat integration', 'rich-text', 1, '{"body":"<h1>KB Cleans & Front Squat</h1><p>Clean the kettlebell smoothly into the rack position. Descend into a deep front squat keeping chest proud and torso upright.</p>"}'),
  ('44444444-4444-4444-4444-44444444444b', '44444444-4444-4444-4444-444444444444', 'Double Rack Clean & Squat', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('44444444-4444-4444-4444-44444444445a', '44444444-4444-4444-4444-444444444445', 'Kettlebell Snatch mechanics', 'rich-text', 1, '{"body":"<h1>The KB Snatch</h1><p>Pull the bell upwards along a tight vertical line. Punch your hand through at the top to lock it out without hitting the forearm.</p>"}'),
  ('44444444-4444-4444-4444-44444444445b', '44444444-4444-4444-4444-444444444445', 'Punch-Through Snatch mechanics', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('44444444-4444-4444-4444-44444444446a', '44444444-4444-4444-4444-444444444446', 'Kettlebell Conditioning complexes', 'rich-text', 1, '{"body":"<h1>Conditioning complexes</h1><p>Link swings, cleans, squats, presses, and snatches into a continuous flow structure without putting the bell down.</p>"}'),
  ('44444444-4444-4444-4444-44444444446b', '44444444-4444-4444-4444-444444444446', 'Fat Burning Complexes', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),

  -- Course 5 Lessons
  ('55555555-5555-5555-5555-55555555551a', '55555555-5555-5555-5555-555555555551', 'Powerlifting competition setup rules', 'rich-text', 1, '{"body":"<h1>Meet Setup & Rules</h1><p>Understand the rules of the squat depth command, the bench press press command, and the deadlift down signal guidelines.</p>"}'),
  ('55555555-5555-5555-5555-55555555551b', '55555555-5555-5555-5555-555555555551', 'USAPL IPF Rules Walkthrough', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('55555555-5555-5555-5555-55555555552a', '55555555-5555-5555-5555-555555555552', 'Max Squat setup & hip drive', 'rich-text', 1, '{"body":"<h1>Low Bar Squat Force Production</h1><p>Create a shelf for the bar on your rear deltoids. Maintain brace and drive hips upwards straight from parallel depth.</p>"}'),
  ('55555555-5555-5555-5555-55555555552b', '55555555-5555-5555-5555-555555555552', 'Heavy Squat Walkout Sets', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('55555555-5555-5555-5555-55555555553a', '55555555-5555-5555-5555-555555555553', 'Power Bench Arch & setup mechanics', 'rich-text', 1, '{"body":"<h1>Bench Arch Mechanics</h1><p>Arching the spine and keeping shoulder blades retracted decreases the press path and anchors shoulders for heavy press sets.</p>"}'),
  ('55555555-5555-5555-5555-55555555553b', '55555555-5555-5555-5555-555555555553', 'Arch & Scapula Bench Setup', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('55555555-5555-5555-5555-55555555554a', '55555555-5555-5555-5555-555555555554', 'Sumo vs Conventional pulling mechanics', 'rich-text', 1, '{"body":"<h1>Sumo vs Conventional Pulling</h1><p>Sumo decreases lower back leverage forces by placing hips closer to the bar path. Conventional emphasizes spinal hamstring pulls.</p>"}'),
  ('55555555-5555-5555-5555-55555555554b', '55555555-5555-5555-5555-555555555554', 'Sumo Hip Mobility setups', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('55555555-5555-5555-5555-55555555555a', '55555555-5555-5555-5555-555555555555', 'Powerlifting peaking schedule structures', 'rich-text', 1, '{"body":"<h1>Peaking Block Cycles</h1><p>Gradually taper training volume while peaking intensity to 95%+ in the 2-3 weeks preceding meet day.</p>"}'),
  ('55555555-5555-5555-5555-55555555555b', '55555555-5555-5555-5555-555555555555', 'Heavy Singles Loading Guides', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}'),
  ('55555555-5555-5555-5555-55555555556a', '55555555-5555-5555-5555-555555555556', 'Meet day attempt rules & card selections', 'rich-text', 1, '{"body":"<h1>Attempt Selection</h1><p>Open with a safe weight you can easily hit for a triple. Use second and third attempts to peak to maximum meet records.</p>"}'),
  ('55555555-5555-5555-5555-55555555556b', '55555555-5555-5555-5555-555555555556', 'Weight Attempt Card Tactics', 'video', 2, '{"videoUrl":"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}')
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- 3. SEED MODULE ASSESSMENTS (30 assessments, max 3 Qs)
-- =====================================================
INSERT INTO public.assessments (id, course_id, module_id, title, passing_percentage, timer_seconds, questions, is_final)
VALUES 
  -- Course 1 Module Quizzes
  ('11111111-1111-1111-1111-11111111111c', '10101010-1010-1010-1010-101010101010', '11111111-1111-1111-1111-111111111111', 'Module 1 Assessment: Core Lifting', 66, 120, 
    '[
      {
        "id": "c1-m1-q1",
        "question": "What is the primary purpose of bracing your core during compound lifts?",
        "type": "mcq",
        "options": [
          { "text": "Create intra-abdominal pressure to protect the spine", "isCorrect": true },
          { "text": "Improve oxygen inhalation rates", "isCorrect": false },
          { "text": "Shift weight load onto the upper chest muscles", "isCorrect": false }
        ],
        "explanation": "Bracing creates solid intra-abdominal pressure that stabilizes the lower spine under heavy loads."
      },
      {
        "id": "c1-m1-q2",
        "question": "True or False: Exhaling fully before starting a lift creates the sturdiest spine alignment.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": false },
          { "text": "False", "isCorrect": true }
        ],
        "explanation": "False. You should take a deep diaphragmatic breath and hold it to brace before descending."
      }
    ]'::jsonb, false),

  ('11111111-1111-1111-1111-11111111112c', '10101010-1010-1010-1010-101010101010', '11111111-1111-1111-1111-111111111112', 'Module 2 Assessment: Squat Form', 66, 120, 
    '[
      {
        "id": "c1-m2-q1",
        "question": "To hit depth in a standard squat, the hip crease should drop below which point?",
        "type": "mcq",
        "options": [
          { "text": "The top of the kneecap (parallel)", "isCorrect": true },
          { "text": "Mid-shin level", "isCorrect": false },
          { "text": "Ankle joints level", "isCorrect": false }
        ],
        "explanation": "Hips going parallel or slightly below the kneecap constitutes proper lifting depth."
      },
      {
        "id": "c1-m2-q2",
        "question": "A slight toe flare of 15 to 30 degrees outward is anatomically natural for squats.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": true },
          { "text": "False", "isCorrect": false }
        ],
        "explanation": "True. Flaring the toes slightly outwards accommodates hip socket structures to squat deep safely."
      }
    ]'::jsonb, false),

  ('11111111-1111-1111-1111-11111111113c', '10101010-1010-1010-1010-101010101010', '11111111-1111-1111-1111-111111111113', 'Module 3 Assessment: Bench Press', 66, 120, 
    '[
      {
        "id": "c1-m3-q1",
        "question": "Why is retracting the scapula critical during the bench press?",
        "type": "mcq",
        "options": [
          { "text": "To anchor the shoulders and protect rotators", "isCorrect": true },
          { "text": "To increase bar travel distance", "isCorrect": false }
        ],
        "explanation": "Retraction anchors the shoulder blades, reducing rotator cuff strain."
      }
    ]'::jsonb, false),

  ('11111111-1111-1111-1111-11111111114c', '10101010-1010-1010-1010-101010101010', '11111111-1111-1111-1111-111111111114', 'Module 4 Assessment: Deadlift pull', 66, 120, 
    '[
      {
        "id": "c1-m4-q1",
        "question": "During a conventional deadlift setup, where should the bar be placed relative to your feet?",
        "type": "mcq",
        "options": [
          { "text": "Over the middle of the feet (midfoot)", "isCorrect": true },
          { "text": "Touching the toes", "isCorrect": false }
        ],
        "explanation": "Setting the bar over the midfoot ensures a straight vertical pulling path."
      }
    ]'::jsonb, false),

  ('11111111-1111-1111-1111-11111111115c', '10101010-1010-1010-1010-101010101010', '11111111-1111-1111-1111-111111111115', 'Module 5 Assessment: Volume Planning', 66, 120, 
    '[
      {
        "id": "c1-m5-q1",
        "question": "What does an RPE score of 8 represent on a lift set?",
        "type": "mcq",
        "options": [
          { "text": "You had exactly 2 reps left in reserve", "isCorrect": true },
          { "text": "The weight felt extremely light", "isCorrect": false }
        ],
        "explanation": "RPE 8 leaves 2 reps in reserve before complete failure."
      }
    ]'::jsonb, false),

  ('11111111-1111-1111-1111-11111111116c', '10101010-1010-1010-1010-101010101010', '11111111-1111-1111-1111-111111111116', 'Module 6 Assessment: Max Testing', 66, 120, 
    '[
      {
        "id": "c1-m6-q1",
        "question": "Is it safer to estimate your 1RM using multi-rep max calculators rather than testing to absolute failure?",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": true },
          { "text": "False", "isCorrect": false }
        ],
        "explanation": "True. Estimating based on 3-5 rep sets limits structural injury risks."
      }
    ]'::jsonb, false),


  -- Course 2 Module Quizzes
  ('22222222-2222-2222-2222-22222222221c', '20202020-2020-2020-2020-202020202020', '22222222-2222-2222-2222-222222222221', 'Module 1 Assessment: Cardio Bases', 66, 120, 
    '[
      {
        "id": "c2-m1-q1",
        "question": "What training zone optimizes steady recovery and aerobic stroke volumes?",
        "type": "mcq",
        "options": [
          { "text": "Zone 2", "isCorrect": true },
          { "text": "Zone 5 (Max effort)", "isCorrect": false }
        ],
        "explanation": "Zone 2 keeps heart rates steady, building cardiovascular foundations."
      }
    ]'::jsonb, false),

  ('22222222-2222-2222-2222-22222222222c', '20202020-2020-2020-2020-202020202020', '22222222-2222-2222-2222-222222222222', 'Module 2 Assessment: Tabata Protocol', 66, 120, 
    '[
      {
        "id": "c2-m2-q1",
        "question": "What is the correct work-to-rest ratio of Tabata?",
        "type": "mcq",
        "options": [
          { "text": "20s work, 10s rest", "isCorrect": true },
          { "text": "40s work, 20s rest", "isCorrect": false }
        ],
        "explanation": "Tabata is strictly 20 seconds effort followed by 10 seconds rest."
      }
    ]'::jsonb, false),

  ('22222222-2222-2222-2222-22222222223c', '20202020-2020-2020-2020-202020202020', '22222222-2222-2222-2222-222222222223', 'Module 3 Assessment: VO2 Max', 66, 120, 
    '[
      {
        "id": "c2-m3-q1",
        "question": "VO2 Max stands for which rate?",
        "type": "mcq",
        "options": [
          { "text": "Maximal oxygen uptake rate during intense exercise", "isCorrect": true },
          { "text": "Max heart rate limit", "isCorrect": false }
        ],
        "explanation": "VO2 Max measures maximum oxygen utilization capacity."
      }
    ]'::jsonb, false),

  ('22222222-2222-2222-2222-22222222224c', '20202020-2020-2020-2020-202020202020', '22222222-2222-2222-2222-222222222224', 'Module 4 Assessment: Agility', 66, 120, 
    '[
      {
        "id": "c2-m4-q1",
        "question": "Plyometric drills focus primarily on developing what attribute?",
        "type": "mcq",
        "options": [
          { "text": "Explosive power and stretch-shortening reflexes", "isCorrect": true },
          { "text": "Slow steady endurance strength", "isCorrect": false }
        ],
        "explanation": "Plyometrics target rapid force production and muscle recoil."
      }
    ]'::jsonb, false),

  ('22222222-2222-2222-2222-22222222225c', '20202020-2020-2020-2020-202020202020', '22222222-2222-2222-2222-222222222225', 'Module 5 Assessment: Fat Burn Zones', 66, 120, 
    '[
      {
        "id": "c2-m5-q1",
        "question": "At what MHR percentage is fat oxidation generally prioritized?",
        "type": "mcq",
        "options": [
          { "text": "60% to 70% of maximum heart rate", "isCorrect": true },
          { "text": "90% to 100% of maximum heart rate", "isCorrect": false }
        ],
        "explanation": "Lower-intensity zones burn fat reserves rather than simple glucose stores."
      }
    ]'::jsonb, false),

  ('22222222-2222-2222-2222-22222222226c', '20202020-2020-2020-2020-202020202020', '22222222-2222-2222-2222-222222222226', 'Module 6 Assessment: Metcon Test', 66, 120, 
    '[
      {
        "id": "c2-m6-q1",
        "question": "Metcon stands for Metabolic Conditioning.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": true },
          { "text": "False", "isCorrect": false }
        ],
        "explanation": "True. Metcon workouts target energy pathway conditioning."
      }
    ]'::jsonb, false),


  -- Course 3 Module Quizzes
  ('33333333-3333-3333-3333-33333333331c', '30303030-3030-3030-3030-303030303030', '33333333-3333-3333-3333-333333333331', 'Module 1 Assessment: Yoga Flow', 66, 120, 
    '[
      {
        "id": "c3-m1-q1",
        "question": "Which pose sequence is standard in Vinyasa flow salutations?",
        "type": "mcq",
        "options": [
          { "text": "Plank, Chaturanga, Upward-Dog, Downward-Dog", "isCorrect": true },
          { "text": "Warrior, Tree Pose, Lotus Pose", "isCorrect": false }
        ],
        "explanation": "This forms the foundational transition flow in Sun Salutations."
      }
    ]'::jsonb, false),

  ('33333333-3333-3333-3333-33333333332c', '30303030-3030-3030-3030-303030303030', '33333333-3333-3333-3333-333333333332', 'Module 2 Assessment: Hip Opening', 66, 120, 
    '[
      {
        "id": "c3-m2-q1",
        "question": "Which pose releases glute structures effectively?",
        "type": "mcq",
        "options": [
          { "text": "Pigeon Pose", "isCorrect": true },
          { "text": "Camel Pose", "isCorrect": false }
        ],
        "explanation": "Pigeon targets deep gluteal rotation elements."
      }
    ]'::jsonb, false),

  ('33333333-3333-3333-3333-33333333333c', '30303030-3030-3030-3030-303030303030', '33333333-3333-3333-3333-333333333333', 'Module 3 Assessment: Spinal Extension', 66, 120, 
    '[
      {
        "id": "c3-m3-q1",
        "question": "Thoracic spine extension improves shoulder press setup paths.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": true },
          { "text": "False", "isCorrect": false }
        ],
        "explanation": "True. Flexible upper backs allow straight vertical press lines."
      }
    ]'::jsonb, false),

  ('33333333-3333-3333-3333-33333333334c', '30303030-3030-3030-3030-303030303030', '33333333-3333-3333-3333-333333333334', 'Module 4 Assessment: Balance', 66, 120, 
    '[
      {
        "id": "c3-m4-q1",
        "question": "What is key to balancing on one foot?",
        "type": "mcq",
        "options": [
          { "text": "Engaging foot arches and locking eyes on a fixed point", "isCorrect": true },
          { "text": "Holding your breath", "isCorrect": false }
        ],
        "explanation": "Core brace, active feet, and sight focus stabilizes balance."
      }
    ]'::jsonb, false),

  ('33333333-3333-3333-3333-33333333335c', '30303030-3030-3030-3030-303030303030', '33333333-3333-3333-3333-333333333335', 'Module 5 Assessment: Yin Recovery', 66, 120, 
    '[
      {
        "id": "c3-m5-q1",
        "question": "Yin yoga focuses on fast, dynamic movements.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": false },
          { "text": "False", "isCorrect": true }
        ],
        "explanation": "False. Yin focuses on passive, long posture holds (3-5 minutes)."
      }
    ]'::jsonb, false),

  ('33333333-3333-3333-3333-33333333336c', '30303030-3030-3030-3030-303030303030', '33333333-3333-3333-3333-333333333336', 'Module 6 Assessment: Flow Mastery', 66, 120, 
    '[
      {
        "id": "c3-m6-q1",
        "question": "Vinyasa flow synchronizes motion with respiration patterns.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": true },
          { "text": "False", "isCorrect": false }
        ],
        "explanation": "True. Inhales open posture frames, exhales close or stretch them."
      }
    ]'::jsonb, false),


  -- Course 4 Module Quizzes
  ('44444444-4444-4444-4444-44444444441c', '40404040-4040-4040-4040-404040404040', '44444444-4444-4444-4444-444444444441', 'Module 1 Assessment: KB Grip Safety', 66, 120, 
    '[
      {
        "id": "c4-m1-q1",
        "question": "What is standard to protect wrists in a rack position?",
        "type": "mcq",
        "options": [
          { "text": "Keep wrist straight with hand punched through the handle", "isCorrect": true },
          { "text": "Let the wrist round backwards", "isCorrect": false }
        ],
        "explanation": "Straight wrist alignments prevent handle pressure and tendon fatigue."
      }
    ]'::jsonb, false),

  ('44444444-4444-4444-4444-44444444442c', '40404040-4040-4040-4040-404040404040', '44444444-4444-4444-4444-444444444442', 'Module 2 Assessment: Hinge Swings', 66, 120, 
    '[
      {
        "id": "c4-m2-q1",
        "question": "The kettlebell swing is a squatting movement.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": false },
          { "text": "False", "isCorrect": true }
        ],
        "explanation": "False. It is a hip hinge movement powered by glutes and hamstrings."
      }
    ]'::jsonb, false),

  ('44444444-4444-4444-4444-44444444443c', '40404040-4040-4040-4040-404040404040', '44444444-4444-4444-4444-444444444443', 'Module 3 Assessment: Getup Form', 66, 120, 
    '[
      {
        "id": "c4-m3-q1",
        "question": "Where should your focus be during a Turkish Getup?",
        "type": "mcq",
        "options": [
          { "text": "Locked onto the kettlebell handle overhead", "isCorrect": true },
          { "text": "Directly at the floor", "isCorrect": false }
        ],
        "explanation": "Looking at the bell helps maintain stability throughout transitions."
      }
    ]'::jsonb, false),

  ('44444444-4444-4444-4444-44444444444c', '40404040-4040-4040-4040-404040404040', '44444444-4444-4444-4444-444444444444', 'Module 4 Assessment: Clean & Squat', 66, 120, 
    '[
      {
        "id": "c4-m4-q1",
        "question": "What is key to front squatting with kettlebells?",
        "type": "mcq",
        "options": [
          { "text": "Keeping a proud vertical chest in the rack position", "isCorrect": true },
          { "text": "Leaning as far forward as possible", "isCorrect": false }
        ],
        "explanation": "Upright postures balance rack weight distributions on the chest."
      }
    ]'::jsonb, false),

  ('44444444-4444-4444-4444-44444444445c', '40404040-4040-4040-4040-404040404040', '44444444-4444-4444-4444-444444444445', 'Module 5 Assessment: Snatch Path', 66, 120, 
    '[
      {
        "id": "c4-m5-q1",
        "question": "The snatch path should stay close to the body center line.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": true },
          { "text": "False", "isCorrect": false }
        ],
        "explanation": "True. Pulling tight vertically controls velocity safely."
      }
    ]'::jsonb, false),

  ('44444444-4444-4444-4444-44444444446c', '40404040-4040-4040-4040-404040404040', '44444444-4444-4444-4444-444444444446', 'Module 6 Assessment: Complexes', 66, 120, 
    '[
      {
        "id": "c4-m6-q1",
        "question": "Conditioning complexes require resting between each single exercise.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": false },
          { "text": "False", "isCorrect": true }
        ],
        "explanation": "False. Complexes combine movements without resting the bell."
      }
    ]'::jsonb, false),


  -- Course 5 Module Quizzes
  ('55555555-5555-5555-5555-55555555551c', '50505050-5050-5050-5050-505050505050', '55555555-5555-5555-5555-555555555551', 'Module 1 Assessment: Power Rules', 66, 120, 
    '[
      {
        "id": "c5-m1-q1",
        "question": "What signals you to drop the bar in a deadlift?",
        "type": "mcq",
        "options": [
          { "text": "The referee down command", "isCorrect": true },
          { "text": "Reaching lockout", "isCorrect": false }
        ],
        "explanation": "Dropping the bar before the down command invalidates the attempt."
      }
    ]'::jsonb, false),

  ('55555555-5555-5555-5555-55555555552c', '50505050-5050-5050-5050-505050505050', '55555555-5555-5555-5555-555555555552', 'Module 2 Assessment: Squat Peaking', 66, 120, 
    '[
      {
        "id": "c5-m2-q1",
        "question": "Hip drive should initiate directly from parallel squat depth.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": true },
          { "text": "False", "isCorrect": false }
        ],
        "explanation": "True. Lead with hips to fire glutes and break inertia."
      }
    ]'::jsonb, false),

  ('55555555-5555-5555-5555-55555555553c', '50505050-5050-5050-5050-505050505050', '55555555-5555-5555-5555-555555555553', 'Module 3 Assessment: Bench Press Setup', 66, 120, 
    '[
      {
        "id": "c5-m3-q1",
        "question": "Leg drive is useless in the bench press.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": false },
          { "text": "False", "isCorrect": true }
        ],
        "explanation": "False. Driving legs into the floor transfers force up the arch."
      }
    ]'::jsonb, false),

  ('55555555-5555-5555-5555-55555555554c', '50505050-5050-5050-5050-505050505050', '55555555-5555-5555-5555-555555555554', 'Module 4 Assessment: Pull Setup', 66, 120, 
    '[
      {
        "id": "c5-m4-q1",
        "question": "Which deadlift stance requires wider feet setup?",
        "type": "mcq",
        "options": [
          { "text": "Sumo stance", "isCorrect": true },
          { "text": "Conventional stance", "isCorrect": false }
        ],
        "explanation": "Sumo positions place feet near weight collars."
      }
    ]'::jsonb, false),

  ('55555555-5555-5555-5555-55555555555c', '50505050-5050-5050-5050-505050505050', '55555555-5555-5555-5555-555555555555', 'Module 5 Assessment: Peaking', 66, 120, 
    '[
      {
        "id": "c5-m5-q1",
        "question": "Peaking cycles increase volume close to competition.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": false },
          { "text": "False", "isCorrect": true }
        ],
        "explanation": "False. Peaking tapers volume down while pushing intensity high."
      }
    ]'::jsonb, false),

  ('55555555-5555-5555-5555-55555555556c', '50505050-5050-5050-5050-505050505050', '55555555-5555-5555-5555-555555555556', 'Module 6 Assessment: Meet Day', 66, 120, 
    '[
      {
        "id": "c5-m6-q1",
        "question": "The first attempt should be roughly equal to your absolute max.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": false },
          { "text": "False", "isCorrect": true }
        ],
        "explanation": "False. Open with a safe weight you can easily hit for 3 repetitions."
      }
    ]'::jsonb, false)
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- 4. SEED FINAL EXAMS (1 per course, 3 questions each, is_final = true)
-- =====================================================
INSERT INTO public.assessments (id, course_id, module_id, title, passing_percentage, timer_seconds, questions, is_final)
VALUES 
  -- Course 1 Final Exam
  ('11111111-1111-1111-1111-11111111111d', '10101010-1010-1010-1010-101010101010', NULL, 'Strength Foundations Final Certification Exam', 75, 300, 
    '[
      {
        "id": "c1-f-q1",
        "question": "What is progressive overload?",
        "type": "mcq",
        "options": [
          { "text": "Gradually increasing load, volume, or difficulty over time", "isCorrect": true },
          { "text": "Lifting maximum load to failure every session", "isCorrect": false },
          { "text": "Performing cardio between lift sets", "isCorrect": false }
        ],
        "explanation": "Progressive overload continuously challenges muscles to trigger growth and adaptations."
      },
      {
        "id": "c1-f-q2",
        "question": "Which lift primarily targets the posterior chain (hamstrings, glutes, lower back)?",
        "type": "mcq",
        "options": [
          { "text": "Barbell Deadlift", "isCorrect": true },
          { "text": "Barbell Bench Press", "isCorrect": false },
          { "text": "Bicep curl", "isCorrect": false }
        ],
        "explanation": "Deadlifts are the ultimate hinge movement for posterior fiber activation."
      },
      {
        "id": "c1-f-q3",
        "question": "Proper thoracic spine extension is helpful to maintain bar balance in squats.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": true },
          { "text": "False", "isCorrect": false }
        ],
        "explanation": "True. Upright chest alignments keep the barbell center of gravity balanced over the midfoot."
      }
    ]'::jsonb, true),

  -- Course 2 Final Exam
  ('22222222-2222-2222-2222-22222222222d', '20202020-2020-2020-2020-202020202020', NULL, 'Athletic Conditioning Final Certification Exam', 75, 300, 
    '[
      {
        "id": "c2-f-q1",
        "question": "Agility cone drills develop which system components?",
        "type": "mcq",
        "options": [
          { "text": "Nervous coordination and ankle stabilizer balance", "isCorrect": true },
          { "text": "Absolute lifting force capacity", "isCorrect": false }
        ],
        "explanation": "Agility drills train rapid direction changes and kinetic responses."
      },
      {
        "id": "c2-f-q2",
        "question": "Tabata protocols consist of how many work intervals?",
        "type": "mcq",
        "options": [
          { "text": "8 cycles of 20s effort / 10s rest", "isCorrect": true },
          { "text": "4 cycles of 60s effort / 30s rest", "isCorrect": false }
        ],
        "explanation": "Standard Tabata structure is 8 rounds of 20s work / 10s rest."
      },
      {
        "id": "c2-f-q3",
        "question": "Zone 2 training is performed at high maximal heart rate levels.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": false },
          { "text": "False", "isCorrect": true }
        ],
        "explanation": "False. Zone 2 training keeps intensity low and steady to improve fat metabolism."
      }
    ]'::jsonb, true),

  -- Course 3 Final Exam
  ('33333333-3333-3333-3333-33333333333d', '30303030-3030-3030-3030-303030303030', NULL, 'Yoga & Mobility Flow Final Certification Exam', 75, 300, 
    '[
      {
        "id": "c3-f-q1",
        "question": "Which of these is a major recovery goal of Vinyasa Flow?",
        "type": "mcq",
        "options": [
          { "text": "Integrating breathing with active joint extensions", "isCorrect": true },
          { "text": "Maximal power peak creation", "isCorrect": false }
        ],
        "explanation": "Vinyasa flow blends rhythmic respiration with mobility postures to relieve tension."
      },
      {
        "id": "c3-f-q2",
        "question": "Deep Yin stretches are held for at least how long?",
        "type": "mcq",
        "options": [
          { "text": "3 to 5 minutes passively", "isCorrect": true },
          { "text": "10 seconds actively", "isCorrect": false }
        ],
        "explanation": "Yin stretches are held for minutes to stress connective deep tissues."
      },
      {
        "id": "c3-f-q3",
        "question": "Chaturanga is a spinal extension posture.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": false },
          { "text": "False", "isCorrect": true }
        ],
        "explanation": "False. Chaturanga is a low pushup plank posture engaging core and shoulders."
      }
    ]'::jsonb, true),

  -- Course 4 Final Exam
  ('44444444-4444-4444-4444-44444444444d', '40404040-4040-4040-4040-404040404040', NULL, 'Kettlebell Conditioning Final Certification Exam', 75, 300, 
    '[
      {
        "id": "c4-f-q1",
        "question": "Which lift involves a step-by-step rolling, sweeps, and standing phase?",
        "type": "mcq",
        "options": [
          { "text": "Turkish Getup", "isCorrect": true },
          { "text": "Kettlebell Swing", "isCorrect": false }
        ],
        "explanation": "Turkish getups are complex, step-by-step multi-plane stabilization movements."
      },
      {
        "id": "c4-f-q2",
        "question": "What represents a proper clean rack position setup?",
        "type": "mcq",
        "options": [
          { "text": "Bell resting on the forearm, tucked close to chest center", "isCorrect": true },
          { "text": "Handle held above shoulder heights", "isCorrect": false }
        ],
        "explanation": "Proper rack position supports weight safely along chest frameworks."
      },
      {
        "id": "c4-f-q3",
        "question": "Snatch repetitions use a standard deep front squat descent.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": false },
          { "text": "False", "isCorrect": true }
        ],
        "explanation": "False. The snatch is a hip hinge vertical pull lock overhead."
      }
    ]'::jsonb, true),

  -- Course 5 Final Exam
  ('55555555-5555-5555-5555-55555555555d', '50505050-5050-5050-5050-505050505050', NULL, 'Powerlifting Peak Performance Final Certification Exam', 75, 300, 
    '[
      {
        "id": "c5-f-q1",
        "question": "What determines a legal squat attempt in competition?",
        "type": "mcq",
        "options": [
          { "text": "Crease of the hips must drops below the top of knees", "isCorrect": true },
          { "text": "Thighs must stay strictly horizontal to floor", "isCorrect": false }
        ],
        "explanation": "IPF standards require hip crease passing below top of knees."
      },
      {
        "id": "c5-f-q2",
        "question": "Sumo deadlifts decrease conventional lower back lever force demands.",
        "type": "boolean",
        "options": [
          { "text": "True", "isCorrect": true },
          { "text": "False", "isCorrect": false }
        ],
        "explanation": "True. Wide foot Sumo stance allows hips to sit closer to the bar path."
      },
      {
        "id": "c5-f-q3",
        "question": "Meet day selections require opening with 100% of maximum single lift.",
        "type": "mcq",
        "options": [
          { "text": "False, open with a safe weight (~90% of max)", "isCorrect": true },
          { "text": "True, lock down the biggest record immediately", "isCorrect": false }
        ],
        "explanation": "Openers should be a safe, clean weight to build meet card scores."
      }
    ]'::jsonb, true);

-- =====================================================
-- 4. SEED ADDITIONAL EXTENDED TABLES
-- =====================================================

-- Ensure Categories Table & Columns Exist
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

-- Seed Categories
INSERT INTO public.categories (id, name, slug, icon, description) VALUES
  ('90000000-0000-0000-0000-000000000001', 'Strength Training', 'strength-training', 'Dumbbell', 'Heavy lifts, progressive overload, and power mechanics'),
  ('90000000-0000-0000-0000-000000000002', 'Cardio Fitness', 'cardio-fitness', 'Activity', 'HIIT, aerobic conditioning, and fat loss drills'),
  ('90000000-0000-0000-0000-000000000003', 'Mobility & Recovery', 'mobility-recovery', 'Heart', 'Active stretching, yoga flows, and joint health'),
  ('90000000-0000-0000-0000-000000000004', 'General Fitness', 'general-fitness', 'Zap', 'Functional movement and total body conditioning')
ON CONFLICT (id) DO NOTHING;

-- Ensure Subscriptions Types, Table & Columns Exist
DO $$ BEGIN
  CREATE TYPE membership_tier AS ENUM ('free', 'standard_tier', 'premium_vip');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier membership_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Subscriptions
INSERT INTO public.subscriptions (id, user_id, tier, status, current_period_start, current_period_end) VALUES 
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f1', 'da896585-64ad-438f-a89e-2dc7ff520448', 'premium_vip', 'active', NOW(), NOW() + INTERVAL '1 year'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', 'standard_tier', 'active', NOW(), NOW() + INTERVAL '1 month'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f3', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', 'standard_tier', 'active', NOW(), NOW() + INTERVAL '1 month'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f4', 'b1a20de9-25a7-47b1-9b16-95ff372076ab', 'standard_tier', 'active', NOW(), NOW() + INTERVAL '1 month'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f5', 'a3f40de9-35a7-47b1-9b16-95ff372076aa', 'free', 'active', NOW(), NOW() + INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- Ensure Coupons Table & Columns Exist
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

-- Seed Coupons
INSERT INTO public.coupons (code, discount_percent, valid_until) VALUES
  ('FLEX20', 20.00, NOW() + INTERVAL '30 days'),
  ('WELCOME10', 10.00, NOW() + INTERVAL '60 days')
ON CONFLICT (code) DO NOTHING;

-- Ensure Course Reviews Table & Columns Exist
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

-- Seed Course Reviews
INSERT INTO public.course_reviews (course_id, user_id, rating, review_text) VALUES
  ('10101010-1010-1010-1010-101010101010', 'f9b00de9-75a7-47b1-9b16-95ff372076ad', 5, 'Exceptional strength progression course! Clear form breakdown on squats and deadlifts.'),
  ('20202020-2020-2020-2020-202020202020', 'c2d10ae9-15a7-47b1-9b16-95ff372076ac', 5, 'High energy Tabata intervals. Burned max calories in 20 minutes!')
ON CONFLICT (course_id, user_id) DO NOTHING;

-- Ensure Live Sessions Table & Columns Exist
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

-- Seed Live Sessions
INSERT INTO public.live_sessions (course_id, instructor_id, title, meeting_url, meeting_provider, start_time, duration_minutes, status) VALUES
  ('10101010-1010-1010-1010-101010101010', 'da896585-64ad-438f-a89e-2dc7ff520448', 'Live Q&A: Barbell Squat Depth & Hip Pain Fixes', 'https://zoom.us/j/123456789', 'Zoom', NOW() + INTERVAL '2 days', 45, 'scheduled')
ON CONFLICT (id) DO NOTHING;

COMMIT;
