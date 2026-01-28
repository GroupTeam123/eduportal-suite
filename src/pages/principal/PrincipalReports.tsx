import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReports, ReportRecord } from '@/hooks/useReports';
import { usePrincipalData } from '@/hooks/usePrincipalData';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, CheckCircle, Building2, Loader2, Eye, Trash2 } from 'lucide-react';
import { generateAnnualReportPDF, generateSingleStudentReportPDF, ReportData, SingleStudentReportData } from '@/utils/pdfGenerator';
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

export default function PrincipalReports() {
  const { supabaseUser, user } = useAuth();
  const { reports, loading, approveReport, deleteReport } = useReports(supabaseUser?.id || null, user?.role || null, null);
  const { departments } = usePrincipalData();
  const { toast } = useToast();
  
  const [previewReport, setPreviewReport] = useState<ReportRecord | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

  // Get department name for a report
  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return 'Unknown';
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || 'Unknown';
  };

  const getHODName = (deptId: string | null) => {
    if (!deptId) return 'Unknown';
    const dept = departments.find(d => d.id === deptId);
    return dept?.hod_name || 'Unknown';
  };

  const handleDownloadPDF = (report: ReportRecord) => {
    try {
      const chartData = report.chart_data as Record<string, unknown> | null;
      const reportType = chartData?.type as string;
      
      const deptName = getDepartmentName(report.department_id) || (chartData?.department as string) || 'Department';
      
      // Handle single student reports - use exact stored data
      if (reportType === 'single_student') {
        const studentReportData: SingleStudentReportData = {
          title: report.title || 'Student Report',
          generatedBy: (chartData?.generatedBy as string) || 'Teacher',
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
        generatedBy: (chartData?.generatedBy as string) || 'Teacher',
        department: deptName,
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

  const handleApprove = async (reportId: string) => {
    await approveReport(reportId);
  };

  const handleDeleteConfirm = async () => {
    if (deleteReportId) {
      await deleteReport(deleteReportId);
      setDeleteReportId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Submitted Reports" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Submitted Reports" subtitle="View all reports submitted by HODs">
      {reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${report.status === 'approved' ? 'text-success' : 'text-primary'}`} />
                  <span className={`text-sm font-medium ${report.status === 'approved' ? 'text-success' : 'text-primary'}`}>
                    {report.status === 'approved' ? 'Approved' : 'Pending Review'}
                  </span>
                </div>
              </div>
              
              <h3 className="font-display font-semibold mb-2 line-clamp-2">{report.title}</h3>
              
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{getDepartmentName(report.department_id)}</span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-1">By {getHODName(report.department_id)}</p>
              <p className="text-sm text-muted-foreground mb-4">{new Date(report.created_at).toLocaleDateString()}</p>

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
                {report.status !== 'approved' && (
                  <Button size="sm" className="flex-1" onClick={() => handleApprove(report.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDownloadPDF(report)}
                  title="Download Report"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No reports submitted to you yet.</p>
        </div>
      )}

      {/* Preview Dialog */}
      <ReportPreviewDialog
        report={previewReport}
        open={!!previewReport}
        onOpenChange={(open) => !open && setPreviewReport(null)}
        onDownload={handleDownloadPDF}
        departmentName={previewReport ? getDepartmentName(previewReport.department_id) : undefined}
        reporterName={previewReport ? getHODName(previewReport.department_id) : undefined}
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