-- Add year column to track which year the student is in (1, 2, 3, or 4)
ALTER TABLE public.student_records 
ADD COLUMN year integer DEFAULT 1 CHECK (year >= 1 AND year <= 4);

-- Add student_id column for unique student identification (like roll number)
ALTER TABLE public.student_records 
ADD COLUMN student_id text;

-- Add custom_fields column for dynamic fields added by teachers
ALTER TABLE public.student_records 
ADD COLUMN custom_fields jsonb DEFAULT '{}';

-- Add marks/grades columns for report generation
ALTER TABLE public.student_records 
ADD COLUMN marks jsonb DEFAULT '{}';

-- Create index for faster lookups by student_id and name
CREATE INDEX idx_student_records_student_id ON public.student_records(student_id);
CREATE INDEX idx_student_records_year ON public.student_records(year);