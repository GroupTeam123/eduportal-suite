import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockHODs, mockDocuments } from '@/data/mockData';
import { FileText, Download, Eye, Mail, Building2 } from 'lucide-react';

export default function PrincipalHODs() {
  const [selectedHOD, setSelectedHOD] = useState<typeof mockHODs[0] | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);

  return (
    <DashboardLayout title="HOD Information" subtitle="View all HODs and their documents">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockHODs.map((hod) => (
          <Card key={hod.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary-foreground">
                  {hod.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold truncate">{hod.name}</h3>
                <p className="text-sm text-primary font-medium">{hod.department}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{hod.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{hod.teacherCount} Faculty Members</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{hod.yearsOfService} years of service</span>
              <span className="text-muted-foreground">{hod.documents} docs</span>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => {
                setSelectedHOD(hod);
                setShowDocuments(true);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Documents
            </Button>
          </Card>
        ))}
      </div>

      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents - {selectedHOD?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mockDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">{doc.size} • {doc.uploadedAt}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
