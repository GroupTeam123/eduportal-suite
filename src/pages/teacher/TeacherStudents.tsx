import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { useStudents, StudentRecord, NewStudentRecord } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TeacherStudents() {
  const { user, supabaseUser, departmentId } = useAuth();
  const { students, loading, addStudent, updateStudent, deleteStudent, importStudents } = useStudents(departmentId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [formData, setFormData] = useState<NewStudentRecord>({
    name: '',
    email: '',
    contact: undefined,
    attendance: 0,
    guardian_name: '',
    guardian_phone: '',
    notes: '',
  });
  const { toast } = useToast();

  const columns = [
    { key: 'name', label: 'Student Name' },
    { key: 'email', label: 'Email' },
    { key: 'contact', label: 'Contact' },
    { 
      key: 'attendance', 
      label: 'Attendance',
      render: (student: StudentRecord) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                (student.attendance || 0) >= 90 ? 'bg-success' :
                (student.attendance || 0) >= 75 ? 'bg-warning' :
                'bg-destructive'
              }`}
              style={{ width: `${student.attendance || 0}%` }}
            />
          </div>
          <span className="text-sm">{student.attendance || 0}%</span>
        </div>
      )
    },
    { key: 'guardian_name', label: 'Guardian' },
  ];

  const handleAdd = () => {
    setEditingStudent(null);
    setFormData({ name: '', email: '', contact: undefined, attendance: 0, guardian_name: '', guardian_phone: '', notes: '' });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (student: StudentRecord) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email || '',
      contact: student.contact || undefined,
      attendance: student.attendance || 0,
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      notes: student.notes || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (student: StudentRecord) => {
    await deleteStudent(student.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUser) return;

    if (editingStudent) {
      await updateStudent(editingStudent.id, formData);
    } else {
      await addStudent(formData, supabaseUser.id);
    }
    setIsAddDialogOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabaseUser) return;

    // For now, simulate import with sample data
    // In production, you'd parse the Excel file using xlsx library
    toast({
      title: 'Processing File',
      description: `Importing data from ${file.name}...`,
    });

    const sampleImportData: NewStudentRecord[] = [
      { name: 'Imported Student 1', email: 'import1@student.edu', attendance: 85 },
      { name: 'Imported Student 2', email: 'import2@student.edu', attendance: 90 },
    ];

    await importStudents(sampleImportData, supabaseUser.id);
    setIsImportDialogOpen(false);
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Management" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Management" subtitle="Add, edit, and manage student records">
      <div className="mb-6 flex items-center gap-3">
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
        <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Import Excel
        </Button>
      </div>

      {students.length === 0 ? (
        <div className="bg-card rounded-xl shadow-card p-12 text-center">
          <p className="text-muted-foreground mb-4">No students added yet. Start by adding your first student.</p>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      ) : (
        <DataTable
          data={students}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Search students..."
          title="Student Records"
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  type="number"
                  value={formData.contact || ''}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label htmlFor="attendance">Attendance (%)</Label>
                <Input
                  id="attendance"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.attendance || 0}
                  onChange={(e) => setFormData({ ...formData, attendance: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guardian_name">Guardian Name</Label>
                <Input
                  id="guardian_name"
                  value={formData.guardian_name || ''}
                  onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="guardian_phone">Guardian Phone</Label>
                <Input
                  id="guardian_phone"
                  value={formData.guardian_phone || ''}
                  onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingStudent ? 'Update' : 'Add'} Student
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Excel File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload an Excel file (.xlsx, .xls) containing student data. The file should have columns for Name, Email, Contact, and Attendance.
            </p>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary hover:underline">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleImport}
              />
              <p className="text-xs text-muted-foreground mt-2">.xlsx, .xls, or .csv files</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
