-- Add policy to allow users to delete their own reports
CREATE POLICY "Users can delete own reports" 
ON public.reports 
FOR DELETE 
USING (reporter_user_id = auth.uid());