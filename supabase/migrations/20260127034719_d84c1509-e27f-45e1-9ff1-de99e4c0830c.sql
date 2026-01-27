-- Allow Principal to view documents uploaded by teachers
CREATE POLICY "Principal can view teacher documents"
ON public.documents
FOR SELECT
USING (
  is_principal(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.teacher_assignments ta
    WHERE ta.teacher_user_id = documents.uploader_user_id
  )
);

-- Update storage access function to allow principals to download teacher documents
CREATE OR REPLACE FUNCTION public.can_access_document_storage(file_path text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    
    -- Principals can access HOD and Teacher documents
    IF public.is_principal(caller_id) THEN
        -- Check if the folder owner is an HOD (via departments table)
        IF EXISTS (
            SELECT 1 FROM public.departments d
            WHERE d.hod_user_id = folder_owner_id::uuid
        ) THEN
            RETURN TRUE;
        END IF;
        
        -- Check if the folder owner is a teacher (via teacher_assignments table)
        IF EXISTS (
            SELECT 1 FROM public.teacher_assignments ta
            WHERE ta.teacher_user_id = folder_owner_id::uuid
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
$function$;