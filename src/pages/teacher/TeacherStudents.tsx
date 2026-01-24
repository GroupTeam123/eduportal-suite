import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { useStudents, StudentRecord, NewStudentRecord } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Plus, Loader2, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseExcelFile, generateSampleExcel, ParsedExcelResult } from '@/utils/excelParser';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function TeacherStudents() {
  const { user, supabaseUser, departmentId } = useAuth();
  const { students, loading, addStudent, updateStudent, deleteStudent, importStudents } = useStudents(departmentId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [importState, setImportState] = useState<{
    status: 'idle' | 'parsing' | 'preview' | 'importing' | 'complete';
    result: ParsedExcelResult | null;
    progress: number;
  }>({ status: 'idle', result: null, progress: 0 });
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportState({ status: 'parsing', result: null, progress: 0 });

    try {
      const result = await parseExcelFile(file);
      setImportState({ status: 'preview', result, progress: 0 });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse Excel file.',
        variant: 'destructive',
      });
      setImportState({ status: 'idle', result: null, progress: 0 });
    }

    // Reset file input
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!supabaseUser || !importState.result?.data.length) return;

    setImportState(prev => ({ ...prev, status: 'importing', progress: 0 }));

    const batchSize = 10;
    const data = importState.result.data;
    let imported = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await importStudents(batch, supabaseUser.id);
      imported += batch.length;
      setImportState(prev => ({ 
        ...prev, 
        progress: Math.round((imported / data.length) * 100) 
      }));
    }

    setImportState({ status: 'complete', result: importState.result, progress: 100 });
    
    toast({
      title: 'Import Complete',
      description: `Successfully imported ${data.length} students.`,
    });

    // Reset after a short delay
    setTimeout(() => {
      setIsImportDialogOpen(false);
      setImportState({ status: 'idle', result: null, progress: 0 });
    }, 2000);
  };

  const handleDownloadTemplate = () => {
    generateSampleExcel();
    toast({
      title: 'Template Downloaded',
      description: 'Use this template to format your student data.',
    });
  };

  const resetImportDialog = () => {
    setImportState({ status: 'idle', result: null, progress: 0 });
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
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        setIsImportDialogOpen(open);
        if (!open) resetImportDialog();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Import Students from Excel
            </DialogTitle>
          </DialogHeader>
          
          {importState.status === 'idle' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload an Excel file (.xlsx, .xls) or CSV file containing student data. 
                The file should have columns for Name, Email, Contact, Attendance, etc.
              </p>
              
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary hover:underline font-medium">Click to upload</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <p className="text-xs text-muted-foreground mt-2">.xlsx, .xls, or .csv files</p>
              </div>
            </div>
          )}

          {importState.status === 'parsing' && (
            <div className="py-8 text-center">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Parsing Excel file...</p>
            </div>
          )}

          {importState.status === 'preview' && importState.result && (
            <div className="space-y-4">
              {importState.result.success ? (
                <>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Found <strong>{importState.result.validRows}</strong> valid student records 
                      out of {importState.result.totalRows} rows.
                    </AlertDescription>
                  </Alert>

                  {importState.result.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-1">Warnings:</div>
                        <ul className="list-disc list-inside text-xs max-h-24 overflow-y-auto">
                          {importState.result.errors.slice(0, 5).map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                          {importState.result.errors.length > 5 && (
                            <li>...and {importState.result.errors.length - 5} more</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-muted rounded-lg p-3 max-h-48 overflow-y-auto">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Preview (first 5 records):</p>
                    <div className="space-y-1">
                      {importState.result.data.slice(0, 5).map((student, i) => (
                        <div key={i} className="text-sm bg-background rounded px-2 py-1 flex justify-between">
                          <span className="font-medium">{student.name}</span>
                          <span className="text-muted-foreground text-xs">{student.email || 'No email'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={resetImportDialog}>
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmImport}>
                      Import {importState.result.validRows} Students
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">Import Failed</div>
                      <ul className="list-disc list-inside text-xs">
                        {importState.result.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={resetImportDialog}>
                      Try Again
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {importState.status === 'importing' && (
            <div className="py-6 space-y-4">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-3" />
                <p className="text-sm font-medium">Importing students...</p>
              </div>
              <Progress value={importState.progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">{importState.progress}% complete</p>
            </div>
          )}

          {importState.status === 'complete' && (
            <div className="py-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-success mb-4" />
              <p className="font-medium">Import Complete!</p>
              <p className="text-sm text-muted-foreground">
                {importState.result?.validRows} students have been added.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
