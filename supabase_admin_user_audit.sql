-- =====================================================
-- ACFIT Academy LMS — Admin vs User Integration & Access Query Suite
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

-- -----------------------------------------------------
-- QUERY 1: ADMIN & USER ROSTER DISTRIBUTION
-- Verifies user role segmentation (Admins vs Regular Users & Active vs Suspended)
-- -----------------------------------------------------
SELECT 
    role,
    status,
    COUNT(*) AS total_users,
    STRING_AGG(full_name, ', ') AS sample_users
FROM public.profiles
GROUP BY role, status
ORDER BY role;

-- -----------------------------------------------------
-- QUERY 2: ADMIN COURSE CREATION & USER ENROLLMENT FLOW
-- Verifies Admin course ownership (created_by), published state, and user enrollments
-- -----------------------------------------------------
SELECT 
    c.id AS course_id,
    c.title AS course_title,
    p_admin.full_name AS instructor_or_creator,
    c.published AS is_published_to_users,
    c.price,
    COUNT(DISTINCT m.id) AS modules_count,
    COUNT(DISTINCT l.id) AS lessons_count,
    COUNT(DISTINCT e.id) AS enrolled_students_count
FROM public.courses c
LEFT JOIN public.profiles p_admin ON c.created_by = p_admin.id
LEFT JOIN public.modules m ON m.course_id = c.id
LEFT JOIN public.lessons l ON l.module_id = m.id
LEFT JOIN public.enrollments e ON e.course_id = c.id
GROUP BY c.id, c.title, p_admin.full_name, c.published, c.price
ORDER BY enrolled_students_count DESC;

-- -----------------------------------------------------
-- QUERY 3: STUDENT LEARNING CYCLE (PROGRESS -> ATTEMPTS -> CERTIFICATES)
-- Verifies user interaction data visible on Admin Dashboards & Analytics
-- -----------------------------------------------------
SELECT 
    p_user.full_name AS student_name,
    p_user.email AS student_email,
    c.title AS course_title,
    COUNT(DISTINCT prog.id) AS lessons_completed,
    COUNT(DISTINCT att.id) AS quiz_attempts_made,
    MAX(att.score) AS highest_quiz_score,
    CASE WHEN cert.id IS NOT NULL THEN 'ISSUED' ELSE 'IN PROGRESS' END AS certificate_status
FROM public.enrollments e
JOIN public.profiles p_user ON e.user_id = p_user.id
JOIN public.courses c ON e.course_id = c.id
LEFT JOIN public.progress prog ON prog.user_id = p_user.id AND prog.course_id = c.id AND prog.completed = true
LEFT JOIN public.attempts att ON att.user_id = p_user.id AND att.course_id = c.id
LEFT JOIN public.certificates cert ON cert.user_id = p_user.id AND cert.course_id = c.id
GROUP BY p_user.id, p_user.full_name, p_user.email, c.id, c.title, cert.id
ORDER BY student_name;

-- -----------------------------------------------------
-- QUERY 4: USER PAYMENTS & ADMIN REVENUE FLOW
-- Summarizes payment transactions processed from User checkout to Admin Revenue tracking
-- -----------------------------------------------------
SELECT 
    pay.status AS payment_status,
    pay.method AS payment_method,
    COUNT(pay.id) AS transaction_count,
    SUM(pay.amount) AS total_revenue_usd,
    STRING_AGG(DISTINCT pay.student_name, ', ') AS paying_students
FROM public.payments pay
GROUP BY pay.status, pay.method;

-- -----------------------------------------------------
-- QUERY 5: ADMIN SECURITY ACCESS CONTROL (RLS POLICIES CHECK)
-- Audits Row Level Security policies ensuring Admins have elevated CRUD privileges
-- -----------------------------------------------------
SELECT 
    tablename,
    policyname,
    roles,
    cmd AS operation, -- SELECT, INSERT, UPDATE, DELETE, ALL
    qual AS read_condition,
    with_check AS write_condition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
