import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { mockTeachers, mockDocuments } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  subjects: string[];
  students: number;
}

export default function HODTeachers() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);

  const columns = [
    { key: 'name', label: 'Teacher Name' },
    { key: 'email', label: 'Email' },
    { 
      key: 'subjects', 
      label: 'Subjects',
      render: (teacher: Teacher) => teacher.subjects.join(', ')
    },
    { key: 'students', label: 'Students' },
    {
      key: 'actions',
      label: '',
      render: (teacher: Teacher) => (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTeacher(teacher);
            setShowDocuments(true);
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          View Docs
        </Button>
      )
    }
  ];

  return (
    <DashboardLayout title="Department Teachers" subtitle="View and manage teachers in your department">
      <DataTable
        data={mockTeachers}
        columns={columns}
        searchPlaceholder="Search teachers..."
        title="Teachers List"
      />

      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents - {selectedTeacher?.name}</DialogTitle>
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
