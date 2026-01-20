import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { mockStudents, mockReports } from '@/data/mockData';
import { Users, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const attendanceData = [
  { name: 'Week 1', value: 92 },
  { name: 'Week 2', value: 88 },
  { name: 'Week 3', value: 95 },
  { name: 'Week 4', value: 90 },
  { name: 'Week 5', value: 87 },
  { name: 'Week 6', value: 93 },
];

const gradeDistribution = [
  { name: 'A+', value: 15, color: 'hsl(142, 76%, 36%)' },
  { name: 'A', value: 25, color: 'hsl(199, 89%, 48%)' },
  { name: 'B+', value: 30, color: 'hsl(45, 93%, 47%)' },
  { name: 'B', value: 20, color: 'hsl(38, 92%, 50%)' },
  { name: 'C', value: 10, color: 'hsl(0, 84%, 60%)' },
];

export default function TeacherDashboard() {
  const avgAttendance = Math.round(mockStudents.reduce((acc, s) => acc + s.attendance, 0) / mockStudents.length);
  
  return (
    <DashboardLayout title="Teacher Dashboard" subtitle="Welcome back, Dr. Sarah Johnson">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={mockStudents.length}
          icon={<Users className="w-6 h-6 text-primary" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Avg. Attendance"
          value={`${avgAttendance}%`}
          icon={<BarChart3 className="w-6 h-6 text-primary" />}
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          title="Reports Generated"
          value={mockReports.length}
          icon={<FileText className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Performance Index"
          value="8.4"
          icon={<TrendingUp className="w-6 h-6 text-primary" />}
          trend={{ value: 5, isPositive: true }}
          variant="primary"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance Chart */}
        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
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
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution */}
        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {gradeDistribution.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl shadow-card p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Recent Reports</h3>
        <div className="space-y-3">
          {mockReports.map((report) => (
            <div key={report.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">{report.title}</p>
                <p className="text-sm text-muted-foreground">Created on {report.createdAt}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                report.status === 'approved' ? 'bg-success/10 text-success' :
                report.status === 'submitted' ? 'bg-accent/10 text-accent' :
                'bg-warning/10 text-warning'
              }`}>
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
