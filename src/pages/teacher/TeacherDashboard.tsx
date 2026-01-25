import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Users, FileText, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/hooks/useStudents';
import { useReports } from '@/hooks/useReports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

// Helper to compute weekly attendance from custom_fields
const computeWeeklyAttendance = (students: Array<{ custom_fields?: Record<string, unknown> }>) => {
  const weeklyData: Record<string, { total: number; count: number }> = {};
  
  students.forEach(student => {
    if (student.custom_fields) {
      Object.entries(student.custom_fields).forEach(([key, value]) => {
        const weekMatch = key.toLowerCase().match(/week\s*(\d+)/i);
        if (weekMatch && typeof value === 'number') {
          const weekKey = `Week ${weekMatch[1]}`;
          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { total: 0, count: 0 };
          }
          weeklyData[weekKey].total += value;
          weeklyData[weekKey].count += 1;
        }
      });
    }
  });
  
  // Convert to chart format and sort by week number
  return Object.entries(weeklyData)
    .map(([name, data]) => ({
      name,
      value: data.count > 0 ? Math.round(data.total / data.count) : 0
    }))
    .sort((a, b) => {
      const weekA = parseInt(a.name.replace('Week ', ''));
      const weekB = parseInt(b.name.replace('Week ', ''));
      return weekA - weekB;
    });
};

export default function TeacherDashboard() {
  const { user, departmentId, supabaseUser } = useAuth();
  const { students, loading: studentsLoading } = useStudents(departmentId);
  const { reports, loading: reportsLoading } = useReports(supabaseUser?.id || null, user?.role || null, departmentId);
  
  // Get students by year
  const studentsByYear = useMemo(() => {
    return {
      1: students.filter(s => s.year === 1),
      2: students.filter(s => s.year === 2),
      3: students.filter(s => s.year === 3),
      4: students.filter(s => s.year === 4),
    };
  }, [students]);
  
  // Total students count (sum of all years)
  const totalStudents = students.length;
  
  // Year-wise average attendance
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
  
  // Weekly attendance data for each year
  const weeklyAttendanceByYear = useMemo(() => {
    return {
      1: computeWeeklyAttendance(studentsByYear[1]),
      2: computeWeeklyAttendance(studentsByYear[2]),
      3: computeWeeklyAttendance(studentsByYear[3]),
      4: computeWeeklyAttendance(studentsByYear[4]),
    };
  }, [studentsByYear]);
  
  // Reports count
  const reportsCount = reports.length;
  
  const yearLabels = ['1st', '2nd', '3rd', '4th'];
  const chartColors = [
    'hsl(var(--primary))',
    'hsl(199, 89%, 48%)',
    'hsl(142, 76%, 36%)',
    'hsl(38, 92%, 50%)'
  ];
  
  return (
    <DashboardLayout title="Teacher Dashboard" subtitle={`Welcome back, ${user?.name || 'Teacher'}`}>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={studentsLoading ? '...' : totalStudents}
          icon={<Users className="w-6 h-6 text-primary" />}
        />
        <div className="bg-card rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Avg. Attendance (Year-wise)</span>
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {yearWiseAttendance.map((item, idx) => (
              <div key={item.year} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{yearLabels[idx]} Year</p>
                <p className="text-lg font-bold text-foreground">
                  {studentsLoading ? '...' : `${item.avg}%`}
                </p>
              </div>
            ))}
          </div>
        </div>
        <StatCard
          title="Reports Generated"
          value={reportsLoading ? '...' : reportsCount}
          icon={<FileText className="w-6 h-6 text-primary" />}
        />
      </div>

      {/* Weekly Attendance Charts - 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map((year, idx) => (
          <div key={year} className="bg-card rounded-xl shadow-card p-6">
            <h3 className="font-display text-lg font-semibold mb-4">
              {yearLabels[idx]} Year Weekly Attendance Trend
            </h3>
            {weeklyAttendanceByYear[year as keyof typeof weeklyAttendanceByYear].length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyAttendanceByYear[year as keyof typeof weeklyAttendanceByYear]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill={chartColors[idx]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="text-center">
                  No weekly attendance data available.<br />
                  <span className="text-sm">Add columns like "Week 1", "Week 2", etc. in the Students table.</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl shadow-card p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Recent Reports</h3>
        {reportsLoading ? (
          <p className="text-muted-foreground">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-muted-foreground">No reports generated yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.slice(0, 5).map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Created on {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  report.status === 'approved' ? 'bg-success/10 text-success' :
                  report.status === 'submitted_to_hod' || report.status === 'submitted_to_principal' ? 'bg-accent/10 text-accent' :
                  'bg-warning/10 text-warning'
                }`}>
                  {report.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
