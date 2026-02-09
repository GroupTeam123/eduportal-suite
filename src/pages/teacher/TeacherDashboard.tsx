import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Users, FileText, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/hooks/useStudents';
import { useReports } from '@/hooks/useReports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

// Month configuration for attendance tracking
const MONTHS = [
  { full: 'january', short: 'Jan', order: 0 },
  { full: 'february', short: 'Feb', order: 1 },
  { full: 'march', short: 'Mar', order: 2 },
  { full: 'april', short: 'Apr', order: 3 },
  { full: 'may', short: 'May', order: 4 },
  { full: 'june', short: 'Jun', order: 5 },
  { full: 'july', short: 'Jul', order: 6 },
  { full: 'august', short: 'Aug', order: 7 },
  { full: 'september', short: 'Sep', order: 8 },
  { full: 'october', short: 'Oct', order: 9 },
  { full: 'november', short: 'Nov', order: 10 },
  { full: 'december', short: 'Dec', order: 11 },
];

// Helper to compute average monthly attendance from custom_fields for a group of students
const computeMonthlyAttendance = (students: Array<{ custom_fields?: Record<string, unknown> | null }>) => {
  const result: Array<{ name: string; value: number }> = [];
  
  MONTHS.forEach(month => {
    const key = `${month.full}_attendance`;
    let total = 0;
    let count = 0;
    
    students.forEach(student => {
      const customFields = student.custom_fields as Record<string, unknown> | null;
      if (customFields) {
        const value = customFields[key];
        if (value !== undefined && value !== null && value !== '') {
          const numValue = typeof value === 'number' ? value : parseFloat(String(value));
          if (!isNaN(numValue)) {
            total += numValue;
            count += 1;
          }
        }
      }
    });
    
    // Only include months that have data
    if (count > 0) {
      result.push({
        name: month.short,
        value: Math.round(total / count)
      });
    }
  });
  
  return result;
};

const getGlobalSemester = (year: number, sem: number) => (year - 1) * 2 + sem;

export default function TeacherDashboard() {
  const { user, departmentId, supabaseUser } = useAuth();
  const { students, loading: studentsLoading } = useStudents(departmentId);
  const { reports, loading: reportsLoading } = useReports(supabaseUser?.id || null, user?.role || null, departmentId);
  
  // Get students by year and semester
  const studentsBySemester = useMemo(() => {
    const result: Record<string, typeof students> = {};
    for (let year = 1; year <= 4; year++) {
      for (let sem = 1; sem <= 2; sem++) {
        result[`${year}-${sem}`] = students.filter(
          s => (s.year || 1) === year && ((s as any).semester || 1) === sem
        );
      }
    }
    return result;
  }, [students]);
  
  // Total students count (sum of all)
  const totalStudents = students.length;
  
  // Year-wise average attendance
  const yearWiseAttendance = useMemo(() => {
    return [1, 2, 3, 4].map(year => {
      const yearStudents = students.filter(s => (s.year || 1) === year);
      if (yearStudents.length === 0) return { year, avg: 0 };
      const avg = Math.round(
        yearStudents.reduce((acc, s) => acc + (s.attendance || 0), 0) / yearStudents.length
      );
      return { year, avg };
    });
  }, [students]);
  
  // Monthly attendance data for each semester
  const monthlyAttendanceBySemester = useMemo(() => {
    const result: Record<string, Array<{ name: string; value: number }>> = {};
    for (let year = 1; year <= 4; year++) {
      for (let sem = 1; sem <= 2; sem++) {
        const key = `${year}-${sem}`;
        result[key] = computeMonthlyAttendance(studentsBySemester[key] || []);
      }
    }
    return result;
  }, [studentsBySemester]);
  
  // Reports count
  const reportsCount = reports.length;
  
  const yearLabels = ['1st', '2nd', '3rd', '4th'];
  const chartColors = [
    'hsl(var(--primary))',
    'hsl(199, 89%, 48%)',
    'hsl(142, 76%, 36%)',
    'hsl(38, 92%, 50%)'
  ];
  const semChartColors = [
    ['hsl(var(--primary))', 'hsl(262, 83%, 58%)'],
    ['hsl(199, 89%, 48%)', 'hsl(199, 89%, 35%)'],
    ['hsl(142, 76%, 36%)', 'hsl(142, 76%, 50%)'],
    ['hsl(38, 92%, 50%)', 'hsl(25, 95%, 53%)'],
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

      {/* Monthly Attendance Charts - Semester-wise (2 per year) */}
      <div className="space-y-8 mb-8">
        {[1, 2, 3, 4].map((year, idx) => (
          <div key={year}>
            <h3 className="font-display text-lg font-semibold mb-4">
              {yearLabels[idx]} Year Monthly Attendance Trend
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map(sem => {
                const semKey = `${year}-${sem}`;
                const semData = monthlyAttendanceBySemester[semKey] || [];
                const globalSem = getGlobalSemester(year, sem);
                return (
                  <div key={sem} className="bg-card rounded-xl shadow-card p-6">
                    <h4 className="font-display text-base font-medium mb-4 text-muted-foreground">
                      Semester {globalSem}
                    </h4>
                    {semData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={semData}>
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
                          <Bar dataKey="value" fill={semChartColors[idx][sem - 1]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        <p className="text-center">
                          No monthly attendance data available.<br />
                          <span className="text-sm">Add monthly attendance in the Students table for Sem {globalSem}.</span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
