import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useStudents, StudentRecord, NewStudentRecord } from '@/hooks/useStudents';
import { useImportedStudents, ImportedStudent, NewImportedStudent } from '@/hooks/useImportedStudents';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Plus, Loader2, Download, FileSpreadsheet, AlertCircle, CheckCircle, Columns, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseExcelFile, generateSampleExcel, ParsedExcelResult } from '@/utils/excelParser';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

interface CustomColumn {
  id: string;
  name: string;
}

export default function TeacherStudents() {
  const { user, supabaseUser, departmentId } = useAuth();
  const { students, loading, addStudent, updateStudent, deleteStudent } = useStudents(departmentId);
  const { 
    importedStudents, 
    loading: importedLoading, 
    bulkImportStudents,
    updateImportedStudent,
    deleteImportedStudent 
  } = useImportedStudents(departmentId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('1');
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
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
    year: 1,
    student_id: '',
    custom_fields: {},
    marks: {},
  });
  const { toast } = useToast();

  // Filter students by year
  const getStudentsByYear = (year: number) => {
    return students.filter(s => (s.year || 1) === year);
  };

  const handleAdd = () => {
    if (selectedTab === 'imported') {
      toast({
        title: 'Cannot add to Imported',
        description: 'Use Import Excel to add students to the Imported table.',
        variant: 'destructive',
      });
      return;
    }
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      contact: undefined,
      attendance: 0,
      guardian_name: '',
      guardian_phone: '',
      notes: '',
      year: parseInt(selectedTab),
      student_id: '',
      custom_fields: {},
      marks: {},
    });
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
      year: student.year || 1,
      student_id: student.student_id || '',
      custom_fields: student.custom_fields || {},
      marks: student.marks || {},
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (student: StudentRecord) => {
    if (confirm(`Are you sure you want to delete ${student.name}?`)) {
      await deleteStudent(student.id);
    }
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

    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!supabaseUser || !importState.result?.data.length) return;

    setImportState(prev => ({ ...prev, status: 'importing', progress: 0 }));

    const data = importState.result.data;
    
    // Import to separate imported_students table
    await bulkImportStudents(data as NewImportedStudent[], supabaseUser.id);

    setImportState({ status: 'complete', result: importState.result, progress: 100 });

    setTimeout(() => {
      setIsImportDialogOpen(false);
      setImportState({ status: 'idle', result: null, progress: 0 });
      // Switch to imported tab to show results
      setSelectedTab('imported');
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

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    const newCol: CustomColumn = {
      id: Date.now().toString(),
      name: newColumnName.trim(),
    };
    setCustomColumns(prev => [...prev, newCol]);
    setNewColumnName('');
    toast({
      title: 'Column Added',
      description: `"${newCol.name}" column has been added.`,
    });
  };

  const handleRemoveColumn = (colId: string) => {
    setCustomColumns(prev => prev.filter(c => c.id !== colId));
  };

  const handleUpdateCustomField = async (studentId: string, columnName: string, value: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updatedCustomFields = {
      ...(student.custom_fields || {}),
      [columnName]: value,
    };

    await updateStudent(studentId, { custom_fields: updatedCustomFields });
  };

  const renderStudentTable = (yearStudents: StudentRecord[]) => {
    if (yearStudents.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No students in this year. Add your first student.</p>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Student ID</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Attendance</TableHead>
              {customColumns.map(col => (
                <TableHead key={col.id} className="font-semibold">
                  <div className="flex items-center gap-2">
                    {col.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => handleRemoveColumn(col.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </TableHead>
              ))}
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {yearStudents.map((student) => (
              <TableRow key={student.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{student.student_id || '-'}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email || '-'}</TableCell>
                <TableCell>{student.contact || '-'}</TableCell>
                <TableCell>
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
                </TableCell>
                {customColumns.map(col => (
                  <TableCell key={col.id}>
                    <Input
                      className="h-8 w-24"
                      defaultValue={(student.custom_fields as Record<string, string> | null)?.[col.name] || ''}
                      onBlur={(e) => handleUpdateCustomField(student.id, col.name, e.target.value)}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(student)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const handleDeleteImported = async (student: ImportedStudent) => {
    if (confirm(`Are you sure you want to delete ${student.name} from imported records?`)) {
      await deleteImportedStudent(student.id);
    }
  };

  const renderImportedTable = () => {
    if (importedStudents.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No imported students. Import an Excel file to add data.</p>
          <Button onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Student ID</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Attendance</TableHead>
              <TableHead className="font-semibold">Year</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {importedStudents.map((student) => (
              <TableRow key={student.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{student.student_id || '-'}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email || '-'}</TableCell>
                <TableCell>{student.contact || '-'}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>{student.year ? `${student.year}${student.year === 1 ? 'st' : student.year === 2 ? 'nd' : student.year === 3 ? 'rd' : 'th'} Year` : '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteImported(student)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading || importedLoading) {
    return (
      <DashboardLayout title="Student Management" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Management" subtitle="Manage student records by year">
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
        <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Import Excel
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Columns className="w-4 h-4 mr-2" />
              Add Column
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-background border shadow-lg">
            <div className="space-y-3">
              <Label>Column Name</Label>
              <Input
                placeholder="e.g., Semester Marks"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
              />
              <Button size="sm" onClick={handleAddColumn} disabled={!newColumnName.trim()}>
                Add Column
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Card className="p-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            {YEAR_LABELS.map((label, idx) => (
              <TabsTrigger key={idx + 1} value={String(idx + 1)}>
                {label} ({getStudentsByYear(idx + 1).length})
              </TabsTrigger>
            ))}
            <TabsTrigger value="imported" className="bg-primary/10">
              Imported ({importedStudents.length})
            </TabsTrigger>
          </TabsList>

          {YEAR_LABELS.map((_, idx) => (
            <TabsContent key={idx + 1} value={String(idx + 1)}>
              {renderStudentTable(getStudentsByYear(idx + 1))}
            </TabsContent>
          ))}
          
          <TabsContent value="imported">
            {renderImportedTable()}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student_id">Student ID / Roll No</Label>
                <Input
                  id="student_id"
                  value={formData.student_id || ''}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  placeholder="e.g., STU001"
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Select
                  value={String(formData.year || 1)}
                  onValueChange={(v) => setFormData({ ...formData, year: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {YEAR_LABELS.map((label, idx) => (
                      <SelectItem key={idx + 1} value={String(idx + 1)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                Upload an Excel file (.xlsx, .xls) containing student data. 
                Students will be matched by <strong>Student ID</strong> or <strong>Name</strong> to update existing records.
              </p>
              
              <Alert>
                <RefreshCw className="h-4 w-4" />
                <AlertDescription>
                  If a student with the same ID or name exists, their record will be updated. Otherwise, a new record is created.
                </AlertDescription>
              </Alert>
              
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
                          <span className="font-medium">
                            {student.student_id ? `[${student.student_id}] ` : ''}{student.name}
                          </span>
                          <span className="text-muted-foreground text-xs">Year {student.year || 1}</span>
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
                Students have been added/updated.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
