import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePrincipalData, HODInfo } from '@/hooks/usePrincipalData';
import { useDocuments, DocumentRecord } from '@/hooks/useDocuments';
import { FileText, Download, Eye, Mail, Building2, Loader2 } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

export default function PrincipalHODs() {
  const { supabaseUser } = useAuth();
  const { hods, loading } = usePrincipalData();
  const { documents, getDownloadUrl } = useDocuments(supabaseUser?.id || null, null);
  const [selectedHOD, setSelectedHOD] = useState<HODInfo | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [hodDocs, setHodDocs] = useState<DocumentRecord[]>([]);

  const handleViewDocs = (hod: HODInfo) => {
    setSelectedHOD(hod);
    const docs = documents.filter(d => d.uploader_user_id === hod.user_id);
    setHodDocs(docs);
    setShowDocuments(true);
  };

  const handleDownload = async (doc: DocumentRecord) => {
    const url = await getDownloadUrl(doc.storage_path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="HOD Information" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="HOD Information" subtitle="View all HODs and their documents">
      {hods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hods.map((hod) => (
            <Card key={hod.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-foreground">
                    {hod.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold truncate">{hod.full_name}</h3>
                  <p className="text-sm text-primary font-medium">{hod.department_name}</p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{hod.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{hod.teacher_count} Faculty Members</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{hod.document_count} documents</span>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => handleViewDocs(hod)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Documents
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No HODs assigned yet.</p>
        </div>
      )}

      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents - {selectedHOD?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {hodDocs.length > 0 ? (
              hodDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''} • 
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No documents uploaded by this HOD.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
