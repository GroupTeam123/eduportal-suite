import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReports, ReportRecord } from '@/hooks/useReports';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, CheckCircle, Clock, AlertCircle, Send, Loader2, Trash2, Eye } from 'lucide-react';
import { generateAnnualReportPDF, generateSingleStudentReportPDF, ReportData, SingleStudentReportData } from '@/utils/pdfGenerator';
import { useStudents } from '@/hooks/useStudents';
import { useToast } from '@/hooks/use-toast';
import { ReportPreviewDialog } from '@/components/reports/ReportPreviewDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function HODReports() {
  const { supabaseUser, user, departmentId } = useAuth();
  const { reports, loading, submitReport, deleteReport } = useReports(supabaseUser?.id || null, user?.role || null, departmentId);
  const { students } = useStudents(departmentId);
  const { toast } = useToast();

  const [previewReport, setPreviewReport] = useState<ReportRecord | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'submitted_to_principal':
        return <Send className="w-4 h-4 text-primary" />;
      case 'submitted_to_hod':
        return <Clock className="w-4 h-4 text-accent" />;
      default:
        return <AlertCircle className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleDownloadPDF = (report: ReportRecord) => {
    try {
      const chartData = report.chart_data as Record<string, unknown> | null;
      const reportType = chartData?.type as string;
      
      // Handle single student reports - use exact stored data
      if (reportType === 'single_student') {
        const studentReportData: SingleStudentReportData = {
          title: report.title || 'Student Report',
          generatedBy: (chartData?.generatedBy as string) || user?.name || 'Teacher',
          description: report.content || undefined,
          date: new Date(report.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          student: {
            name: (chartData?.studentName as string) || 'Unknown Student',
            studentId: (chartData?.studentStudentId as string) || undefined,
            year: (chartData?.studentYear as number) || undefined,
            email: (chartData?.studentEmail as string) || undefined,
            contact: (chartData?.studentContact as number) || undefined,
            guardianName: (chartData?.guardianName as string) || undefined,
            guardianPhone: (chartData?.guardianPhone as string) || undefined,
            attendance: (chartData?.attendanceData as { name: string; value: number }[])?.find(d => d.name === 'Present')?.value || 0,
          },
          customFields: (chartData?.customFields as { label: string; value: string }[]) || [],
          subjectMarks: (chartData?.subjectMarks as { subject: string; marks: number; outOf: number }[]) || [],
          monthlyAttendance: (chartData?.monthlyAttendance as { month: string; attendance: number }[]) || [],
          progressData: (chartData?.progressData as { month: string; score: number }[]) || [],
          selectedCharts: (chartData?.selectedCharts as string[]) || [],
        };

        generateSingleStudentReportPDF(studentReportData);
        toast({ title: 'PDF Downloaded', description: 'Student report has been saved.' });
        return;
      }
      
      // Handle class reports - use exact stored data from teacher
      const selectedChartsFromData = (chartData?.selectedCharts as string[]) || [];
      
      const reportData: ReportData = {
        title: report.title || 'Department Report',
        content: report.content || undefined,
        generatedBy: (chartData?.generatedBy as string) || user?.name || 'Teacher',
        department: (chartData?.department as string) || undefined,
        date: new Date(report.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        charts: {
          attendance: selectedChartsFromData.includes('attendance') 
            ? (chartData?.attendanceData as { name: string; attendance: number }[]) || [] 
            : undefined,
          grades: selectedChartsFromData.includes('grades') 
            ? (chartData?.gradeData as { name: string; value: number; color: string }[]) || [] 
            : undefined,
          performance: selectedChartsFromData.includes('performance') 
            ? (chartData?.performanceData as { month: string; score: number }[]) || [] 
            : undefined,
          comparison: selectedChartsFromData.includes('comparison') 
            ? (chartData?.subjectComparisonData as { subject: string; avg: number }[]) || [] 
            : undefined,
        },
        students: (chartData?.students as { student_id?: string; name: string; email?: string; contact?: number; attendance?: number }[]) || [],
        summary: (chartData?.summary as { totalStudents: number; avgAttendance: number; highPerformers: number; lowAttendance: number }) || undefined,
      };

      generateAnnualReportPDF(reportData);
      toast({ title: 'PDF Downloaded', description: 'Report has been saved.' });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({ 
        title: 'Download Failed', 
        description: 'Could not generate the PDF. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSubmitToPrincipal = async (reportId: string) => {
    await submitReport(reportId, 'principal');
  };

  const handleDeleteConfirm = async () => {
    if (deleteReportId) {
      await deleteReport(deleteReportId);
      setDeleteReportId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Teacher Reports" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Department Reports" subtitle="View and manage reports from teachers">
      {reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(report.status)}
                  <span className={`text-sm font-medium ${
                    report.status === 'approved' ? 'text-success' :
                    report.status === 'submitted_to_principal' ? 'text-primary' :
                    report.status === 'submitted_to_hod' ? 'text-accent' :
                    'text-warning'
                  }`}>
                    {getStatusLabel(report.status)}
                  </span>
                </div>
              </div>
              
              <h3 className="font-display font-semibold mb-2 line-clamp-2">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {new Date(report.created_at).toLocaleDateString()}
              </p>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPreviewReport(report)}
                  title="Preview Report"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDeleteReportId(report.id)} 
                  className="text-destructive hover:text-destructive"
                  title="Delete Report"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {report.status === 'submitted_to_hod' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleSubmitToPrincipal(report.id)}
                    title="Forward to Principal"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDownloadPDF(report)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No reports submitted yet.</p>
        </div>
      )}

      {/* Preview Dialog */}
      <ReportPreviewDialog
        report={previewReport}
        open={!!previewReport}
        onOpenChange={(open) => !open && setPreviewReport(null)}
        onDownload={handleDownloadPDF}
        reporterName={user?.name}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReportId} onOpenChange={(open) => !open && setDeleteReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}