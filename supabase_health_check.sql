-- =====================================================
-- ACFIT Academy LMS Platform — Database Diagnostic & Health Check
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

-- -----------------------------------------------------
-- TEST 1: ALL TABLES & ROW COUNTS
-- Verifies that all 21 tables exist and are populated.
-- -----------------------------------------------------
SELECT 
    table_name,
    (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, false, '')))[1]::text::int AS total_rows
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- -----------------------------------------------------
-- TEST 2: FOREIGN KEY CONNECTIONS & RELATIONS
-- Verifies all relational integrity linkages between tables.
-- -----------------------------------------------------
SELECT
    tc.table_name AS child_table,
    kcu.column_name AS child_column,
    ccu.table_name AS parent_table,
    ccu.column_name AS parent_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- -----------------------------------------------------
-- TEST 3: ROW LEVEL SECURITY (RLS) STATUS & POLICY COUNTS
-- Verifies security is active and policies exist on each table.
-- -----------------------------------------------------
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename AND p.schemaname = t.schemaname) AS active_policies_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- -----------------------------------------------------
-- TEST 4: DEEP RELATIONAL JOIN QUERY (CATALOG INTEGRITY)
-- Tests 6-table joins (Courses -> Modules -> Lessons -> Assessments -> Enrollments -> Payments).
-- -----------------------------------------------------
SELECT 
    c.id AS course_id,
    c.title AS course_title,
    c.price,
    COUNT(DISTINCT m.id) AS total_modules,
    COUNT(DISTINCT l.id) AS total_lessons,
    COUNT(DISTINCT a.id) AS total_assessments,
    COUNT(DISTINCT e.id) AS total_enrolled_students,
    COUNT(DISTINCT pay.id) AS total_payments_recorded,
    COUNT(DISTINCT r.id) AS total_reviews
FROM public.courses c
LEFT JOIN public.modules m ON m.course_id = c.id
LEFT JOIN public.lessons l ON l.module_id = m.id
LEFT JOIN public.assessments a ON a.course_id = c.id
LEFT JOIN public.enrollments e ON e.course_id = c.id
LEFT JOIN public.payments pay ON pay.course_id = c.id
LEFT JOIN public.course_reviews r ON r.course_id = c.id
GROUP BY c.id, c.title, c.price
ORDER BY c.title;

-- -----------------------------------------------------
-- TEST 5: SYSTEM TRIGGERS & FUNCTIONS AUDIT
-- Verifies auto-user profile creation trigger on auth.users.
-- -----------------------------------------------------
SELECT 
    trigger_name,
    event_object_table AS target_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema IN ('public', 'auth')
ORDER BY event_object_table;
