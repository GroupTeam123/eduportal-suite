import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StudentRecord {
  id: string;
  teacher_user_id: string;
  department_id: string;
  name: string;
  email: string | null;
  contact: number | null;
  attendance: number | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewStudentRecord {
  name: string;
  email?: string;
  contact?: number;
  attendance?: number;
  guardian_name?: string;
  guardian_phone?: string;
  notes?: string;
}

export function useStudents(departmentId: string | null) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStudents = async () => {
    if (!departmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch students';
      setError(message);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [departmentId]);

  const addStudent = async (student: NewStudentRecord, teacherUserId: string) => {
    if (!departmentId) {
      toast({
        title: 'Error',
        description: 'No department assigned. Please contact administrator.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('student_records')
        .insert({
          ...student,
          teacher_user_id: teacherUserId,
          department_id: departmentId,
        })
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => [data, ...prev]);
      toast({
        title: 'Student Added',
        description: `${student.name} has been added successfully.`,
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add student';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateStudent = async (id: string, updates: Partial<NewStudentRecord>) => {
    try {
      const { data, error } = await supabase
        .from('student_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => prev.map(s => s.id === id ? data : s));
      toast({
        title: 'Student Updated',
        description: 'Student record has been updated.',
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update student';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('student_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStudents(prev => prev.filter(s => s.id !== id));
      toast({
        title: 'Student Removed',
        description: 'Student has been removed from the list.',
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete student';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const importStudents = async (studentsData: NewStudentRecord[], teacherUserId: string) => {
    if (!departmentId) {
      toast({
        title: 'Error',
        description: 'No department assigned.',
        variant: 'destructive',
      });
      return [];
    }

    try {
      const studentsToInsert = studentsData.map(s => ({
        ...s,
        teacher_user_id: teacherUserId,
        department_id: departmentId,
      }));

      const { data, error } = await supabase
        .from('student_records')
        .insert(studentsToInsert)
        .select();

      if (error) throw error;

      setStudents(prev => [...(data || []), ...prev]);
      toast({
        title: 'Import Successful',
        description: `${data?.length || 0} students imported.`,
      });
      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import students';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return [];
    }
  };

  return {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    refetch: fetchStudents,
  };
}
