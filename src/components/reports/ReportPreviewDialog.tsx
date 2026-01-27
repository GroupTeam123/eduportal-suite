import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileText, Calendar, User, Building2 } from 'lucide-react';
import { ReportRecord } from '@/hooks/useReports';

interface ReportPreviewDialogProps {
  report: ReportRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (report: ReportRecord) => void;
  departmentName?: string;
  reporterName?: string;
}

export function ReportPreviewDialog({
  report,
  open,
  onOpenChange,
  onDownload,
  departmentName,
  reporterName,
}: ReportPreviewDialogProps) {
  if (!report) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'submitted_to_principal':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'submitted_to_hod':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const chartData = report.chart_data as Record<string, unknown> | null;
  const hasAttendanceData = chartData?.attendanceData && Array.isArray(chartData.attendanceData) && chartData.attendanceData.length > 0;
  const hasPerformanceData = chartData?.performanceData && Array.isArray(chartData.performanceData) && chartData.performanceData.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Report Preview
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Title and Status */}
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold">{report.title || 'Untitled Report'}</h2>
              <Badge className={getStatusColor(report.status)}>
                {getStatusLabel(report.status)}
              </Badge>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Created: {new Date(report.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              {reporterName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>By: {reporterName}</span>
                </div>
              )}
              {departmentName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>Department: {departmentName}</span>
                </div>
              )}
            </div>

            {/* Content */}
            {report.content && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-2">Report Content</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.content}</p>
              </div>
            )}

            {/* Chart Data Summary */}
            {(hasAttendanceData || hasPerformanceData) && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-3">Data Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  {hasAttendanceData && (
                    <div className="bg-background rounded-lg p-3">
                      <p className="text-sm font-medium text-primary">Attendance Data</p>
                      <p className="text-2xl font-bold">
                        {(chartData.attendanceData as { name: string; attendance: number }[]).length} entries
                      </p>
                    </div>
                  )}
                  {hasPerformanceData && (
                    <div className="bg-background rounded-lg p-3">
                      <p className="text-sm font-medium text-primary">Performance Data</p>
                      <p className="text-2xl font-bold">
                        {(chartData.performanceData as { month: string; score: number }[]).length} months
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Report Details */}
            <div className="text-xs text-muted-foreground border-t pt-4">
              <p>Report ID: {report.id}</p>
              <p>Last Updated: {new Date(report.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => {
            onDownload(report);
            onOpenChange(false);
          }}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}