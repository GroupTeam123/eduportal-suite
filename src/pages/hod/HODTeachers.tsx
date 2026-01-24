import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import { useHODData, TeacherWithStudents } from '@/hooks/useHODData';
import { useDocuments, DocumentRecord } from '@/hooks/useDocuments';
import { useAuth } from '@/contexts/AuthContext';

export default function HODTeachers() {
  const { departmentId, supabaseUser } = useAuth();
  const { teachers, loading } = useHODData(departmentId);
  const { documents, getDownloadUrl } = useDocuments(supabaseUser?.id || null, departmentId);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithStudents | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [teacherDocs, setTeacherDocs] = useState<DocumentRecord[]>([]);

  const columns = [
    { key: 'full_name', label: 'Teacher Name' },
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
      window.open(url, '_blank');
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
