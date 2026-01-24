import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeacherWithStudents {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  student_count: number;
}

export interface DepartmentStats {
  totalTeachers: number;
  totalStudents: number;
  avgAttendance: number;
  pendingReports: number;
  submittedReports: number;
}

export function useHODData(departmentId: string | null) {
  const [teachers, setTeachers] = useState<TeacherWithStudents[]>([]);
  const [stats, setStats] = useState<DepartmentStats>({
    totalTeachers: 0,
    totalStudents: 0,
    avgAttendance: 0,
    pendingReports: 0,
    submittedReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!departmentId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch teachers in the department
        const { data: assignments, error: assignError } = await supabase
          .from('teacher_assignments')
          .select('teacher_user_id')
          .eq('department_id', departmentId);

        if (assignError) throw assignError;

        const teacherIds = assignments?.map(a => a.teacher_user_id) || [];

        // Fetch teacher profiles
        const teachersData: TeacherWithStudents[] = [];
        
        for (const teacherId of teacherIds) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', teacherId)
            .single();

          const { count: studentCount } = await supabase
            .from('student_records')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_user_id', teacherId);

          if (profile) {
            teachersData.push({
              id: profile.id,
              user_id: profile.user_id,
              full_name: profile.full_name,
              email: profile.email,
              student_count: studentCount || 0,
            });
          }
        }

        setTeachers(teachersData);

        // Fetch all students in department
        const { data: students, error: studentsError } = await supabase
          .from('student_records')
          .select('*')
          .eq('department_id', departmentId);

        if (studentsError) throw studentsError;

        const totalStudents = students?.length || 0;
        const avgAttendance = totalStudents > 0
          ? students!.reduce((sum, s) => sum + (s.attendance || 0), 0) / totalStudents
          : 0;

        // Fetch reports for this department
        const { data: reports, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .eq('department_id', departmentId);

        if (reportsError) throw reportsError;

        const pendingReports = reports?.filter(r => 
          r.status === 'submitted_to_hod'
        ).length || 0;
        
        const submittedReports = reports?.filter(r => 
          r.status === 'submitted_to_principal' || r.status === 'approved'
        ).length || 0;

        setStats({
          totalTeachers: teachersData.length,
          totalStudents,
          avgAttendance,
          pendingReports,
          submittedReports,
        });
      } catch (error) {
        console.error('Error fetching HOD data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [departmentId]);

  return { teachers, stats, loading };
}
