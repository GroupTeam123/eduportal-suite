import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DepartmentWithHOD {
  id: string;
  name: string;
  description: string | null;
  hod_user_id: string | null;
  hod_name: string | null;
  hod_email: string | null;
  teacher_count: number;
  student_count: number;
}

export interface HODInfo {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  department_name: string;
  department_id: string;
  teacher_count: number;
  document_count: number;
}

export interface InstitutionStats {
  totalDepartments: number;
  totalHODs: number;
  totalTeachers: number;
  totalStudents: number;
  totalReports: number;
  approvedReports: number;
  pendingReports: number;
}

export function usePrincipalData() {
  const [departments, setDepartments] = useState<DepartmentWithHOD[]>([]);
  const [hods, setHODs] = useState<HODInfo[]>([]);
  const [stats, setStats] = useState<InstitutionStats>({
    totalDepartments: 0,
    totalHODs: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalReports: 0,
    approvedReports: 0,
    pendingReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch all departments
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('*')
          .order('name');

        if (deptError) throw deptError;

        // Enrich departments with HOD info and counts
        const enrichedDepts: DepartmentWithHOD[] = [];
        const hodList: HODInfo[] = [];
        let totalTeachers = 0;
        let totalStudents = 0;

        for (const dept of deptData || []) {
          // Get HOD profile if exists
          let hodName = null;
          let hodEmail = null;
          
          if (dept.hod_user_id) {
            const { data: hodProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', dept.hod_user_id)
              .single();

            if (hodProfile) {
              hodName = hodProfile.full_name;
              hodEmail = hodProfile.email;
            }
          }

          // Get teacher count
          const { count: teacherCount } = await supabase
            .from('teacher_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id);

          // Get student count
          const { count: studentCount } = await supabase
            .from('student_records')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id);

          // Get document count for HOD
          let docCount = 0;
          if (dept.hod_user_id) {
            const { count } = await supabase
              .from('documents')
              .select('*', { count: 'exact', head: true })
              .eq('uploader_user_id', dept.hod_user_id);
            docCount = count || 0;
          }

          enrichedDepts.push({
            id: dept.id,
            name: dept.name,
            description: dept.description,
            hod_user_id: dept.hod_user_id,
            hod_name: hodName,
            hod_email: hodEmail,
            teacher_count: teacherCount || 0,
            student_count: studentCount || 0,
          });

          if (dept.hod_user_id && hodName) {
            hodList.push({
              id: dept.id,
              user_id: dept.hod_user_id,
              full_name: hodName,
              email: hodEmail,
              department_name: dept.name,
              department_id: dept.id,
              teacher_count: teacherCount || 0,
              document_count: docCount,
            });
          }

          totalTeachers += teacherCount || 0;
          totalStudents += studentCount || 0;
        }

        setDepartments(enrichedDepts);
        setHODs(hodList);

        // Fetch report statistics
        const { data: reports, error: reportsError } = await supabase
          .from('reports')
          .select('status');

        if (reportsError) throw reportsError;

        const approvedReports = reports?.filter(r => r.status === 'approved').length || 0;
        const pendingReports = reports?.filter(r => 
          r.status === 'submitted_to_principal'
        ).length || 0;

        setStats({
          totalDepartments: enrichedDepts.length,
          totalHODs: hodList.length,
          totalTeachers,
          totalStudents,
          totalReports: reports?.length || 0,
          approvedReports,
          pendingReports,
        });
      } catch (error) {
        console.error('Error fetching principal data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { departments, hods, stats, loading };
}
