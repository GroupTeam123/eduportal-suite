import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockReports } from '@/data/mockData';
import { FileText, Download, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function HODReports() {
  const statusIcons = {
    approved: <CheckCircle className="w-4 h-4 text-success" />,
    submitted: <Clock className="w-4 h-4 text-accent" />,
    draft: <AlertCircle className="w-4 h-4 text-warning" />,
  };

  return (
    <DashboardLayout title="Teacher Reports" subtitle="View and manage reports submitted by teachers">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockReports.map((report) => (
          <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                {statusIcons[report.status]}
                <span className={`text-sm font-medium ${
                  report.status === 'approved' ? 'text-success' :
                  report.status === 'submitted' ? 'text-accent' :
                  'text-warning'
                }`}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              </div>
            </div>
            
            <h3 className="font-display font-semibold mb-2 line-clamp-2">{report.title}</h3>
            <p className="text-sm text-muted-foreground mb-1">By {report.createdBy}</p>
            <p className="text-sm text-muted-foreground mb-4">{report.createdAt}</p>
            
            <div className="flex items-center gap-2 mb-4">
              {report.charts.map((chart) => (
                <span key={chart} className="px-2 py-1 bg-muted rounded text-xs">
                  {chart}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
