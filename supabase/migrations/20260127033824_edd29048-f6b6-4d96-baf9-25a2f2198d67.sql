-- Fix principal visibility for HOD documents even when user_roles entry is missing
-- Existing policy relied on user_roles(role='hod'), which may be absent for some HODs.

DROP POLICY IF EXISTS "Principal can view HOD documents" ON public.documents;

CREATE POLICY "Principal can view HOD documents"
ON public.documents
FOR SELECT
USING (
  is_principal(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.departments d
    WHERE d.hod_user_id = documents.uploader_user_id
  )
);