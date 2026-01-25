-- Insert new departments for the sign-up dropdown
INSERT INTO public.departments (name, description) VALUES
  ('CSE', 'Computer Science and Engineering'),
  ('IT', 'Information Technology'),
  ('ENTC', 'Electronics and Telecommunication'),
  ('DS', 'Data Science'),
  ('Civil', 'Civil Engineering'),
  ('Mechanical', 'Mechanical Engineering'),
  ('MBA', 'Master of Business Administration')
ON CONFLICT DO NOTHING;