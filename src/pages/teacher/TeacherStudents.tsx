import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { mockStudents } from '@/data/mockData';
import { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TeacherStudents() {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    semester: 1,
    attendance: 0,
  });
  const { toast } = useToast();

  const columns = [
    { key: 'rollNumber', label: 'Roll No.' },
    { key: 'name', label: 'Student Name' },
    { key: 'email', label: 'Email' },
    { key: 'semester', label: 'Semester' },
    { 
      key: 'attendance', 
      label: 'Attendance',
      render: (student: Student) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                student.attendance >= 90 ? 'bg-success' :
                student.attendance >= 75 ? 'bg-warning' :
                'bg-destructive'
              }`}
              style={{ width: `${student.attendance}%` }}
            />
          </div>
          <span className="text-sm">{student.attendance}%</span>
        </div>
      )
    },
  ];

  const handleAdd = () => {
    setEditingStudent(null);
    setFormData({ name: '', rollNumber: '', email: '', semester: 1, attendance: 0 });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      semester: student.semester,
      attendance: student.attendance,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (student: Student) => {
    setStudents(students.filter(s => s.id !== student.id));
    toast({
      title: 'Student Removed',
      description: `${student.name} has been removed from the list.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      setStudents(students.map(s => 
        s.id === editingStudent.id 
          ? { ...s, ...formData }
          : s
      ));
      toast({
        title: 'Student Updated',
        description: `${formData.name}'s record has been updated.`,
      });
    } else {
      const newStudent: Student = {
        id: String(Date.now()),
        ...formData,
        department: 'Computer Science',
        grades: {},
      };
      setStudents([...students, newStudent]);
      toast({
        title: 'Student Added',
        description: `${formData.name} has been added to the list.`,
      });
    }
    setIsAddDialogOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate Excel import
      toast({
        title: 'File Imported',
        description: `${file.name} has been imported successfully. Processing data...`,
      });
      setIsImportDialogOpen(false);
      
      // Add mock imported students
      const importedStudents: Student[] = [
        { id: String(Date.now()), name: 'Imported Student 1', rollNumber: 'CS2024009', email: 'import1@student.edu', department: 'Computer Science', semester: 4, attendance: 85, grades: {} },
        { id: String(Date.now() + 1), name: 'Imported Student 2', rollNumber: 'CS2024010', email: 'import2@student.edu', department: 'Computer Science', semester: 4, attendance: 90, grades: {} },
      ];
      setStudents([...students, ...importedStudents]);
    }
  };

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

      <DataTable
        data={students}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search students..."
        title="Student Records"
      />

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
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  type="number"
                  min={1}
                  max={8}
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="attendance">Attendance (%)</Label>
                <Input
                  id="attendance"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.attendance}
                  onChange={(e) => setFormData({ ...formData, attendance: parseInt(e.target.value) })}
                  required
                />
              </div>
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
              Upload an Excel file (.xlsx, .xls) containing student data. The file should have columns for Name, Roll Number, Email, Semester, and Attendance.
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
