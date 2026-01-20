import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { mockDepartments } from '@/data/mockData';
import { Department } from '@/types';

export default function PrincipalDepartments() {
  const columns = [
    { key: 'name', label: 'Department' },
    { key: 'hodName', label: 'HOD' },
    { key: 'teacherCount', label: 'Faculty' },
    { key: 'studentCount', label: 'Students' },
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

  return (
    <DashboardLayout title="Departments" subtitle="View all departments across the institute">
      <DataTable
        data={mockDepartments}
        columns={columns}
        searchPlaceholder="Search departments..."
        title="All Departments"
      />
    </DashboardLayout>
  );
}
