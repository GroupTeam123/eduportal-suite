import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { usePrincipalData, DepartmentWithHOD } from '@/hooks/usePrincipalData';
import { Loader2 } from 'lucide-react';

export default function PrincipalDepartments() {
  const { departments, loading } = usePrincipalData();

  const columns = [
    { key: 'name', label: 'Department' },
    { 
      key: 'hod_name', 
      label: 'HOD',
      render: (dept: DepartmentWithHOD) => dept.hod_name || 'Not assigned'
    },
    { key: 'teacher_count', label: 'Faculty' },
    { key: 'student_count', label: 'Students' },
    {
      key: 'status',
      label: 'Status',
      render: () => (
        <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
          Active
        </span>
      )
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Departments" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Departments" subtitle="View all departments across the institute">
      {departments.length > 0 ? (
        <DataTable
          data={departments}
          columns={columns}
          searchPlaceholder="Search departments..."
          title="All Departments"
        />
      ) : (
        <div className="bg-card rounded-xl shadow-card p-12 text-center">
          <p className="text-muted-foreground">No departments created yet.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
