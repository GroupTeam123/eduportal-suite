import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { mockDepartments, mockHODs, mockReports } from '@/data/mockData';
import { Building2, Users, FileText, TrendingUp, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const departmentData = mockDepartments.map(d => ({
  name: d.name.substring(0, 8),
  students: d.studentCount,
  teachers: d.teacherCount * 10,
}));

const reportStatusData = [
  { name: 'Approved', value: 45, color: 'hsl(142, 76%, 36%)' },
  { name: 'Pending', value: 30, color: 'hsl(45, 93%, 47%)' },
  { name: 'Draft', value: 25, color: 'hsl(215, 16%, 47%)' },
];

export default function PrincipalDashboard() {
  const totalStudents = mockDepartments.reduce((acc, d) => acc + d.studentCount, 0);
  const totalTeachers = mockDepartments.reduce((acc, d) => acc + d.teacherCount, 0);

  return (
    <DashboardLayout title="Principal Dashboard" subtitle="Institute-wide Overview and Analytics">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Departments"
          value={mockDepartments.length}
          icon={<Building2 className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Total HODs"
          value={mockHODs.length}
          icon={<GraduationCap className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Total Faculty"
          value={totalTeachers}
          icon={<Users className="w-6 h-6 text-primary" />}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={<Users className="w-6 h-6 text-primary" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Reports Received"
          value={mockReports.length * 4}
          icon={<FileText className="w-6 h-6 text-primary" />}
          variant="accent"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Department Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Students" />
              <Bar dataKey="teachers" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Faculty Rating" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl shadow-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Report Status Distribution</h3>
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
                <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDepartments.slice(0, 6).map((dept) => (
          <div key={dept.id} className="bg-card rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs px-2 py-1 bg-success/10 text-success rounded-full">Active</span>
            </div>
            <h3 className="font-display font-semibold text-lg mb-1">{dept.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">HOD: {dept.hodName}</p>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Faculty:</span>
                <span className="font-medium ml-1">{dept.teacherCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Students:</span>
                <span className="font-medium ml-1">{dept.studentCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
