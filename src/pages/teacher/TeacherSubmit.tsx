import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/hooks/useStudents';
import { Send, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TeacherSubmit() {
  const { supabaseUser, user, departmentId } = useAuth();
  const { createReport, submitReport } = useReports(supabaseUser?.id || null, user?.role || null, departmentId);
  const { students } = useStudents(departmentId);
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a report title.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate chart data from student records
      const attendanceData = students.slice(0, 10).map(s => ({
        name: s.name.split(' ')[0],
        attendance: s.attendance || 0,
      }));

      const avgAttendance = students.length > 0
        ? students.reduce((sum, s) => sum + (s.attendance || 0), 0) / students.length
        : 0;

      const gradeData = [
        { name: 'Excellent (90%+)', value: students.filter(s => (s.attendance || 0) >= 90).length, color: '#22c55e' },
        { name: 'Good (75-89%)', value: students.filter(s => (s.attendance || 0) >= 75 && (s.attendance || 0) < 90).length, color: '#3b82f6' },
        { name: 'Average (60-74%)', value: students.filter(s => (s.attendance || 0) >= 60 && (s.attendance || 0) < 75).length, color: '#f59e0b' },
        { name: 'Poor (<60%)', value: students.filter(s => (s.attendance || 0) < 60).length, color: '#ef4444' },
      ];

      const chartData = {
        attendanceData,
        gradeData,
        performanceData: [],
        summary: {
          totalStudents: students.length,
          avgAttendance,
          highPerformers: students.filter(s => (s.attendance || 0) >= 90).length,
          lowAttendance: students.filter(s => (s.attendance || 0) < 75).length,
        },
      };

      // Create the report
      const newReport = await createReport({
        title,
        content: content || undefined,
        chart_data: chartData,
      });

      if (newReport) {
        // Submit to HOD
        await submitReport(newReport.id, 'hod');
        setSubmitted(true);
        setTitle('');
        setContent('');
        toast({
          title: 'Report Submitted',
          description: 'Your report has been sent to the HOD.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <DashboardLayout title="Submit Report" subtitle="Create and submit reports to HOD">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Report Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Your report has been successfully sent to the HOD for review.
          </p>
          <Button onClick={() => setSubmitted(false)}>Submit Another Report</Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Submit Report" subtitle="Create and submit reports to HOD">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Create New Report</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                placeholder="Enter report title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="content">Report Content (Optional)</Label>
              <Textarea
                id="content"
                placeholder="Add details, observations, or notes for the HOD..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1.5 min-h-[150px]"
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Report Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Students:</span>
                  <span className="ml-2 font-medium">{students.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Attendance:</span>
                  <span className="ml-2 font-medium">
                    {students.length > 0
                      ? (students.reduce((sum, s) => sum + (s.attendance || 0), 0) / students.length).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">High Performers:</span>
                  <span className="ml-2 font-medium text-success">
                    {students.filter(s => (s.attendance || 0) >= 90).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Low Attendance:</span>
                  <span className="ml-2 font-medium text-destructive">
                    {students.filter(s => (s.attendance || 0) < 75).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit to HOD
              </>
            )}
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
