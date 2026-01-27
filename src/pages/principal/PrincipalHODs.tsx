import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePrincipalData, HODInfo } from '@/hooks/usePrincipalData';
import { DocumentRecord } from '@/hooks/useDocuments';
import { FileText, Download, Eye, Mail, Building2, Loader2, Phone, Briefcase, GraduationCap, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HODProfile {
  full_name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  qualifications: string | null;
  years_of_experience: number | null;
}

export default function PrincipalHODs() {
  const { hods, loading } = usePrincipalData();
  const [selectedHOD, setSelectedHOD] = useState<HODInfo | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [hodDocs, setHodDocs] = useState<DocumentRecord[]>([]);
  const [hodProfile, setHodProfile] = useState<HODProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const handleViewProfile = async (hod: HODInfo) => {
    setSelectedHOD(hod);
    setLoadingProfile(true);
    setShowProfile(true);
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', hod.user_id)
        .maybeSingle();
      
      if (data) {
        const profileData = data as unknown as Record<string, unknown>;
        setHodProfile({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          qualifications: profileData?.qualifications as string || null,
          years_of_experience: profileData?.years_of_experience as number || null,
        });
      }
    } catch (error) {
      console.error('Error fetching HOD profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleViewDocs = async (hod: HODInfo) => {
    setSelectedHOD(hod);
    setShowDocuments(true);
    setLoadingDocs(true);
    
    try {
      // Fetch documents uploaded by this specific HOD
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('uploader_user_id', hod.user_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHodDocs(data || []);
    } catch (error) {
      console.error('Error fetching HOD documents:', error);
      setHodDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600);
      
      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating download URL:', error);
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
            <Card 
              key={hod.id} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewProfile(hod)}
            >
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDocs(hod);
                }}
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

      {/* HOD Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>HOD Profile - {selectedHOD?.full_name}</DialogTitle>
          </DialogHeader>
          {loadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : hodProfile ? (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {hodProfile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{hodProfile.full_name}</h3>
                  <p className="text-primary font-medium">Head of Department</p>
                  <p className="text-muted-foreground">{selectedHOD?.department_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{hodProfile.email || 'Not provided'}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{hodProfile.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Qualifications</p>
                      <p className="font-medium">{hodProfile.qualifications || 'Not provided'}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-medium">
                        {hodProfile.years_of_experience 
                          ? `${hodProfile.years_of_experience} years` 
                          : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {hodProfile.bio && (
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Bio</p>
                      <p className="text-sm">{hodProfile.bio}</p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="text-sm text-muted-foreground">
                <p>Faculty Members: <span className="font-medium text-foreground">{selectedHOD?.teacher_count || 0}</span></p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Profile not found.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Documents - {selectedHOD?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : hodDocs.length > 0 ? (
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
