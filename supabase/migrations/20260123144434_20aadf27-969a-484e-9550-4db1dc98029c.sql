-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('teacher', 'hod', 'principal');

-- Create enum for report status
CREATE TYPE public.report_status AS ENUM ('draft', 'submitted_to_hod', 'submitted_to_principal', 'approved');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create departments table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    hod_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Create teacher_department_assignments table
CREATE TABLE public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (teacher_user_id, department_id)
);

-- Create enhanced students table (keeping existing structure but adding user link)
CREATE TABLE public.student_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    contact BIGINT,
    attendance REAL DEFAULT 0,
    guardian_name TEXT,
    guardian_phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create reports table
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reporter_role app_role NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    submitted_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    chart_data JSONB,
    status report_status DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- =====================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Check if user is a teacher
CREATE OR REPLACE FUNCTION public.is_teacher(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'teacher')
$$;

-- Check if user is an HOD
CREATE OR REPLACE FUNCTION public.is_hod(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'hod')
$$;

-- Check if user is a principal
CREATE OR REPLACE FUNCTION public.is_principal(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'principal')
$$;

-- Get user's department ID (for teachers)
CREATE OR REPLACE FUNCTION public.get_user_department(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT department_id FROM public.teacher_assignments
    WHERE teacher_user_id = _user_id
    LIMIT 1
$$;

-- Get HOD's department ID
CREATE OR REPLACE FUNCTION public.get_hod_department(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.departments
    WHERE hod_user_id = _user_id
    LIMIT 1
$$;

-- Check if user can access a department
CREATE OR REPLACE FUNCTION public.can_access_department(_user_id UUID, _department_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        public.is_principal(_user_id) OR
        EXISTS (SELECT 1 FROM public.departments WHERE id = _department_id AND hod_user_id = _user_id) OR
        EXISTS (SELECT 1 FROM public.teacher_assignments WHERE teacher_user_id = _user_id AND department_id = _department_id)
$$;

-- =====================================================
-- RLS POLICIES FOR PROFILES
-- =====================================================

-- Everyone can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- HODs can view profiles of teachers in their department
CREATE POLICY "HODs can view department profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    public.is_hod(auth.uid()) AND
    EXISTS (
        SELECT 1 FROM public.teacher_assignments ta
        JOIN public.departments d ON d.id = ta.department_id
        WHERE ta.teacher_user_id = profiles.user_id
        AND d.hod_user_id = auth.uid()
    )
);

-- Principal can view all profiles
CREATE POLICY "Principal can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_principal(auth.uid()));

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES FOR DEPARTMENTS
-- =====================================================

-- All authenticated users can view departments
CREATE POLICY "Authenticated users can view departments"
ON public.departments FOR SELECT
TO authenticated
USING (true);

-- Only principal can create departments
CREATE POLICY "Principal can create departments"
ON public.departments FOR INSERT
TO authenticated
WITH CHECK (public.is_principal(auth.uid()));

-- Principal or HOD of department can update
CREATE POLICY "Principal or HOD can update departments"
ON public.departments FOR UPDATE
TO authenticated
USING (
    public.is_principal(auth.uid()) OR
    hod_user_id = auth.uid()
);

-- =====================================================
-- RLS POLICIES FOR USER_ROLES
-- =====================================================

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- HOD can view roles of users in their department
CREATE POLICY "HOD can view department user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
    public.is_hod(auth.uid()) AND
    EXISTS (
        SELECT 1 FROM public.teacher_assignments ta
        JOIN public.departments d ON d.id = ta.department_id
        WHERE ta.teacher_user_id = user_roles.user_id
        AND d.hod_user_id = auth.uid()
    )
);

-- Principal can view all roles
CREATE POLICY "Principal can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_principal(auth.uid()));

-- Only system can insert roles (via trigger or edge function)
CREATE POLICY "System inserts roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (false);

-- =====================================================
-- RLS POLICIES FOR TEACHER_ASSIGNMENTS
-- =====================================================

-- Teachers can view their own assignments
CREATE POLICY "Teachers can view own assignments"
ON public.teacher_assignments FOR SELECT
TO authenticated
USING (teacher_user_id = auth.uid());

-- HOD can view assignments in their department
CREATE POLICY "HOD can view department assignments"
ON public.teacher_assignments FOR SELECT
TO authenticated
USING (
    public.is_hod(auth.uid()) AND
    EXISTS (
        SELECT 1 FROM public.departments
        WHERE id = teacher_assignments.department_id
        AND hod_user_id = auth.uid()
    )
);

-- Principal can view all assignments
CREATE POLICY "Principal can view all assignments"
ON public.teacher_assignments FOR SELECT
TO authenticated
USING (public.is_principal(auth.uid()));

-- =====================================================
-- RLS POLICIES FOR STUDENT_RECORDS
-- =====================================================

-- Teachers can manage their own students
CREATE POLICY "Teachers can view own students"
ON public.student_records FOR SELECT
TO authenticated
USING (teacher_user_id = auth.uid());

CREATE POLICY "Teachers can insert own students"
ON public.student_records FOR INSERT
TO authenticated
WITH CHECK (
    teacher_user_id = auth.uid() AND
    public.is_teacher(auth.uid())
);

CREATE POLICY "Teachers can update own students"
ON public.student_records FOR UPDATE
TO authenticated
USING (teacher_user_id = auth.uid())
WITH CHECK (teacher_user_id = auth.uid());

CREATE POLICY "Teachers can delete own students"
ON public.student_records FOR DELETE
TO authenticated
USING (teacher_user_id = auth.uid());

-- HOD can view students in their department
CREATE POLICY "HOD can view department students"
ON public.student_records FOR SELECT
TO authenticated
USING (
    public.is_hod(auth.uid()) AND
    EXISTS (
        SELECT 1 FROM public.departments
        WHERE id = student_records.department_id
        AND hod_user_id = auth.uid()
    )
);

-- Principal can view all students
CREATE POLICY "Principal can view all students"
ON public.student_records FOR SELECT
TO authenticated
USING (public.is_principal(auth.uid()));

-- =====================================================
-- RLS POLICIES FOR REPORTS
-- =====================================================

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.reports FOR SELECT
TO authenticated
USING (reporter_user_id = auth.uid());

-- Users can insert their own reports
CREATE POLICY "Users can insert own reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (reporter_user_id = auth.uid());

-- Users can update their own reports
CREATE POLICY "Users can update own reports"
ON public.reports FOR UPDATE
TO authenticated
USING (reporter_user_id = auth.uid())
WITH CHECK (reporter_user_id = auth.uid());

-- HOD can view reports submitted to them or from their department
CREATE POLICY "HOD can view submitted reports"
ON public.reports FOR SELECT
TO authenticated
USING (
    public.is_hod(auth.uid()) AND (
        submitted_to_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.departments
            WHERE id = reports.department_id
            AND hod_user_id = auth.uid()
        )
    )
);

-- Principal can view all reports submitted to them
CREATE POLICY "Principal can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (
    public.is_principal(auth.uid()) AND
    (status = 'submitted_to_principal' OR status = 'approved')
);

-- =====================================================
-- RLS POLICIES FOR DOCUMENTS
-- =====================================================

-- Users can manage their own documents
CREATE POLICY "Users can view own documents"
ON public.documents FOR SELECT
TO authenticated
USING (uploader_user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (uploader_user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
ON public.documents FOR DELETE
TO authenticated
USING (uploader_user_id = auth.uid());

-- HOD can view documents from their department
CREATE POLICY "HOD can view department documents"
ON public.documents FOR SELECT
TO authenticated
USING (
    public.is_hod(auth.uid()) AND
    EXISTS (
        SELECT 1 FROM public.departments
        WHERE id = documents.department_id
        AND hod_user_id = auth.uid()
    )
);

-- Principal can view all HOD documents
CREATE POLICY "Principal can view HOD documents"
ON public.documents FOR SELECT
TO authenticated
USING (
    public.is_principal(auth.uid()) AND
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = documents.uploader_user_id
        AND role = 'hod'
    )
);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_records_updated_at
    BEFORE UPDATE ON public.student_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- CREATE STORAGE BUCKET FOR DOCUMENTS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- INSERT SAMPLE DEPARTMENTS
-- =====================================================

INSERT INTO public.departments (name, description) VALUES
    ('Computer Science', 'Department of Computer Science and Engineering'),
    ('Mathematics', 'Department of Mathematics'),
    ('Physics', 'Department of Physics'),
    ('Chemistry', 'Department of Chemistry'),
    ('English', 'Department of English Literature')
ON CONFLICT (name) DO NOTHING;