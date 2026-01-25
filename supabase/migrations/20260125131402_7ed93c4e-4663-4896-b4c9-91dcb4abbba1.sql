-- First, migrate existing student records from old departments to new ones
-- Move "Computer Science" students to "CSE"
UPDATE public.imported_students 
SET department_id = '552720c3-23f9-46cb-bc2f-09e9d99705e5'
WHERE department_id = 'd5e628e3-74ae-42c9-9795-ed5604e6b26f';

UPDATE public.student_records 
SET department_id = '552720c3-23f9-46cb-bc2f-09e9d99705e5'
WHERE department_id = 'd5e628e3-74ae-42c9-9795-ed5604e6b26f';

-- Update teacher_assignments if any reference old departments
UPDATE public.teacher_assignments 
SET department_id = '552720c3-23f9-46cb-bc2f-09e9d99705e5'
WHERE department_id = 'd5e628e3-74ae-42c9-9795-ed5604e6b26f';

-- Update documents if any reference old departments
UPDATE public.documents 
SET department_id = '552720c3-23f9-46cb-bc2f-09e9d99705e5'
WHERE department_id = 'd5e628e3-74ae-42c9-9795-ed5604e6b26f';

-- Update reports if any reference old departments
UPDATE public.reports 
SET department_id = '552720c3-23f9-46cb-bc2f-09e9d99705e5'
WHERE department_id = 'd5e628e3-74ae-42c9-9795-ed5604e6b26f';

-- Now delete the old departments
DELETE FROM public.departments 
WHERE name NOT IN ('CSE', 'IT', 'ENTC', 'DS', 'Civil', 'Mechanical', 'MBA');