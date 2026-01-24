import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { useStudents, StudentRecord } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HODStudents() {
  const { departmentId } = useAuth();
  const { students, loading } = useStudents(departmentId);

  const columns = [
    { key: 'name', label: 'Student Name' },
    { key: 'email', label: 'Email' },
    { key: 'contact', label: 'Contact' },
    { 
      key: 'attendance', 
      label: 'Attendance',
      render: (student: StudentRecord) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                (student.attendance || 0) >= 90 ? 'bg-success' :
                (student.attendance || 0) >= 75 ? 'bg-warning' :
                'bg-destructive'
              }`}
              style={{ width: `${student.attendance || 0}%` }}
            />
          </div>
          <span className="text-sm">{student.attendance || 0}%</span>
        </div>
      )
    },
    { key: 'guardian_name', label: 'Guardian' },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Department Students" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Department Students" subtitle="View all student records in your department">
      {students.length > 0 ? (
        <DataTable
          data={students}
          columns={columns}
          searchPlaceholder="Search students..."
          title="Student Records"
        />
      ) : (
        <div className="bg-card rounded-xl shadow-card p-12 text-center">
          <p className="text-muted-foreground">No students in your department yet.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
