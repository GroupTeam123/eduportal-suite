import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReports, ReportRecord } from '@/hooks/useReports';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, BarChart3, PieChart, LineChart, TrendingUp, Loader2, Send, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart as RechartsLine, Line } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { generateAnnualReportPDF, ReportData } from '@/utils/pdfGenerator';
import { SingleStudentReport } from '@/components/teacher/SingleStudentReport';
import { Json } from '@/integrations/supabase/types';

const chartOptions = [
  { id: 'attendance', label: 'Attendance Analysis', icon: BarChart3 },
  { id: 'performance', label: 'Performance Trend', icon: LineChart },
  { id: 'comparison', label: 'Subject Comparison', icon: TrendingUp },
];

const gradeData = [
  { name: 'A+', value: 15, color: 'hsl(142, 76%, 36%)' },
  { name: 'A', value: 25, color: 'hsl(199, 89%, 48%)' },
  { name: 'B+', value: 30, color: 'hsl(45, 93%, 47%)' },
  { name: 'B', value: 20, color: 'hsl(38, 92%, 50%)' },
  { name: 'C', value: 10, color: 'hsl(0, 84%, 60%)' },
];

const performanceData = [
  { month: 'Aug', score: 72 },
  { month: 'Sep', score: 75 },
  { month: 'Oct', score: 78 },
  { month: 'Nov', score: 82 },
  { month: 'Dec', score: 85 },
  { month: 'Jan', score: 88 },
];

export default function TeacherReports() {
  const { supabaseUser, user, departmentId } = useAuth();
  const { reports, loading, createReport, submitReport } = useReports(supabaseUser?.id || null, user?.role || null, departmentId);
  const { students } = useStudents(departmentId);
  
  const [reportTab, setReportTab] = useState<string>('class');
  const [selectedCharts, setSelectedCharts] = useState<string[]>(['attendance', 'performance']);
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const { toast } = useToast();

  // Filter students by selected year
  const filteredStudents = selectedYear === 'all' 
    ? students 
    : students.filter(s => s.year === parseInt(selectedYear));

  // Generate attendance data from filtered students
  const attendanceData = filteredStudents.slice(0, 8).map(s => ({ 
    name: s.name.split(' ')[0].substring(0, 6), 
    attendance: s.attendance || 0 
  }));

  const toggleChart = (chartId: string) => {
    setSelectedCharts(prev => 
      prev.includes(chartId) 
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  const handleGenerateReport = async () => {
    if (!reportTitle) {
      toast({
        title: 'Title Required',
        description: 'Please enter a report title.',
        variant: 'destructive',
      });
      return;
    }
    if (selectedCharts.length === 0) {
      toast({
        title: 'Select Charts',
        description: 'Please select at least one chart type.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsGenerating(true);
    
    const chartData = {
      type: 'class_report',
      selectedYear,
      selectedCharts,
      attendanceData,
      gradeData,
      performanceData,
      generatedAt: new Date().toISOString(),
    };

    const result = await createReport({
      title: reportTitle,
      content: reportContent,
      chart_data: chartData,
    });

    setIsGenerating(false);
    
    if (result) {
      setReportTitle('');
      setReportContent('');
    }
  };

  const handleSubmitToHOD = async (reportId: string) => {
    await submitReport(reportId, 'hod');
  };

  const handleDownloadPDF = (report?: ReportRecord) => {
    // Calculate summary from filtered students
    const totalStudents = filteredStudents.length;
    const avgAttendance = filteredStudents.length > 0 
      ? filteredStudents.reduce((sum, s) => sum + (s.attendance || 0), 0) / filteredStudents.length 
      : 0;
    const highPerformers = filteredStudents.filter(s => (s.attendance || 0) >= 90).length;
    const lowAttendance = filteredStudents.filter(s => (s.attendance || 0) < 75).length;

    // Use report data if provided, otherwise use current preview
    const chartData = report?.chart_data as Record<string, unknown> | null;
    const selectedChartsToUse = chartData?.selectedCharts as string[] || selectedCharts;
    
    const reportData: ReportData = {
      title: report?.title || reportTitle || 'Annual Report',
      content: report?.content || reportContent || undefined,
      generatedBy: user?.name || 'Teacher',
      department: undefined,
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      charts: {
        attendance: selectedChartsToUse.includes('attendance') ? attendanceData : undefined,
        grades: selectedChartsToUse.includes('grades') ? gradeData.map(g => ({
          ...g,
          color: g.color.startsWith('hsl') ? hslToHex(g.color) : g.color,
        })) : undefined,
        performance: selectedChartsToUse.includes('performance') ? performanceData : undefined,
        comparison: selectedChartsToUse.includes('comparison') ? [
          { subject: 'DSA', avg: 82 },
          { subject: 'OS', avg: 78 },
          { subject: 'DBMS', avg: 85 },
          { subject: 'Networks', avg: 80 },
        ] : undefined,
      },
      students: filteredStudents.slice(0, 30).map(s => ({
        name: s.name,
        email: s.email || undefined,
        attendance: s.attendance || undefined,
        guardian_name: s.guardian_name || undefined,
      })),
      summary: {
        totalStudents,
        avgAttendance,
        highPerformers,
        lowAttendance,
      },
    };

    generateAnnualReportPDF(reportData);
    
    toast({
      title: 'PDF Downloaded',
      description: 'Your report has been saved.',
    });
  };

  // Helper function to convert HSL to Hex
  const hslToHex = (hsl: string): string => {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
    if (!match) return '#6b7280';
    
    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const handleCreateSingleStudentReport = async (report: { title: string; content: string; chart_data: Record<string, unknown> }) => {
    return await createReport({
      title: report.title,
      content: report.content,
      chart_data: report.chart_data as Json,
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Report Generation" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Report Generation" subtitle="Create customized reports with data visualization">
      <Tabs value={reportTab} onValueChange={setReportTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="class" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Class Report
          </TabsTrigger>
          <TabsTrigger value="student" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Single Student Report
          </TabsTrigger>
        </TabsList>

        {/* Class Report Tab */}
        <TabsContent value="class">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Configuration */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6">
                <h3 className="font-display text-lg font-semibold mb-4">Report Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label>Select Year</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select year..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="all">All Years</SelectItem>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="title">Report Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Q1 Performance Report"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Report Description</Label>
                    <Textarea
                      id="content"
                      placeholder="Add notes or description for this report..."
                      value={reportContent}
                      onChange={(e) => setReportContent(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">Select Charts</Label>
                    <div className="space-y-3">
                      {chartOptions.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedCharts.includes(option.id)}
                            onCheckedChange={() => toggleChart(option.id)}
                          />
                          <option.icon className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Save Report
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Recent Reports */}
              <Card className="p-6">
                <h3 className="font-display text-lg font-semibold mb-4">My Reports</h3>
                <div className="space-y-3">
                  {reports.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No reports created yet</p>
                  ) : (
                    reports.slice(0, 5).map((report) => (
                      <div key={report.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{report.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(report.created_at).toLocaleDateString()} • 
                              <span className={`ml-1 ${
                                report.status === 'draft' ? 'text-warning' :
                                report.status === 'approved' ? 'text-success' : 'text-primary'
                              }`}>
                                {report.status.replace(/_/g, ' ')}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {report.status === 'draft' && (
                              <Button variant="ghost" size="icon" onClick={() => handleSubmitToHOD(report.id)} title="Submit to HOD">
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(report)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Right Panel - Preview */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg font-semibold">
                    {reportTitle || 'Report Preview'}
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadPDF()}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedCharts.includes('attendance') && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-medium mb-4">Attendance Analysis</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={attendanceData.length > 0 ? attendanceData : [{ name: 'No data', attendance: 0 }]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {selectedCharts.includes('grades') && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-medium mb-4">Grade Distribution</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPie>
                          <Pie data={gradeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                            {gradeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {selectedCharts.includes('performance') && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-medium mb-4">Performance Trend</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsLine data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
                        </RechartsLine>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {selectedCharts.includes('comparison') && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-medium mb-4">Subject Comparison</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={[
                          { subject: 'DSA', avg: 82 },
                          { subject: 'OS', avg: 78 },
                          { subject: 'DBMS', avg: 85 },
                          { subject: 'Networks', avg: 80 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="avg" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {selectedCharts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select chart types to preview your report</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Single Student Report Tab */}
        <TabsContent value="student">
          <SingleStudentReport
            students={students}
            onCreateReport={handleCreateSingleStudentReport}
            onSubmitToHOD={handleSubmitToHOD}
            userName={user?.name || 'Teacher'}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
