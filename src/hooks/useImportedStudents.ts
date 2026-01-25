import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface ImportedStudent {
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

export interface NewImportedStudent {
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

export function useImportedStudents(departmentId: string | null) {
  const [importedStudents, setImportedStudents] = useState<ImportedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchImportedStudents = async () => {
    if (!departmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('imported_students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData: ImportedStudent[] = (data || []).map(record => ({
        ...record,
        custom_fields: record.custom_fields as Record<string, unknown> | null,
        marks: record.marks as Record<string, unknown> | null,
      }));

      setImportedStudents(transformedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch imported students';
      setError(message);
      console.error('Error fetching imported students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImportedStudents();
  }, [departmentId]);

  const addImportedStudent = async (student: NewImportedStudent, teacherUserId: string) => {
    if (!departmentId) {
      toast({
        title: 'Error',
        description: 'No department assigned.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('imported_students')
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

      const transformedData: ImportedStudent = {
        ...data,
        custom_fields: data.custom_fields as Record<string, unknown> | null,
        marks: data.marks as Record<string, unknown> | null,
      };

      setImportedStudents(prev => [transformedData, ...prev]);
      return transformedData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add imported student';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateImportedStudent = async (id: string, updates: Partial<NewImportedStudent>) => {
    try {
      const updatePayload: Record<string, unknown> = { ...updates };
      if (updates.custom_fields) {
        updatePayload.custom_fields = updates.custom_fields as Json;
      }
      if (updates.marks) {
        updatePayload.marks = updates.marks as Json;
      }

      const { data, error } = await supabase
        .from('imported_students')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const transformedData: ImportedStudent = {
        ...data,
        custom_fields: data.custom_fields as Record<string, unknown> | null,
        marks: data.marks as Record<string, unknown> | null,
      };

      setImportedStudents(prev => prev.map(s => s.id === id ? transformedData : s));
      toast({
        title: 'Updated',
        description: 'Imported student record updated.',
      });
      return transformedData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update imported student';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteImportedStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('imported_students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setImportedStudents(prev => prev.filter(s => s.id !== id));
      toast({
        title: 'Removed',
        description: 'Imported student removed.',
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete imported student';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const bulkImportStudents = async (studentsData: NewImportedStudent[], teacherUserId: string) => {
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
        .from('imported_students')
        .insert(studentsToInsert)
        .select();

      if (error) throw error;

      const transformedData: ImportedStudent[] = (data || []).map(record => ({
        ...record,
        custom_fields: record.custom_fields as Record<string, unknown> | null,
        marks: record.marks as Record<string, unknown> | null,
      }));

      setImportedStudents(prev => [...transformedData, ...prev]);
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

  return {
    importedStudents,
    loading,
    error,
    addImportedStudent,
    updateImportedStudent,
    deleteImportedStudent,
    bulkImportStudents,
    refetch: fetchImportedStudents,
  };
}
