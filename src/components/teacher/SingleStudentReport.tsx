import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { StudentRecord } from '@/hooks/useStudents';
import { ReportRecord } from '@/hooks/useReports';
import { Download, Send, BarChart3, PieChart, LineChart, User, Plus, X, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart as RechartsLine, Line, Legend } from 'recharts';
import { generateSingleStudentReportPDF, SingleStudentReportData } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SingleStudentReportProps {
  students: StudentRecord[];
  onCreateReport: (report: { title: string; content: string; chart_data: Record<string, unknown> }) => Promise<ReportRecord | null>;
  onSubmitToHOD: (reportId: string) => Promise<void>;
  userName: string;
}

interface CustomField {
  id: string;
  label: string;
  value: string;
}

const chartOptions = [
  { id: 'attendance_pie', label: 'Attendance (Pie Chart)', icon: PieChart },
  { id: 'progress_line', label: 'Progress Trend', icon: LineChart },
  { id: 'marks_bar', label: 'Subject Marks', icon: BarChart3 },
];

const ATTENDANCE_COLORS = ['hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)'];
const SUBJECT_COLORS = ['hsl(199, 89%, 48%)', 'hsl(45, 93%, 47%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(142, 76%, 36%)'];

export function SingleStudentReport({ students, onCreateReport, onSubmitToHOD, userName }: SingleStudentReportProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedCharts, setSelectedCharts] = useState<string[]>(['attendance_pie', 'marks_bar']);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [subjectMarks, setSubjectMarks] = useState<{ subject: string; marks: number; outOf: number }[]>([
    { subject: 'Mathematics', marks: 85, outOf: 100 },
    { subject: 'Science', marks: 78, outOf: 100 },
    { subject: 'English', marks: 82, outOf: 100 },
  ]);
  const [progressData, setProgressData] = useState<{ month: string; score: number }[]>([
    { month: 'Aug', score: 70 },
    { month: 'Sep', score: 72 },
    { month: 'Oct', score: 75 },
    { month: 'Nov', score: 80 },
    { month: 'Dec', score: 85 },
    { month: 'Jan', score: 88 },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);
  const { toast } = useToast();

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const toggleChart = (chartId: string) => {
    setSelectedCharts(prev =>
      prev.includes(chartId)
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  const addCustomField = () => {
    setCustomFields(prev => [...prev, { id: Date.now().toString(), label: '', value: '' }]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const updateCustomField = (id: string, field: 'label' | 'value', value: string) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const addSubject = () => {
    setSubjectMarks(prev => [...prev, { subject: '', marks: 0, outOf: 100 }]);
  };

  const removeSubject = (index: number) => {
    setSubjectMarks(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubjectMarks = (index: number, field: 'subject' | 'marks' | 'outOf', value: string | number) => {
    setSubjectMarks(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const attendancePieData = selectedStudent ? [
    { name: 'Present', value: selectedStudent.attendance || 0 },
    { name: 'Absent', value: 100 - (selectedStudent.attendance || 0) },
  ] : [];

  const handleGenerateReport = async () => {
    if (!selectedStudent) {
      toast({ title: 'Select Student', description: 'Please select a student first.', variant: 'destructive' });
      return;
    }
    if (!reportTitle) {
      toast({ title: 'Title Required', description: 'Please enter a report title.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);

    const chartData = {
      type: 'single_student',
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentStudentId: selectedStudent.student_id,
      selectedCharts,
      attendanceData: attendancePieData,
      subjectMarks,
      progressData,
      customFields: customFields.filter(f => f.label && f.value),
      generatedAt: new Date().toISOString(),
    };

    const content = `
Student Report for ${selectedStudent.name}
Student ID: ${selectedStudent.student_id || 'N/A'}
Year: ${selectedStudent.year || 1}
Email: ${selectedStudent.email || 'N/A'}
Attendance: ${selectedStudent.attendance || 0}%

${reportDescription}

${customFields.filter(f => f.label && f.value).map(f => `${f.label}: ${f.value}`).join('\n')}
    `.trim();

    const result = await onCreateReport({
      title: reportTitle,
      content,
      chart_data: chartData,
    });

    setIsGenerating(false);

    if (result) {
      setGeneratedReportId(result.id);
      toast({ title: 'Report Created', description: 'Student report has been saved.' });
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedStudent) return;

    const reportData: SingleStudentReportData = {
      title: reportTitle || `Student Report - ${selectedStudent.name}`,
      generatedBy: userName,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      description: reportDescription || undefined,
      student: {
        name: selectedStudent.name,
        studentId: selectedStudent.student_id || undefined,
        year: selectedStudent.year || undefined,
        email: selectedStudent.email || undefined,
        attendance: selectedStudent.attendance || 0,
        contact: selectedStudent.contact || undefined,
        guardianName: selectedStudent.guardian_name || undefined,
        guardianPhone: selectedStudent.guardian_phone || undefined,
      },
      customFields: customFields.filter(f => f.label && f.value).map(f => ({ label: f.label, value: f.value })),
      subjectMarks: subjectMarks.filter(s => s.subject).map(s => ({ subject: s.subject, marks: s.marks, outOf: s.outOf })),
      monthlyAttendance: (() => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const studentCustomFields = selectedStudent.custom_fields as Record<string, unknown> || {};
        return months
          .map(month => {
            // Check for both patterns: "January" or "january_attendance"
            const directValue = studentCustomFields[month];
            const snakeCaseKey = `${month.toLowerCase()}_attendance`;
            const snakeCaseValue = studentCustomFields[snakeCaseKey];
            const value = directValue ?? snakeCaseValue;
            return { month, value };
          })
          .filter(item => item.value !== undefined && item.value !== null)
          .map(item => ({ month: item.month.substring(0, 3), attendance: Number(item.value) || 0 }));
      })(),
      progressData: progressData,
      selectedCharts: selectedCharts,
    };

    generateSingleStudentReportPDF(reportData);
    toast({ title: 'PDF Downloaded', description: 'Student report has been saved.' });
  };

  const handleSubmit = async () => {
    if (generatedReportId) {
      await onSubmitToHOD(generatedReportId);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-display text-lg font-semibold mb-6 flex items-center gap-2">
        <User className="w-5 h-5" />
        Single Student Report
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Configuration */}
        <div className="space-y-4">
          <div>
            <Label>Search Student</Label>
            <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={studentSearchOpen}
                  className="w-full justify-between mt-1.5"
                >
                  {selectedStudent
                    ? `${selectedStudent.name} ${selectedStudent.student_id ? `(${selectedStudent.student_id})` : ''}`
                    : "Search by name or ID..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-background border shadow-lg z-50" align="start">
                <Command>
                  <CommandInput placeholder="Search by name or student ID..." />
                  <CommandList>
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup>
                      {students.map(student => (
                        <CommandItem
                          key={student.id}
                          value={`${student.name} ${student.student_id || ''}`}
                          onSelect={() => {
                            setSelectedStudentId(student.id);
                            setStudentSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedStudentId === student.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{student.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {student.student_id ? `ID: ${student.student_id}` : 'No ID'} • Year {student.year || 1}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedStudent && (
            <>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedStudent.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Student ID</p>
                  <p className="font-medium">{selectedStudent.student_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Year</p>
                  <p className="font-medium">{selectedStudent.year || 1}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <p className="font-medium">{selectedStudent.attendance || 0}%</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedStudent.email || 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label>Report Title</Label>
                <Input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g., Monthly Progress Report"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Description / Notes</Label>
                <Textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Add notes about the student's performance..."
                  className="mt-1.5"
                />
              </div>

              {/* Custom Fields */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Additional Information</Label>
                  <Button variant="ghost" size="sm" onClick={addCustomField}>
                    <Plus className="w-4 h-4 mr-1" /> Add Field
                  </Button>
                </div>
                <div className="space-y-2">
                  {customFields.map(field => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <Input
                        placeholder="Label"
                        value={field.label}
                        onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeCustomField(field.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Marks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Subject Marks</Label>
                  <Button variant="ghost" size="sm" onClick={addSubject}>
                    <Plus className="w-4 h-4 mr-1" /> Add Subject
                  </Button>
                </div>
                <div className="space-y-2">
                  {subjectMarks.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Subject"
                        value={item.subject}
                        onChange={(e) => updateSubjectMarks(index, 'subject', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Marks"
                        value={item.marks}
                        onChange={(e) => updateSubjectMarks(index, 'marks', parseInt(e.target.value) || 0)}
                        className="w-20"
                        min={0}
                      />
                      <span className="text-muted-foreground">/</span>
                      <Input
                        type="number"
                        placeholder="Out of"
                        value={item.outOf}
                        onChange={(e) => updateSubjectMarks(index, 'outOf', parseInt(e.target.value) || 100)}
                        className="w-20"
                        min={1}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeSubject(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart Selection */}
              <div>
                <Label className="mb-2 block">Select Visualizations</Label>
                <div className="space-y-2">
                  {chartOptions.map(option => (
                    <label
                      key={option.id}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedCharts.includes(option.id)}
                        onCheckedChange={() => toggleChart(option.id)}
                      />
                      <option.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right - Preview */}
        <div className="space-y-4">
          {selectedStudent ? (
            <>
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Preview</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </div>

              {selectedCharts.includes('attendance_pie') && selectedStudent && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium mb-3">Attendance</h5>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Pie Chart */}
                    <div>
                      <p className="text-xs text-muted-foreground text-center mb-2">Overall Attendance</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <RechartsPie>
                          <Pie
                            data={attendancePieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {attendancePieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    {/* Monthly Bar Chart */}
                    <div>
                      <p className="text-xs text-muted-foreground text-center mb-2">Monthly Attendance</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={(() => {
                          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                          const studentCustomFields = selectedStudent.custom_fields as Record<string, unknown> || {};
                          return months
                            .map(month => {
                              // Check for both patterns: "January" or "january_attendance"
                              const directValue = studentCustomFields[month];
                              const snakeCaseKey = `${month.toLowerCase()}_attendance`;
                              const snakeCaseValue = studentCustomFields[snakeCaseKey];
                              const value = directValue ?? snakeCaseValue;
                              return { month, value };
                            })
                            .filter(item => item.value !== undefined && item.value !== null)
                            .map(item => ({
                              month: item.month.substring(0, 3),
                              attendance: Number(item.value) || 0
                            }));
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={9} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="attendance" fill="hsl(142, 76%, 36%)" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {selectedCharts.includes('marks_bar') && subjectMarks.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium mb-3">Subject Marks</h5>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={subjectMarks}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="marks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {selectedCharts.includes('progress_line') && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium mb-3">Progress Trend</h5>
                  <ResponsiveContainer width="100%" height={180}>
                    <RechartsLine data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
                    </RechartsLine>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={handleGenerateReport} disabled={isGenerating} className="flex-1">
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    'Save Report'
                  )}
                </Button>
                {generatedReportId && (
                  <Button variant="outline" onClick={handleSubmit}>
                    <Send className="w-4 h-4 mr-2" /> Submit to HOD
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a student to generate report</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
