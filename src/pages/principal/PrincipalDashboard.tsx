import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { usePrincipalData } from '@/hooks/usePrincipalData';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Users, FileText, GraduationCap, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function PrincipalDashboard() {
  const { supabaseUser, user } = useAuth();
  const { departments, hods, stats, loading } = usePrincipalData();
  const { reports } = useReports(supabaseUser?.id || null, user?.role || null, null);

  // Department data for chart
  const departmentData = departments.map(d => ({
    name: d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name,
    students: d.student_count,
    teachers: d.teacher_count * 10, // Scale for visualization
  }));

  // Report status distribution
  const reportStatusData = [
    { name: 'Approved', value: stats.approvedReports, color: 'hsl(142, 76%, 36%)' },
    { name: 'Pending', value: stats.pendingReports, color: 'hsl(45, 93%, 47%)' },
    { name: 'Other', value: Math.max(0, stats.totalReports - stats.approvedReports - stats.pendingReports), color: 'hsl(215, 16%, 47%)' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <DashboardLayout title="Principal Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Principal Dashboard" subtitle="Institute-wide Overview and Analytics">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Departments"
          value={stats.totalDepartments}
          icon={<Building2 className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Total HODs"
          value={stats.totalHODs}
          icon={<GraduationCap className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Total Faculty"
          value={stats.totalTeachers}
          icon={<Users className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<Users className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Reports Received"
          value={stats.totalReports}
          icon={<FileText className="w-6 h-6 text-primary" />}
          variant="accent"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Department Overview</h3>
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Students" />
                <Bar dataKey="teachers" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Faculty (scaled)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No department data available
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Report Status Distribution</h3>
          {reportStatusData.length > 0 && stats.totalReports > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {reportStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {reportStatusData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No reports submitted yet
            </div>
          )}
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {departments.length > 0 ? (
          departments.map((dept) => (
            <div key={dept.id} className="bg-card rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs px-2 py-1 bg-success/10 text-success rounded-full">Active</span>
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">{dept.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                HOD: {dept.hod_name || 'Not assigned'}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Faculty:</span>
                  <span className="font-medium ml-1">{dept.teacher_count}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Students:</span>
                  <span className="font-medium ml-1">{dept.student_count}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 bg-card rounded-xl shadow-card p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No departments created yet</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
