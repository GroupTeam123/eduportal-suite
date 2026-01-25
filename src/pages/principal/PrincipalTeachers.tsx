import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, Download, Eye, Mail, Building2, Loader2, Phone, 
  Briefcase, GraduationCap, User, Search, Users 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DocumentRecord } from '@/hooks/useDocuments';

interface TeacherInfo {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  qualifications: string | null;
  years_of_experience: number | null;
  department_name: string;
  department_id: string;
  student_count: number;
  document_count: number;
}

export default function PrincipalTeachers() {
  const { supabaseUser } = useAuth();
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherInfo | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [teacherDocs, setTeacherDocs] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        // Get all teacher assignments with department info
        const { data: assignments, error: assignError } = await supabase
          .from('teacher_assignments')
          .select('teacher_user_id, department_id');

        if (assignError) throw assignError;

        // Get all departments
        const { data: departments, error: deptError } = await supabase
          .from('departments')
          .select('id, name');

        if (deptError) throw deptError;

        const deptMap = new Map(departments?.map(d => [d.id, d.name]) || []);

        // Get all teacher profiles
        const teacherList: TeacherInfo[] = [];
        
        for (const assignment of assignments || []) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', assignment.teacher_user_id)
            .maybeSingle();

          if (profile) {
            const profileData = profile as unknown as Record<string, unknown>;
            
            // Get student count
            const { count: studentCount } = await supabase
              .from('student_records')
              .select('*', { count: 'exact', head: true })
              .eq('teacher_user_id', assignment.teacher_user_id);

            // Get document count
            const { count: docCount } = await supabase
              .from('documents')
              .select('*', { count: 'exact', head: true })
              .eq('uploader_user_id', assignment.teacher_user_id);

            teacherList.push({
              id: profile.id,
              user_id: profile.user_id,
              full_name: profile.full_name,
              email: profile.email,
              phone: profile.phone,
              bio: profile.bio,
              qualifications: profileData?.qualifications as string || null,
              years_of_experience: profileData?.years_of_experience as number || null,
              department_name: deptMap.get(assignment.department_id) || 'Unknown',
              department_id: assignment.department_id,
              student_count: studentCount || 0,
              document_count: docCount || 0,
            });
          }
        }

        setTeachers(teacherList);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const handleViewProfile = (teacher: TeacherInfo) => {
    setSelectedTeacher(teacher);
    setShowProfile(true);
  };

  const handleViewDocs = async (teacher: TeacherInfo) => {
    setSelectedTeacher(teacher);
    setLoadingDocs(true);
    setShowDocuments(true);

    try {
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('uploader_user_id', teacher.user_id)
        .order('created_at', { ascending: false });

      setTeacherDocs(docs || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleDownloadAll = async (teacher: TeacherInfo) => {
    setSelectedTeacher(teacher);
    setLoadingDocs(true);

    try {
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('uploader_user_id', teacher.user_id);

      for (const doc of docs || []) {
        const { data } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.storage_path, 3600);

        if (data?.signedUrl) {
          const link = document.createElement('a');
          link.href = data.signedUrl;
          link.download = doc.file_name;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error downloading documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const filteredTeachers = searchQuery.trim()
    ? teachers.filter(t => 
        t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.department_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : teachers;

  if (loading) {
    return (
      <DashboardLayout title="Teacher Data" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teacher Data" subtitle="View all teachers across departments">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">All Teachers</h2>
              <p className="text-sm text-muted-foreground">Total: {teachers.length} teachers</p>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filteredTeachers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Students</TableHead>
                  <TableHead className="font-semibold">Documents</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id} className="hover:bg-muted/30">
                    <TableCell>
                      <button
                        className="text-left font-medium text-primary hover:underline cursor-pointer"
                        onClick={() => handleViewProfile(teacher)}
                      >
                        {teacher.full_name}
                      </button>
                    </TableCell>
                    <TableCell>{teacher.email || '-'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        {teacher.department_name}
                      </span>
                    </TableCell>
                    <TableCell>{teacher.student_count}</TableCell>
                    <TableCell>{teacher.document_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocs(teacher)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Docs
                        </Button>
                        {teacher.document_count > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadAll(teacher)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download All
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No teachers found.</p>
          </div>
        )}
      </Card>

      {/* Teacher Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Teacher Profile - {selectedTeacher?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {selectedTeacher.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedTeacher.full_name}</h3>
                  <p className="text-muted-foreground">Teacher</p>
                  <p className="text-sm text-primary font-medium">{selectedTeacher.department_name}</p>
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
                      <p className="font-medium">{selectedTeacher.email || 'Not provided'}</p>
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
                      <p className="font-medium">{selectedTeacher.phone || 'Not provided'}</p>
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
                      <p className="font-medium">{selectedTeacher.qualifications || 'Not provided'}</p>
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
                        {selectedTeacher.years_of_experience 
                          ? `${selectedTeacher.years_of_experience} years` 
                          : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {selectedTeacher.bio && (
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Bio</p>
                      <p className="text-sm">{selectedTeacher.bio}</p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>Total Students: <span className="font-medium text-foreground">{selectedTeacher.student_count}</span></p>
                <p>Documents: <span className="font-medium text-foreground">{selectedTeacher.document_count}</span></p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents - {selectedTeacher?.full_name}</DialogTitle>
          </DialogHeader>
          {loadingDocs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
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
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
