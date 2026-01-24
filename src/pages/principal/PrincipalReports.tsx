import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReports, ReportRecord } from '@/hooks/useReports';
import { usePrincipalData } from '@/hooks/usePrincipalData';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, CheckCircle, Building2, Loader2 } from 'lucide-react';
import { generateAnnualReportPDF, ReportData } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

export default function PrincipalReports() {
  const { supabaseUser, user } = useAuth();
  const { reports, loading, approveReport } = useReports(supabaseUser?.id || null, user?.role || null, null);
  const { departments } = usePrincipalData();
  const { toast } = useToast();

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
    const chartData = report.chart_data as Record<string, unknown> | null;
    
    const reportData: ReportData = {
      title: report.title,
      content: report.content || undefined,
      generatedBy: getHODName(report.department_id),
      department: getDepartmentName(report.department_id),
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      charts: {
        attendance: chartData?.attendanceData as { name: string; attendance: number }[] || [],
        grades: chartData?.gradeData as { name: string; value: number; color: string }[] || [],
        performance: chartData?.performanceData as { month: string; score: number }[] || [],
      },
      students: [],
      summary: undefined,
    };

    generateAnnualReportPDF(reportData);
    toast({ title: 'PDF Downloaded', description: 'Report has been saved.' });
  };

  const handleApprove = async (reportId: string) => {
    await approveReport(reportId);
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
                {report.status !== 'approved' && (
                  <Button size="sm" className="flex-1" onClick={() => handleApprove(report.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
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
          <p className="text-muted-foreground">No reports submitted to you yet.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
