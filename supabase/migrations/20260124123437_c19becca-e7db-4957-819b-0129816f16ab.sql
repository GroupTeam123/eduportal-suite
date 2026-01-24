-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;

-- Create a new policy that allows anyone (including unauthenticated users) to view departments
-- This is needed for signup where users need to select a department before being authenticated
CREATE POLICY "Anyone can view departments"
ON public.departments
FOR SELECT
USING (true);