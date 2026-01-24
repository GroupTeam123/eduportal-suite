import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePrincipalData } from '@/hooks/usePrincipalData';

interface DocumentWithHOD {
  id: string;
  uploader_user_id: string;
  department_id: string | null;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  description: string | null;
  created_at: string;
  hod_name?: string;
  department_name?: string;
}

export default function PrincipalDocuments() {
  const { supabaseUser } = useAuth();
  const { departments } = usePrincipalData();
  const [documents, setDocuments] = useState<DocumentWithHOD[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHODDocuments = async () => {
      if (!supabaseUser?.id) return;

      try {
        setLoading(true);
        
        // Fetch documents - RLS will filter to HOD documents for principal
        const { data: docs, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrich with HOD and department info
        const enrichedDocs: DocumentWithHOD[] = await Promise.all(
          (docs || []).map(async (doc) => {
            // Get HOD profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', doc.uploader_user_id)
              .single();

            // Find department name
            const dept = departments.find(d => d.id === doc.department_id);

            return {
              ...doc,
              hod_name: profile?.full_name || 'Unknown HOD',
              department_name: dept?.name || 'Unknown Department',
            };
          })
        );

        setDocuments(enrichedDocs);
      } catch (err) {
        console.error('Error fetching HOD documents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHODDocuments();
  }, [supabaseUser?.id, departments]);

  const handleDownload = async (doc: DocumentWithHOD) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600);

      if (error) throw error;

      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = doc.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Download Started',
          description: `Downloading ${doc.file_name}`,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group documents by HOD
  const documentsByHOD = documents.reduce((acc, doc) => {
    const key = doc.uploader_user_id;
    if (!acc[key]) {
      acc[key] = {
        hod_name: doc.hod_name || 'Unknown HOD',
        department_name: doc.department_name || 'Unknown Department',
        documents: [],
      };
    }
    acc[key].documents.push(doc);
    return acc;
  }, {} as Record<string, { hod_name: string; department_name: string; documents: DocumentWithHOD[] }>);

  if (loading) {
    return (
      <DashboardLayout title="HOD Documents" subtitle="View documents uploaded by Heads of Department">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="HOD Documents" subtitle="View documents uploaded by Heads of Department">
      {documents.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(documentsByHOD).map(([hodId, { hod_name, department_name, documents: hodDocs }]) => (
            <Card key={hodId} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">{hod_name}</h3>
                  <p className="text-sm text-muted-foreground">{department_name}</p>
                </div>
              </div>

              <div className="space-y-3">
                {hodDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documents uploaded by HODs yet.</p>
        </Card>
      )}
    </DashboardLayout>
  );
}