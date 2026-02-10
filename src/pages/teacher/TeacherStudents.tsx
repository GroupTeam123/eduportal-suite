import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useStudents, StudentRecord, NewStudentRecord } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Plus, Loader2, Download, FileSpreadsheet, AlertCircle, CheckCircle, Columns, X, RefreshCw, Check, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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

const getGlobalSemester = (year: number, sem: number) => (year - 1) * 2 + sem;
const getSemesterKey = (year: number, sem: number) => `${year}-${sem}`;

interface CustomColumn {
  id: string;
  name: string;
  isSaved: boolean;
}

// Semester-specific custom columns keyed by "year-sem" e.g. "1-1", "1-2"
type SemesterCustomColumns = Record<string, CustomColumn[]>;

const initSemesterRecord = <T,>(defaultValue: () => T): Record<string, T> => {
  const record: Record<string, T> = {};
  for (let year = 1; year <= 4; year++) {
    for (let sem = 1; sem <= 2; sem++) {
      record[getSemesterKey(year, sem)] = defaultValue();
    }
  }
  return record;
};

export default function TeacherStudents() {
  const { user, supabaseUser, departmentId } = useAuth();
  const { students, loading, addStudent, updateStudent, deleteStudent, importStudents } = useStudents(departmentId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('1');
  const [selectedSemester, setSelectedSemester] = useState<string>('1');
  const [customColumnsBySemester, setCustomColumnsBySemester] = useState<SemesterCustomColumns>(initSemesterRecord(() => []));
  const [newColumnName, setNewColumnName] = useState('');
  const [deleteColumnMode, setDeleteColumnMode] = useState<Record<string, boolean>>(initSemesterRecord(() => false));
  const [selectedColumnsToDelete, setSelectedColumnsToDelete] = useState<Record<string, Set<string>>>(initSemesterRecord(() => new Set()));
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
    semester: 1,
    student_id: '',
    custom_fields: {},
    marks: {},
  });
  const [monthlyAttendance, setMonthlyAttendance] = useState<Record<string, string>>({});

  const MONTH_LABELS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get all monthly attendance columns that have data in any student
  const getMonthlyColumnsWithData = (semStudents: StudentRecord[]) => {
    const monthsWithData = new Set<string>();
    semStudents.forEach(student => {
      const customFields = student.custom_fields as Record<string, unknown> | null;
      if (customFields) {
        MONTH_LABELS.forEach(month => {
          const key = month.toLowerCase() + '_attendance';
          if (customFields[key] !== undefined && customFields[key] !== null && customFields[key] !== '') {
            monthsWithData.add(month);
          }
        });
      }
    });
    return MONTH_LABELS.filter(month => monthsWithData.has(month));
  };
  const { toast } = useToast();

  // Filter students by year and semester
  const getStudentsBySemester = (year: number, semester: number) => {
    return students.filter(s => (s.year || 1) === year && (s.semester || 1) === semester);
  };

  const handleAdd = () => {
    setEditingStudent(null);
    const currentYear = parseInt(selectedTab);
    const currentSem = parseInt(selectedSemester);
    setFormData({
      name: '',
      email: '',
      contact: undefined,
      attendance: 0,
      guardian_name: '',
      guardian_phone: '',
      notes: '',
      year: currentYear,
      semester: currentSem,
      student_id: '',
      custom_fields: {},
      marks: {},
    });
    setMonthlyAttendance({});
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
      semester: student.semester || 1,
      student_id: student.student_id || '',
      custom_fields: student.custom_fields || {},
      marks: student.marks || {},
    });
    // Extract monthly attendance from custom_fields
    const existingMonthly: Record<string, string> = {};
    const customFields = student.custom_fields as Record<string, unknown> | null;
    if (customFields) {
      MONTH_LABELS.forEach(month => {
        const key = month.toLowerCase() + '_attendance';
        if (customFields[key] !== undefined && customFields[key] !== null) {
          existingMonthly[key] = String(customFields[key]);
        }
      });
    }
    setMonthlyAttendance(existingMonthly);
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

    // Merge monthly attendance into custom_fields
    const updatedCustomFields = { ...(formData.custom_fields || {}) };
    Object.entries(monthlyAttendance).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        updatedCustomFields[key] = parseFloat(value) || 0;
      }
    });

    const dataToSave = {
      ...formData,
      custom_fields: updatedCustomFields,
    };

    if (editingStudent) {
      await updateStudent(editingStudent.id, dataToSave);
    } else {
      await addStudent(dataToSave, supabaseUser.id);
    }
    setIsAddDialogOpen(false);
    setMonthlyAttendance({});
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
    const currentYear = parseInt(selectedTab);
    const currentSemester = parseInt(selectedSemester);
    
    // Import directly to student_records with the current year and semester
    const studentsWithYearSem = data.map(s => ({
      ...s,
      year: currentYear,
      semester: currentSemester,
    }));
    
    await importStudents(studentsWithYearSem as NewStudentRecord[], supabaseUser.id);

    setImportState({ status: 'complete', result: importState.result, progress: 100 });

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

  // Get custom columns for current semester slot
  const getCustomColumnsForSlot = (year: number, semester: number): CustomColumn[] => {
    return customColumnsBySemester[getSemesterKey(year, semester)] || [];
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    const currentYear = parseInt(selectedTab);
    const currentSem = parseInt(selectedSemester);
    const key = getSemesterKey(currentYear, currentSem);
    const currentCols = getCustomColumnsForSlot(currentYear, currentSem);
    
    // Check if column already exists (prevent duplicates)
    const columnExists = currentCols.some(c => c.name.toLowerCase() === newColumnName.trim().toLowerCase());
    if (columnExists) {
      toast({
        title: 'Column Already Exists',
        description: `A column with name "${newColumnName.trim()}" already exists in this table.`,
        variant: 'destructive',
      });
      return;
    }
    
    const newCol: CustomColumn = {
      id: Date.now().toString(),
      name: newColumnName.trim(),
      isSaved: false,
    };
    setCustomColumnsBySemester(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), newCol],
    }));
    setNewColumnName('');
    toast({
      title: 'Column Added',
      description: `"${newCol.name}" column has been added. Click the checkmark to save it permanently.`,
    });
  };

  const handleRemoveColumn = (colId: string, year: number, semester: number) => {
    const key = getSemesterKey(year, semester);
    setCustomColumnsBySemester(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(c => c.id !== colId),
    }));
  };

  const handleSaveColumn = (colId: string, year: number, semester: number) => {
    const key = getSemesterKey(year, semester);
    setCustomColumnsBySemester(prev => ({
      ...prev,
      [key]: (prev[key] || []).map(c => 
        c.id === colId ? { ...c, isSaved: true } : c
      ),
    }));
    toast({
      title: 'Column Saved',
      description: 'Column has been saved permanently.',
    });
  };

  const toggleDeleteColumnMode = (year: number, semester: number) => {
    const key = getSemesterKey(year, semester);
    setDeleteColumnMode(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    // Clear selections when exiting delete mode
    if (deleteColumnMode[key]) {
      setSelectedColumnsToDelete(prev => ({
        ...prev,
        [key]: new Set()
      }));
    }
  };

  const toggleColumnSelection = (year: number, semester: number, columnName: string) => {
    const key = getSemesterKey(year, semester);
    setSelectedColumnsToDelete(prev => {
      const currentSet = new Set(prev[key]);
      if (currentSet.has(columnName)) {
        currentSet.delete(columnName);
      } else {
        currentSet.add(columnName);
      }
      return { ...prev, [key]: currentSet };
    });
  };

  const handleDeleteSelectedColumns = async (year: number, semester: number, semStudents: StudentRecord[]) => {
    const key = getSemesterKey(year, semester);
    const columnsToDelete = selectedColumnsToDelete[key];
    if (!columnsToDelete || columnsToDelete.size === 0) {
      toast({
        title: 'No columns selected',
        description: 'Please select at least one column to delete.',
        variant: 'destructive',
      });
      return;
    }

    // Remove from custom columns state (temporary columns)
    setCustomColumnsBySemester(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(c => !columnsToDelete.has(c.name))
    }));

    // Remove from student records (saved columns in database)
    for (const student of semStudents) {
      const customFields = student.custom_fields as Record<string, unknown> | null;
      if (customFields) {
        const updatedCustomFields = { ...customFields };
        let hasChanges = false;
        columnsToDelete.forEach(colName => {
          if (colName in updatedCustomFields) {
            delete updatedCustomFields[colName];
            hasChanges = true;
          }
        });
        if (hasChanges) {
          await updateStudent(student.id, { custom_fields: updatedCustomFields });
        }
      }
    }

    toast({
      title: 'Columns Deleted',
      description: `${columnsToDelete.size} column(s) have been deleted.`,
    });

    // Reset delete mode and selections
    setDeleteColumnMode(prev => ({ ...prev, [key]: false }));
    setSelectedColumnsToDelete(prev => ({ ...prev, [key]: new Set() }));
  };

  // Get saved columns from existing student custom_fields (columns that have data)
  const getSavedColumnsFromData = (semStudents: StudentRecord[]) => {
    const savedCols = new Set<string>();
    const monthKeys = MONTH_LABELS.map(m => m.toLowerCase() + '_attendance');
    
    semStudents.forEach(student => {
      const customFields = student.custom_fields as Record<string, unknown> | null;
      if (customFields) {
        Object.keys(customFields).forEach(key => {
          // Exclude monthly attendance keys
          if (!monthKeys.includes(key)) {
            savedCols.add(key);
          }
        });
      }
    });
    return Array.from(savedCols);
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

  // Calculate average attendance from monthly data
  const calculateAvgAttendance = (customFields: Record<string, unknown> | null): number => {
    if (!customFields) return 0;
    const monthKeys = MONTH_LABELS.map(month => month.toLowerCase() + '_attendance');
    let total = 0;
    let count = 0;
    monthKeys.forEach(key => {
      const value = customFields[key];
      if (value !== undefined && value !== null && value !== '') {
        const numValue = typeof value === 'number' ? value : parseFloat(String(value));
        if (!isNaN(numValue)) {
          total += numValue;
          count++;
        }
      }
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  const renderStudentTable = (semStudents: StudentRecord[], year: number, semester: number) => {
    const monthlyColumnsWithData = getMonthlyColumnsWithData(semStudents);
    const key = getSemesterKey(year, semester);
    const isInDeleteMode = deleteColumnMode[key];
    const selectedCols = selectedColumnsToDelete[key] || new Set();
    
    // Get all deletable columns (custom columns - not base form fields)
    const getDeletableColumns = () => {
      const sessionColNames = getCustomColumnsForSlot(year, semester).map(c => c.name);
      const savedCols = getSavedColumnsFromData(semStudents).filter(
        colName => !sessionColNames.map(s => s.toLowerCase()).includes(colName.toLowerCase())
      );
      const allDeletable = [...savedCols, ...sessionColNames];
      return allDeletable;
    };
    
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          {isInDeleteMode ? (
            <>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteSelectedColumns(year, semester, semStudents)}
                disabled={selectedCols.size === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedCols.size})
              </Button>
              <Button variant="outline" onClick={() => toggleDeleteColumnMode(year, semester)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              {getDeletableColumns().length > 0 && (
                <Button variant="outline" onClick={() => toggleDeleteColumnMode(year, semester)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Column
                </Button>
              )}
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
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
            </>
          )}
        </div>
        {semStudents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">No students in Sem {getGlobalSemester(year, semester)}. Add your first student.</p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student ID</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Attendance</TableHead>
                  {monthlyColumnsWithData.map(month => (
                    <TableHead key={month} className="font-semibold">
                      {month} Att.
                    </TableHead>
                  ))}
                  {/* Saved columns from database - exclude any that exist in current session columns to prevent duplicates */}
                  {(() => {
                    const sessionColNames = getCustomColumnsForSlot(year, semester).map(c => c.name.toLowerCase());
                    return getSavedColumnsFromData(semStudents)
                      .filter(colName => !sessionColNames.includes(colName.toLowerCase()))
                      .map(colName => (
                        <TableHead key={colName} className="font-semibold">
                          <div className="flex items-center gap-2">
                            {isInDeleteMode && (
                              <Checkbox
                                checked={selectedCols.has(colName)}
                                onCheckedChange={() => toggleColumnSelection(year, semester, colName)}
                              />
                            )}
                            {colName}
                          </div>
                        </TableHead>
                      ));
                  })()}
                  {/* Temporary custom columns for this semester */}
                  {getCustomColumnsForSlot(year, semester).filter(col => !col.isSaved).map(col => (
                    <TableHead key={col.id} className="font-semibold">
                      <div className="flex items-center gap-2">
                        {isInDeleteMode && (
                          <Checkbox
                            checked={selectedCols.has(col.name)}
                            onCheckedChange={() => toggleColumnSelection(year, semester, col.name)}
                          />
                        )}
                        {col.name}
                        {!isInDeleteMode && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-success hover:text-success hover:bg-success/10"
                              onClick={() => handleSaveColumn(col.id, year, semester)}
                              title="Save column permanently"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveColumn(col.id, year, semester)}
                              title="Remove column"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {/* Saved custom columns from this session for this semester */}
                  {getCustomColumnsForSlot(year, semester).filter(col => col.isSaved).map(col => (
                    <TableHead key={col.id} className="font-semibold">
                      <div className="flex items-center gap-2">
                        {isInDeleteMode && (
                          <Checkbox
                            checked={selectedCols.has(col.name)}
                            onCheckedChange={() => toggleColumnSelection(year, semester, col.name)}
                          />
                        )}
                        {col.name}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semStudents.map((student) => {
                  const customFields = student.custom_fields as Record<string, unknown> | null;
                  const avgAttendance = calculateAvgAttendance(customFields);
                  return (
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
                                avgAttendance >= 90 ? 'bg-success' :
                                avgAttendance >= 75 ? 'bg-warning' :
                                'bg-destructive'
                              }`}
                              style={{ width: `${Math.min(100, avgAttendance)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{avgAttendance}%</span>
                        </div>
                      </TableCell>
                      {monthlyColumnsWithData.map(month => {
                        const mKey = month.toLowerCase() + '_attendance';
                        const value = customFields?.[mKey];
                        const numValue = typeof value === 'number' ? value : (value ? parseFloat(String(value)) : 0);
                        return (
                          <TableCell key={month}>
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    numValue >= 90 ? 'bg-success' :
                                    numValue >= 75 ? 'bg-warning' :
                                    'bg-destructive'
                                  }`}
                                  style={{ width: `${Math.min(100, numValue)}%` }}
                                />
                              </div>
                              <span className="text-sm">{numValue || 0}%</span>
                            </div>
                          </TableCell>
                        );
                      })}
                      {/* Saved columns from database - exclude session columns to prevent duplicates */}
                      {(() => {
                        const sessionColNames = getCustomColumnsForSlot(year, semester).map(c => c.name.toLowerCase());
                        return getSavedColumnsFromData(semStudents)
                          .filter(colName => !sessionColNames.includes(colName.toLowerCase()))
                          .map(colName => (
                            <TableCell key={colName}>
                              <Input
                                className="h-8 w-24"
                                defaultValue={(customFields as Record<string, string> | null)?.[colName] || ''}
                                onBlur={(e) => handleUpdateCustomField(student.id, colName, e.target.value)}
                              />
                            </TableCell>
                          ));
                      })()}
                      {/* All custom columns for this semester (both temporary and saved from this session) */}
                      {getCustomColumnsForSlot(year, semester).map(col => (
                        <TableCell key={col.id}>
                          <Input
                            className="h-8 w-24"
                            defaultValue={(customFields as Record<string, string> | null)?.[col.name] || ''}
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
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
    <DashboardLayout title="Student Management" subtitle="Manage student records by semester">
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      <Card className="p-6">
        <Tabs value={selectedTab} onValueChange={(v) => { setSelectedTab(v); setSelectedSemester('1'); }}>
          <TabsList className="mb-6">
            {YEAR_LABELS.map((label, idx) => (
              <TabsTrigger key={idx + 1} value={String(idx + 1)}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {YEAR_LABELS.map((_, idx) => {
            const year = idx + 1;
            return (
              <TabsContent key={year} value={String(year)}>
                <Tabs value={selectedSemester} onValueChange={setSelectedSemester}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="1">
                      Sem {getGlobalSemester(year, 1)} ({getStudentsBySemester(year, 1).length})
                    </TabsTrigger>
                    <TabsTrigger value="2">
                      Sem {getGlobalSemester(year, 2)} ({getStudentsBySemester(year, 2).length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="1">
                    {renderStudentTable(getStudentsBySemester(year, 1), year, 1)}
                  </TabsContent>
                  <TabsContent value="2">
                    {renderStudentTable(getStudentsBySemester(year, 2), year, 2)}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto pr-4">
              <div className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student_id">Student ID / Roll No</Label>
                <Input
                  id="student_id"
                  value={formData.student_id || ''}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  placeholder="e.g., STU001"
                  disabled={!!editingStudent}
                  className={editingStudent ? 'bg-muted cursor-not-allowed' : ''}
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
              <Label htmlFor="semester">Semester</Label>
              <Select
                value={String(formData.semester || 1)}
                onValueChange={(v) => setFormData({ ...formData, semester: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="1">
                    Sem {getGlobalSemester(formData.year || 1, 1)}
                  </SelectItem>
                  <SelectItem value="2">
                    Sem {getGlobalSemester(formData.year || 1, 2)}
                  </SelectItem>
                </SelectContent>
              </Select>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  type="number"
                  value={formData.contact || ''}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
            </div>
            
            {/* Monthly Attendance Section - All 12 months */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Monthly Attendance (Optional)</Label>
              <div className="grid grid-cols-3 gap-3 p-2 border rounded-md bg-muted/30">
                {MONTH_LABELS.map((month) => {
                  const mKey = month.toLowerCase().replace(' ', '_') + '_attendance';
                  return (
                    <div key={month} className="space-y-1">
                      <Label htmlFor={mKey} className="text-xs text-muted-foreground">{month}</Label>
                      <Input
                        id={mKey}
                        type="number"
                        min={0}
                        max={100}
                        placeholder="%"
                        className="h-8"
                        value={monthlyAttendance[mKey] || ''}
                        onChange={(e) => setMonthlyAttendance(prev => ({
                          ...prev,
                          [mKey]: e.target.value
                        }))}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Only months with data will appear as columns in the table.
              </p>
            </div>
            
            {/* Custom Fields Section - show ALL columns present in table */}
            {(() => {
              const yr = formData.year || 1;
              const sem = formData.semester || 1;
              const allStudents = getStudentsBySemester(yr, sem);
              const savedCols = getSavedColumnsFromData(allStudents);
              // Add columns from current session for this semester (both saved and unsaved)
              const sessionCols = getCustomColumnsForSlot(yr, sem).map(c => c.name);
              // Also include any custom fields that exist on the current student being edited
              const studentCustomFields = editingStudent?.custom_fields as Record<string, unknown> | null;
              const studentCols = studentCustomFields ? Object.keys(studentCustomFields).filter(fKey => {
                // Exclude monthly attendance keys
                const monthKeys = MONTH_LABELS.map(m => m.toLowerCase() + '_attendance');
                return !monthKeys.includes(fKey);
              }) : [];
              
              const allCols = [...new Set([...savedCols, ...sessionCols, ...studentCols])];
              
              if (allCols.length === 0) return null;
              
              return (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Custom Fields</Label>
                  <div className="grid grid-cols-2 gap-3 p-2 border rounded-md bg-muted/30">
                    {allCols.map(colName => (
                      <div key={colName} className="space-y-1">
                        <Label htmlFor={`custom-${colName}`} className="text-xs text-muted-foreground capitalize">
                          {colName.replace(/_/g, ' ')}
                        </Label>
                        <Input
                          id={`custom-${colName}`}
                          className="h-8"
                          value={String((formData.custom_fields as Record<string, unknown>)?.[colName] || '')}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            custom_fields: {
                              ...(prev.custom_fields || {}),
                              [colName]: e.target.value
                            }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t mt-4 flex-shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className={editingStudent ? 'bg-primary hover:bg-primary/90' : ''}>
                {editingStudent ? 'Update Student' : 'Add Student'}
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
                Students will be imported to <strong>Sem {getGlobalSemester(parseInt(selectedTab), parseInt(selectedSemester))}</strong>.
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
                      out of {importState.result.totalRows} rows. Importing to <strong>Sem {getGlobalSemester(parseInt(selectedTab), parseInt(selectedSemester))}</strong>.
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
                          <span className="text-muted-foreground text-xs">
                            Sem {getGlobalSemester(parseInt(selectedTab), parseInt(selectedSemester))}
                          </span>
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
