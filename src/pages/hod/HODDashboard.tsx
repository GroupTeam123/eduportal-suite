import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { mockTeachers, mockStudents, mockReports } from '@/data/mockData';
import { Users, GraduationCap, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const departmentPerformance = [
  { month: 'Aug', students: 78, teachers: 85 },
  { month: 'Sep', students: 82, teachers: 88 },
  { month: 'Oct', students: 79, teachers: 90 },
  { month: 'Nov', students: 85, teachers: 87 },
  { month: 'Dec', students: 88, teachers: 92 },
  { month: 'Jan', students: 90, teachers: 94 },
];

const teacherWorkload = mockTeachers.map(t => ({
  name: t.name.split(' ')[1],
  students: t.students,
}));

export default function HODDashboard() {
  return (
    <DashboardLayout title="HOD Dashboard" subtitle="Department of Computer Science Overview">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Teachers"
          value={mockTeachers.length}
          icon={<GraduationCap className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Total Students"
          value={mockStudents.length * 4}
          icon={<Users className="w-6 h-6 text-primary" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Reports Submitted"
          value={mockReports.filter(r => r.status === 'submitted').length}
          icon={<FileText className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Dept. Performance"
          value="92%"
          icon={<TrendingUp className="w-6 h-6 text-primary" />}
          trend={{ value: 4, isPositive: true }}
          variant="secondary"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Department Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={departmentPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2} name="Student Avg" />
              <Line type="monotone" dataKey="teachers" stroke="hsl(var(--secondary))" strokeWidth={2} name="Teacher Rating" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Teacher Workload Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teacherWorkload}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip />
              <Bar dataKey="students" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Recent Teacher Reports</h3>
          <div className="space-y-3">
            {mockReports.slice(0, 3).map((report) => (
              <div key={report.id} className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-sm truncate">{report.title}</p>
                <p className="text-xs text-muted-foreground mt-1">By {report.createdBy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Teacher Overview</h3>
          <div className="space-y-3">
            {mockTeachers.slice(0, 3).map((teacher) => (
              <div key={teacher.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {teacher.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{teacher.name}</p>
                  <p className="text-xs text-muted-foreground">{teacher.students} students</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Pending Actions</h3>
          <div className="space-y-3">
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="font-medium text-sm">Review 3 pending reports</p>
              <p className="text-xs text-muted-foreground mt-1">Due by end of week</p>
            </div>
            <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="font-medium text-sm">Submit annual report to Principal</p>
              <p className="text-xs text-muted-foreground mt-1">Due in 5 days</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
