
-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  teacher_user_id UUID NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_students junction table (many-to-many)
CREATE TABLE public.course_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_record_id UUID NOT NULL REFERENCES public.student_records(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_record_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_students ENABLE ROW LEVEL SECURITY;

-- Courses RLS policies
CREATE POLICY "Teachers can view own courses" ON public.courses FOR SELECT USING (teacher_user_id = auth.uid());
CREATE POLICY "Teachers can insert own courses" ON public.courses FOR INSERT WITH CHECK (teacher_user_id = auth.uid() AND is_teacher(auth.uid()));
CREATE POLICY "Teachers can update own courses" ON public.courses FOR UPDATE USING (teacher_user_id = auth.uid()) WITH CHECK (teacher_user_id = auth.uid());
CREATE POLICY "Teachers can delete own courses" ON public.courses FOR DELETE USING (teacher_user_id = auth.uid());
CREATE POLICY "HOD can view department courses" ON public.courses FOR SELECT USING (is_hod(auth.uid()) AND EXISTS (SELECT 1 FROM departments WHERE departments.id = courses.department_id AND departments.hod_user_id = auth.uid()));
CREATE POLICY "Principal can view all courses" ON public.courses FOR SELECT USING (is_principal(auth.uid()));

-- Course_students RLS policies
CREATE POLICY "Teachers can view own course students" ON public.course_students FOR SELECT USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_students.course_id AND courses.teacher_user_id = auth.uid()));
CREATE POLICY "Teachers can add students to own courses" ON public.course_students FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_students.course_id AND courses.teacher_user_id = auth.uid()));
CREATE POLICY "Teachers can remove students from own courses" ON public.course_students FOR DELETE USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_students.course_id AND courses.teacher_user_id = auth.uid()));
CREATE POLICY "HOD can view department course students" ON public.course_students FOR SELECT USING (EXISTS (SELECT 1 FROM courses JOIN departments ON departments.id = courses.department_id WHERE courses.id = course_students.course_id AND departments.hod_user_id = auth.uid()));
CREATE POLICY "Principal can view all course students" ON public.course_students FOR SELECT USING (is_principal(auth.uid()));

-- Trigger for updated_at on courses
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
