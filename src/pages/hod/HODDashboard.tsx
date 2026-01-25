import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { useAuth } from '@/contexts/AuthContext';
import { useHODData } from '@/hooks/useHODData';
import { useStudents } from '@/hooks/useStudents';
import { useReports } from '@/hooks/useReports';
import { Users, GraduationCap, FileText, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEAR_LABELS = ['1st', '2nd', '3rd', '4th'];

export default function HODDashboard() {
  const { supabaseUser, user, departmentId } = useAuth();
  const { teachers, stats, loading } = useHODData(departmentId);
  const { students } = useStudents(departmentId);
  const { reports } = useReports(supabaseUser?.id || null, user?.role || null, departmentId);

  // Get students by year
  const studentsByYear = useMemo(() => {
    return {
      1: students.filter(s => s.year === 1),
      2: students.filter(s => s.year === 2),
      3: students.filter(s => s.year === 3),
      4: students.filter(s => s.year === 4),
    };
  }, [students]);

  // Year-wise average attendance (like Teacher Dashboard)
  const yearWiseAttendance = useMemo(() => {
    return [1, 2, 3, 4].map(year => {
      const yearStudents = studentsByYear[year as keyof typeof studentsByYear];
      if (yearStudents.length === 0) return { year, avg: 0 };
      const avg = Math.round(
        yearStudents.reduce((acc, s) => acc + (s.attendance || 0), 0) / yearStudents.length
      );
      return { year, avg };
    });
  }, [studentsByYear]);

  // Generate teacher workload data
  const teacherWorkload = teachers.map(t => ({
    name: t.full_name.split(' ')[0].substring(0, 8),
    students: t.student_count,
  }));

  // Recent reports
  const recentReports = reports.slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout title="HOD Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="HOD Dashboard" subtitle="Department Overview">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers}
          icon={<GraduationCap className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<Users className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Reports to Review"
          value={stats.pendingReports}
          icon={<FileText className="w-6 h-6 text-primary" />}
        />
        {/* Year-wise Average Attendance Card (like Teacher Dashboard) */}
        <div className="bg-card rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Avg. Attendance (Year-wise)</span>
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {yearWiseAttendance.map((item, idx) => (
              <div key={item.year} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{YEAR_LABELS[idx]} Year</p>
                <p className="text-lg font-bold text-foreground">
                  {`${item.avg}%`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Student Distribution by Year</h3>
          {students.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={YEAR_LABELS.map((label, idx) => ({
                name: label,
                students: studentsByYear[(idx + 1) as keyof typeof studentsByYear].length,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No student data available
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Teacher Workload Distribution</h3>
          {teacherWorkload.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teacherWorkload}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip />
                <Bar dataKey="students" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No teacher data available
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Recent Reports</h3>
          <div className="space-y-3">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <div key={report.id} className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium text-sm truncate">{report.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(report.created_at).toLocaleDateString()} • 
                    <span className={`ml-1 ${
                      report.status === 'approved' ? 'text-success' :
                      report.status === 'submitted_to_principal' ? 'text-primary' :
                      'text-warning'
                    }`}>
                      {report.status.replace(/_/g, ' ')}
                    </span>
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No reports yet</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Department Teachers</h3>
          <div className="space-y-3">
            {teachers.length > 0 ? (
              teachers.slice(0, 3).map((teacher) => (
                <div key={teacher.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {teacher.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{teacher.full_name}</p>
                    <p className="text-xs text-muted-foreground">{teacher.student_count} students</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No teachers assigned</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Pending Actions</h3>
          <div className="space-y-3">
            {stats.pendingReports > 0 && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="font-medium text-sm">Review {stats.pendingReports} pending report(s)</p>
                <p className="text-xs text-muted-foreground mt-1">From teachers in your department</p>
              </div>
            )}
            <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="font-medium text-sm">Submit department report</p>
              <p className="text-xs text-muted-foreground mt-1">Compile and submit to Principal</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
