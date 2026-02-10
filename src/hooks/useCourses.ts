import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Course {
  id: string;
  name: string;
  description: string | null;
  teacher_user_id: string;
  department_id: string;
  created_at: string;
  updated_at: string;
}

export interface CourseStudent {
  id: string;
  course_id: string;
  student_record_id: string;
  created_at: string;
}

export function useCourses(departmentId: string | null) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseStudents, setCourseStudents] = useState<CourseStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = async () => {
    if (!departmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses((data || []) as Course[]);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStudents = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('course_students')
        .select('*');

      if (error) throw error;
      setCourseStudents((data || []) as CourseStudent[]);
    } catch (err) {
      console.error('Error fetching course students:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCourseStudents();
  }, [departmentId]);

  const addCourse = async (name: string, description: string, teacherUserId: string) => {
    if (!departmentId) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('courses')
        .insert({
          name,
          description: description || null,
          teacher_user_id: teacherUserId,
          department_id: departmentId,
        })
        .select()
        .single();

      if (error) throw error;
      const course = data as Course;
      setCourses(prev => [course, ...prev]);
      toast({ title: 'Course Created', description: `"${name}" has been created.` });
      return course;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create course';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return null;
    }
  };

  const updateCourse = async (id: string, updates: { name?: string; description?: string }) => {
    try {
      const { data, error } = await (supabase as any)
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const course = data as Course;
      setCourses(prev => prev.map(c => c.id === id ? course : c));
      toast({ title: 'Course Updated', description: 'Course has been updated.' });
      return course;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update course';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return null;
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCourses(prev => prev.filter(c => c.id !== id));
      setCourseStudents(prev => prev.filter(cs => cs.course_id !== id));
      toast({ title: 'Course Deleted', description: 'Course has been deleted.' });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete course';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return false;
    }
  };

  const addStudentToCourse = async (courseId: string, studentRecordId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('course_students')
        .insert({ course_id: courseId, student_record_id: studentRecordId })
        .select()
        .single();

      if (error) throw error;
      const cs = data as CourseStudent;
      setCourseStudents(prev => [...prev, cs]);
      return cs;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add student to course';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return null;
    }
  };

  const removeStudentFromCourse = async (courseId: string, studentRecordId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('course_students')
        .delete()
        .eq('course_id', courseId)
        .eq('student_record_id', studentRecordId);

      if (error) throw error;
      setCourseStudents(prev => prev.filter(cs => !(cs.course_id === courseId && cs.student_record_id === studentRecordId)));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove student from course';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return false;
    }
  };

  const getStudentsForCourse = (courseId: string): string[] => {
    return courseStudents.filter(cs => cs.course_id === courseId).map(cs => cs.student_record_id);
  };

  return {
    courses,
    courseStudents,
    loading,
    addCourse,
    updateCourse,
    deleteCourse,
    addStudentToCourse,
    removeStudentFromCourse,
    getStudentsForCourse,
    refetch: () => { fetchCourses(); fetchCourseStudents(); },
  };
}
