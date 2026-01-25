import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

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
  year: number | null;
  student_id: string | null;
  custom_fields: Record<string, unknown> | null;
  marks: Record<string, unknown> | null;
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
  year?: number;
  student_id?: string;
  custom_fields?: Record<string, unknown>;
  marks?: Record<string, unknown>;
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
      
      // Transform the data to ensure proper typing
      const transformedData: StudentRecord[] = (data || []).map(record => ({
        ...record,
        custom_fields: record.custom_fields as Record<string, unknown> | null,
        marks: record.marks as Record<string, unknown> | null,
      }));
      
      setStudents(transformedData);
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
          custom_fields: (student.custom_fields || {}) as Json,
          marks: (student.marks || {}) as Json,
        })
        .select()
        .single();

      if (error) throw error;

      const transformedData: StudentRecord = {
        ...data,
        custom_fields: data.custom_fields as Record<string, unknown> | null,
        marks: data.marks as Record<string, unknown> | null,
      };

      setStudents(prev => [transformedData, ...prev]);
      toast({
        title: 'Student Added',
        description: `${student.name} has been added successfully.`,
      });
      return transformedData;
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
      const updatePayload: Record<string, unknown> = { ...updates };
      if (updates.custom_fields) {
        updatePayload.custom_fields = updates.custom_fields as Json;
      }
      if (updates.marks) {
        updatePayload.marks = updates.marks as Json;
      }

      const { data, error } = await supabase
        .from('student_records')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const transformedData: StudentRecord = {
        ...data,
        custom_fields: data.custom_fields as Record<string, unknown> | null,
        marks: data.marks as Record<string, unknown> | null,
      };

      setStudents(prev => prev.map(s => s.id === id ? transformedData : s));
      toast({
        title: 'Student Updated',
        description: 'Student record has been updated.',
      });
      return transformedData;
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
        custom_fields: (s.custom_fields || {}) as Json,
        marks: (s.marks || {}) as Json,
      }));

      const { data, error } = await supabase
        .from('student_records')
        .insert(studentsToInsert)
        .select();

      if (error) throw error;

      const transformedData: StudentRecord[] = (data || []).map(record => ({
        ...record,
        custom_fields: record.custom_fields as Record<string, unknown> | null,
        marks: record.marks as Record<string, unknown> | null,
      }));

      setStudents(prev => [...transformedData, ...prev]);
      toast({
        title: 'Import Successful',
        description: `${data?.length || 0} students imported.`,
      });
      return transformedData;
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

  // Upsert students by matching name AND student_id, assign to selected year
  const upsertStudents = async (studentsData: NewStudentRecord[], teacherUserId: string, targetYear?: number) => {
    if (!departmentId) {
      toast({
        title: 'Error',
        description: 'No department assigned.',
        variant: 'destructive',
      });
      return { inserted: 0, updated: 0 };
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const studentData of studentsData) {
      try {
        // Try to find existing student by name AND student_id
        let existingStudent: StudentRecord | null = null;
        
        if (studentData.student_id) {
          const { data } = await supabase
            .from('student_records')
            .select('*')
            .eq('department_id', departmentId)
            .eq('student_id', studentData.student_id)
            .maybeSingle();
          
          if (data) {
            existingStudent = {
              ...data,
              custom_fields: data.custom_fields as Record<string, unknown> | null,
              marks: data.marks as Record<string, unknown> | null,
            };
          }
        }

        // If no match by student_id, try matching by exact name
        if (!existingStudent && studentData.name) {
          const { data } = await supabase
            .from('student_records')
            .select('*')
            .eq('department_id', departmentId)
            .eq('name', studentData.name)
            .maybeSingle();
          
          if (data) {
            existingStudent = {
              ...data,
              custom_fields: data.custom_fields as Record<string, unknown> | null,
              marks: data.marks as Record<string, unknown> | null,
            };
          }
        }

        if (existingStudent) {
          // Update existing record with the target year if specified
          const updateData = targetYear ? { ...studentData, year: targetYear } : studentData;
          await updateStudent(existingStudent.id, updateData);
          updatedCount++;
        } else {
          // Insert new record with the target year if specified
          const insertData = targetYear ? { ...studentData, year: targetYear } : studentData;
          await addStudent(insertData, teacherUserId);
          insertedCount++;
        }
      } catch (err) {
        console.error('Error upserting student:', err);
      }
    }

    toast({
      title: 'Import Complete',
      description: `${insertedCount} added, ${updatedCount} updated.`,
    });

    return { inserted: insertedCount, updated: updatedCount };
  };

  return {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    upsertStudents,
    refetch: fetchStudents,
  };
}
