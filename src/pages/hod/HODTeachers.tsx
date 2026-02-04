import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Loader2, User, Phone, Mail, Briefcase, GraduationCap } from 'lucide-react';
import { useHODData, TeacherWithStudents } from '@/hooks/useHODData';
import { useDocuments, DocumentRecord } from '@/hooks/useDocuments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TeacherProfile {
  full_name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  qualifications: string | null;
  years_of_experience: number | null;
}

export default function HODTeachers() {
  const { departmentId, supabaseUser } = useAuth();
  const { teachers, loading } = useHODData(departmentId);
  const { documents, getDownloadUrl } = useDocuments(supabaseUser?.id || null, departmentId);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithStudents | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [teacherDocs, setTeacherDocs] = useState<DocumentRecord[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const columns = [
    { 
      key: 'full_name', 
      label: 'Teacher Name',
      render: (teacher: TeacherWithStudents) => (
        <button 
          className="text-left font-medium text-primary hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile(teacher);
          }}
        >
          {teacher.full_name}
        </button>
      )
    },
    { key: 'email', label: 'Email' },
    { key: 'student_count', label: 'Students' },
    {
      key: 'actions',
      label: '',
      render: (teacher: TeacherWithStudents) => (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDocs(teacher);
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          View Docs
        </Button>
      )
    }
  ];

  const handleViewProfile = async (teacher: TeacherWithStudents) => {
    setSelectedTeacher(teacher);
    setLoadingProfile(true);
    setShowProfile(true);
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', teacher.user_id)
        .maybeSingle();
      
      if (data) {
        const profileData = data as unknown as Record<string, unknown>;
        setTeacherProfile({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          qualifications: profileData?.qualifications as string || null,
          years_of_experience: profileData?.years_of_experience as number || null,
        });
      }
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleViewDocs = async (teacher: TeacherWithStudents) => {
    setSelectedTeacher(teacher);
    // Filter documents by teacher
    const docs = documents.filter(d => d.uploader_user_id === teacher.user_id);
    setTeacherDocs(docs);
    setShowDocuments(true);
  };

  const handleDownload = async (doc: DocumentRecord) => {
    const url = await getDownloadUrl(doc.storage_path);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Department Teachers" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Department Teachers" subtitle="View and manage teachers in your department">
      {teachers.length > 0 ? (
        <DataTable
          data={teachers}
          columns={columns}
          searchPlaceholder="Search teachers..."
          title="Teachers List"
        />
      ) : (
        <div className="bg-card rounded-xl shadow-card p-12 text-center">
          <p className="text-muted-foreground">No teachers assigned to your department yet.</p>
        </div>
      )}

      {/* Teacher Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Teacher Profile - {selectedTeacher?.full_name}</DialogTitle>
          </DialogHeader>
          {loadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : teacherProfile ? (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {teacherProfile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{teacherProfile.full_name}</h3>
                  <p className="text-muted-foreground">Teacher</p>
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
                      <p className="font-medium">{teacherProfile.email || 'Not provided'}</p>
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
                      <p className="font-medium">{teacherProfile.phone || 'Not provided'}</p>
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
                      <p className="font-medium">{teacherProfile.qualifications || 'Not provided'}</p>
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
                        {teacherProfile.years_of_experience 
                          ? `${teacherProfile.years_of_experience} years` 
                          : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {teacherProfile.bio && (
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Bio</p>
                      <p className="text-sm">{teacherProfile.bio}</p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="text-sm text-muted-foreground">
                <p>Total Students: <span className="font-medium text-foreground">{selectedTeacher?.student_count || 0}</span></p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Profile not found.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents - {selectedTeacher?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {teacherDocs.length > 0 ? (
              teacherDocs.map((doc) => (
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
              <p className="text-center text-muted-foreground py-8">No documents uploaded by this teacher.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
