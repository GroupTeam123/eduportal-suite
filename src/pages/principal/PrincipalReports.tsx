import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockReports, mockDepartments } from '@/data/mockData';
import { FileText, Download, Eye, CheckCircle, Building2 } from 'lucide-react';

export default function PrincipalReports() {
  // Create expanded reports with department info
  const expandedReports = mockDepartments.flatMap(dept => 
    mockReports.map((report, idx) => ({
      ...report,
      id: `${dept.id}-${report.id}`,
      department: dept.name,
      submittedBy: dept.hodName,
    }))
  ).slice(0, 12);

  return (
    <DashboardLayout title="Submitted Reports" subtitle="View all reports submitted by HODs">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expandedReports.map((report) => (
          <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">Submitted</span>
              </div>
            </div>
            
            <h3 className="font-display font-semibold mb-2 line-clamp-2">{report.title}</h3>
            
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{report.department}</span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-1">Submitted by {report.submittedBy}</p>
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
