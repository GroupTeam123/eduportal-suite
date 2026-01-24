-- Drop the unused legacy 'students' table
-- This table is not used in the application (confirmed by code search)
-- The application uses 'student_records' table instead which has proper RLS

DROP POLICY IF EXISTS "allow_all_select" ON public.students;
DROP TABLE IF EXISTS public.students;