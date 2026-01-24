-- Create a helper function in public schema to check if user can access a document's storage path
-- This mirrors the database RLS logic for documents table

CREATE OR REPLACE FUNCTION public.can_access_document_storage(file_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    folder_owner_id TEXT;
    caller_id UUID;
BEGIN
    caller_id := auth.uid();
    
    -- Extract the user ID from the file path (first folder segment)
    folder_owner_id := (storage.foldername(file_path))[1];
    
    -- If no folder structure, deny access
    IF folder_owner_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Users can always access their own files
    IF folder_owner_id = caller_id::text THEN
        RETURN TRUE;
    END IF;
    
    -- Principals can access HOD documents
    IF public.is_principal(caller_id) THEN
        -- Check if the folder owner is an HOD
        IF EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = folder_owner_id::uuid
            AND role = 'hod'
        ) THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- HODs can access documents from teachers in their department
    IF public.is_hod(caller_id) THEN
        -- Check if the folder owner is a teacher in HOD's department
        IF EXISTS (
            SELECT 1 
            FROM public.teacher_assignments ta
            JOIN public.departments d ON d.id = ta.department_id
            WHERE ta.teacher_user_id = folder_owner_id::uuid
            AND d.hod_user_id = caller_id
        ) THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "HOD can view department documents" ON storage.objects;
DROP POLICY IF EXISTS "Principal can view HOD documents" ON storage.objects;

-- Create new unified SELECT policy using the helper function
CREATE POLICY "Users can view accessible documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'documents' 
    AND public.can_access_document_storage(name)
);