-- Add semester column to student_records (1 = first semester, 2 = second semester within the year)
ALTER TABLE public.student_records 
ADD COLUMN semester integer DEFAULT 1;

-- Add semester column to imported_students as well
ALTER TABLE public.imported_students 
ADD COLUMN semester integer DEFAULT 1;

-- Add constraint to ensure semester is 1 or 2
ALTER TABLE public.student_records 
ADD CONSTRAINT student_records_semester_check CHECK (semester IN (1, 2));

ALTER TABLE public.imported_students 
ADD CONSTRAINT imported_students_semester_check CHECK (semester IN (1, 2));