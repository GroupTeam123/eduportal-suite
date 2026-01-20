import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { mockStudents } from '@/data/mockData';
import { Student } from '@/types';

export default function HODStudents() {
  const columns = [
    { key: 'rollNumber', label: 'Roll No.' },
    { key: 'name', label: 'Student Name' },
    { key: 'email', label: 'Email' },
    { key: 'semester', label: 'Semester' },
    { 
      key: 'attendance', 
      label: 'Attendance',
      render: (student: Student) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                student.attendance >= 90 ? 'bg-success' :
                student.attendance >= 75 ? 'bg-warning' :
                'bg-destructive'
              }`}
              style={{ width: `${student.attendance}%` }}
            />
          </div>
          <span className="text-sm">{student.attendance}%</span>
        </div>
      )
    },
  ];

  // Simulate more students for HOD view
  const allStudents = [...mockStudents, ...mockStudents.map(s => ({
    ...s,
    id: `${s.id}-copy`,
    rollNumber: s.rollNumber.replace('001', '011'),
    name: `${s.name} Jr.`,
  }))];

  return (
    <DashboardLayout title="Department Students" subtitle="View all student records in your department">
      <DataTable
        data={allStudents}
        columns={columns}
        searchPlaceholder="Search students..."
        title="Student Records"
        onExport={() => alert('Exporting student data...')}
      />
    </DashboardLayout>
  );
}
