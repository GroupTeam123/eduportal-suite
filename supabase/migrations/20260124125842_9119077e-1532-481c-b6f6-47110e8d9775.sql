-- Allow HOD to update reports in their department (to forward to principal)
DROP POLICY IF EXISTS "HOD can update department reports" ON public.reports;

CREATE POLICY "HOD can update department reports"
ON public.reports
FOR UPDATE
USING (
  is_hod(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM public.departments 
    WHERE departments.id = reports.department_id 
    AND departments.hod_user_id = auth.uid()
  )
)
WITH CHECK (
  is_hod(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM public.departments 
    WHERE departments.id = reports.department_id 
    AND departments.hod_user_id = auth.uid()
  )
);