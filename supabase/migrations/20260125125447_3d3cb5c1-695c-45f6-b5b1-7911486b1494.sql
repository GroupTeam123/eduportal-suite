-- Add qualifications and years_of_experience columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS qualifications text,
ADD COLUMN IF NOT EXISTS years_of_experience integer;