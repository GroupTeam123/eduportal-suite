-- Create a separate table for imported students (keeps data completely separate from year tables)
CREATE TABLE public.imported_students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_user_id UUID NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id),
    name TEXT NOT NULL,
    email TEXT,
    contact BIGINT,
    attendance REAL DEFAULT 0,
    guardian_name TEXT,
    guardian_phone TEXT,
    notes TEXT,
    year INTEGER DEFAULT 1,
    student_id TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    marks JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.imported_students ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same as student_records)
CREATE POLICY "Teachers can view own imported students"
ON public.imported_students FOR SELECT
USING (teacher_user_id = auth.uid());

CREATE POLICY "Teachers can insert own imported students"
ON public.imported_students FOR INSERT
WITH CHECK ((teacher_user_id = auth.uid()) AND is_teacher(auth.uid()));

CREATE POLICY "Teachers can update own imported students"
ON public.imported_students FOR UPDATE
USING (teacher_user_id = auth.uid())
WITH CHECK (teacher_user_id = auth.uid());

CREATE POLICY "Teachers can delete own imported students"
ON public.imported_students FOR DELETE
USING (teacher_user_id = auth.uid());

CREATE POLICY "HOD can view department imported students"
ON public.imported_students FOR SELECT
USING (is_hod(auth.uid()) AND EXISTS (
    SELECT 1 FROM departments 
    WHERE departments.id = imported_students.department_id 
    AND departments.hod_user_id = auth.uid()
));

CREATE POLICY "Principal can view all imported students"
ON public.imported_students FOR SELECT
USING (is_principal(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_imported_students_updated_at
BEFORE UPDATE ON public.imported_students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_imported_students_teacher ON public.imported_students(teacher_user_id);
CREATE INDEX idx_imported_students_department ON public.imported_students(department_id);