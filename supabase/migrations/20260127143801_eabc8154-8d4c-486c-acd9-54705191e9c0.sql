-- Allow Principal to delete reports submitted to them
CREATE POLICY "Principal can delete submitted reports"
ON public.reports
FOR DELETE
USING (
  is_principal(auth.uid()) 
  AND (status = 'submitted_to_principal' OR status = 'approved')
);

-- Allow HOD to delete reports submitted to them from their department
CREATE POLICY "HOD can delete department reports"
ON public.reports
FOR DELETE
USING (
  is_hod(auth.uid()) 
  AND status = 'submitted_to_hod'
  AND EXISTS (
    SELECT 1 FROM public.departments
    WHERE departments.id = reports.department_id
    AND departments.hod_user_id = auth.uid()
  )
);