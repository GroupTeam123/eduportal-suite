-- Allow Principal to update reports (for approving them)
CREATE POLICY "Principal can update submitted reports"
ON public.reports
FOR UPDATE
USING (is_principal(auth.uid()) AND (status = 'submitted_to_principal'::report_status))
WITH CHECK (is_principal(auth.uid()) AND (status = 'approved'::report_status));