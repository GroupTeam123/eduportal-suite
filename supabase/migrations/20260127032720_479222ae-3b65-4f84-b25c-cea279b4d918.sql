-- Drop the existing HOD view policy
DROP POLICY IF EXISTS "HOD can view submitted reports" ON public.reports;

-- Create updated policy that excludes draft reports
CREATE POLICY "HOD can view submitted reports" 
ON public.reports 
FOR SELECT 
USING (
  is_hod(auth.uid()) AND 
  status != 'draft' AND
  (
    submitted_to_user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM departments 
      WHERE departments.id = reports.department_id 
      AND departments.hod_user_id = auth.uid()
    )
  )
);