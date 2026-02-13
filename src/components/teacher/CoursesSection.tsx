import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Pencil, Trash2, BookOpen, Users, X, Check, Columns, UserPlus, UserMinus, Edit2 } from 'lucide-react';
import { Course } from '@/hooks/useCourses';
import { StudentRecord } from '@/hooks/useStudents';
import { useToast } from '@/hooks/use-toast';

interface CustomColumn {
  id: string;
  name: string;
  isSaved: boolean;
}

interface CoursesSectionProps {
  courses: Course[];
  allStudents: StudentRecord[];
  getStudentsForCourse: (courseId: string) => string[];
  onAddCourse: (name: string, description: string) => Promise<Course | null>;
  onUpdateCourse: (id: string, updates: { name?: string; description?: string }) => Promise<Course | null>;
  onDeleteCourse: (id: string) => Promise<boolean>;
  onAddStudentToCourse: (courseId: string, studentRecordId: string) => Promise<any>;
  onRemoveStudentFromCourse: (courseId: string, studentRecordId: string) => Promise<boolean>;
  onUpdateStudent: (id: string, updates: any) => Promise<any>;
  initialCourseId?: string | null;
  initialAction?: string | null;
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CoursesSection({
  courses,
  allStudents,
  getStudentsForCourse,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onAddStudentToCourse,
  onRemoveStudentFromCourse,
  onUpdateStudent,
  initialCourseId,
  initialAction,
}: CoursesSectionProps) {
  const { toast } = useToast();
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [selectedCourseTab, setSelectedCourseTab] = useState<string>('');
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [enrollCourseId, setEnrollCourseId] = useState<string>('');

  // Custom column state per course
  const [customColumnsByCourse, setCustomColumnsByCourse] = useState<Record<string, CustomColumn[]>>({});
  const [newColumnName, setNewColumnName] = useState('');
  const [deleteColumnMode, setDeleteColumnMode] = useState<Record<string, boolean>>({});
  const [selectedColumnsToDelete, setSelectedColumnsToDelete] = useState<Record<string, Set<string>>>({});
  // Permanently deleted base columns per course
  const [deletedBaseColumns, setDeletedBaseColumns] = useState<Record<string, Set<string>>>({});

  // Edit student row state
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editStudentForm, setEditStudentForm] = useState<Record<string, string>>({});
  const [editStudentCourseId, setEditStudentCourseId] = useState<string>('');

  const BASE_COLUMNS = ['Student ID', 'Name', 'Email', 'Contact', 'Attendance'];
  const isBaseColumnVisible = (courseId: string, col: string) => !(deletedBaseColumns[courseId]?.has(col));

  // Handle initial course/action from sidebar navigation
  useEffect(() => {
    if (initialAction === 'add') {
      handleOpenAddCourse();
    } else if (initialCourseId && courses.length > 0) {
      const courseExists = courses.find(c => c.id === initialCourseId);
      if (courseExists) {
        setSelectedCourseTab(initialCourseId);
      }
    }
  }, [initialCourseId, initialAction, courses]);

  const handleOpenAddCourse = () => {
    setEditingCourse(null);
    setCourseName('');
    setCourseDescription('');
    setIsCourseDialogOpen(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseName(course.name);
    setCourseDescription(course.description || '');
    setIsCourseDialogOpen(true);
  };

  const handleSaveCourse = async () => {
    if (!courseName.trim()) return;
    if (editingCourse) {
      await onUpdateCourse(editingCourse.id, { name: courseName.trim(), description: courseDescription.trim() });
    } else {
      const newCourse = await onAddCourse(courseName.trim(), courseDescription.trim());
      if (newCourse) {
        setSelectedCourseTab(newCourse.id);
      }
    }
    setIsCourseDialogOpen(false);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? All student enrollments will be removed.')) {
      await onDeleteCourse(courseId);
      if (selectedCourseTab === courseId) {
        setSelectedCourseTab(courses.filter(c => c.id !== courseId)[0]?.id || '');
      }
    }
  };

  const handleOpenEnroll = (courseId: string) => {
    setEnrollCourseId(courseId);
    setIsEnrollDialogOpen(true);
  };

  const handleToggleEnrollment = async (courseId: string, studentId: string, isEnrolled: boolean) => {
    if (isEnrolled) {
      await onRemoveStudentFromCourse(courseId, studentId);
    } else {
      await onAddStudentToCourse(courseId, studentId);
    }
  };

  // Custom column helpers
  const getCustomColumnsForCourse = (courseId: string): CustomColumn[] => {
    return customColumnsByCourse[courseId] || [];
  };

  const handleAddColumn = (courseId: string) => {
    if (!newColumnName.trim()) return;
    const currentCols = getCustomColumnsForCourse(courseId);
    if (currentCols.some(c => c.name.toLowerCase() === newColumnName.trim().toLowerCase())) {
      toast({ title: 'Column Already Exists', description: `"${newColumnName.trim()}" already exists.`, variant: 'destructive' });
      return;
    }
    const newCol: CustomColumn = { id: Date.now().toString(), name: newColumnName.trim(), isSaved: false };
    setCustomColumnsByCourse(prev => ({ ...prev, [courseId]: [...(prev[courseId] || []), newCol] }));
    setNewColumnName('');
    toast({ title: 'Column Added', description: `"${newCol.name}" added. Click checkmark to save.` });
  };

  const handleRemoveColumn = (courseId: string, colId: string) => {
    setCustomColumnsByCourse(prev => ({ ...prev, [courseId]: (prev[courseId] || []).filter(c => c.id !== colId) }));
  };

  const handleSaveColumn = (courseId: string, colId: string) => {
    setCustomColumnsByCourse(prev => ({
      ...prev,
      [courseId]: (prev[courseId] || []).map(c => c.id === colId ? { ...c, isSaved: true } : c)
    }));
    toast({ title: 'Column Saved' });
  };

  const toggleDeleteColumnMode = (courseId: string) => {
    const newMode = !deleteColumnMode[courseId];
    setDeleteColumnMode(prev => ({ ...prev, [courseId]: newMode }));
    if (!newMode) {
      setSelectedColumnsToDelete(prev => ({ ...prev, [courseId]: new Set() }));
    }
  };

  const toggleColumnSelection = (courseId: string, columnName: string) => {
    setSelectedColumnsToDelete(prev => {
      const currentSet = new Set(prev[courseId]);
      if (currentSet.has(columnName)) currentSet.delete(columnName);
      else currentSet.add(columnName);
      return { ...prev, [courseId]: currentSet };
    });
  };

  const handleDeleteSelectedColumns = async (courseId: string, courseStudentRecords: StudentRecord[]) => {
    const columnsToDelete = selectedColumnsToDelete[courseId];
    if (!columnsToDelete || columnsToDelete.size === 0) {
      toast({ title: 'No columns selected', variant: 'destructive' });
      return;
    }

    // Separate base columns from custom columns
    const baseColsToDelete = new Set<string>();
    const customColsToDelete = new Set<string>();
    const monthlyColsToDelete = new Set<string>();

    columnsToDelete.forEach(colName => {
      if (BASE_COLUMNS.includes(colName)) {
        baseColsToDelete.add(colName);
      } else if (colName.endsWith(' Att.')) {
        monthlyColsToDelete.add(colName);
      } else {
        customColsToDelete.add(colName);
      }
    });

    // Permanently delete base columns from this course's view
    if (baseColsToDelete.size > 0 || monthlyColsToDelete.size > 0) {
      setDeletedBaseColumns(prev => {
        const current = new Set(prev[courseId] || []);
        baseColsToDelete.forEach(col => current.add(col));
        monthlyColsToDelete.forEach(col => current.add(col));
        return { ...prev, [courseId]: current };
      });
    }

    // Delete custom columns from state and data
    if (customColsToDelete.size > 0) {
      setCustomColumnsByCourse(prev => ({
        ...prev,
        [courseId]: (prev[courseId] || []).filter(c => !customColsToDelete.has(c.name))
      }));
      for (const student of courseStudentRecords) {
        const customFields = student.custom_fields as Record<string, unknown> | null;
        if (customFields) {
          const updated = { ...customFields };
          let changed = false;
          customColsToDelete.forEach(colName => {
            const fieldKey = getCourseFieldKey(courseId, colName);
            if (fieldKey in updated) { delete updated[fieldKey]; changed = true; }
          });
          if (changed) await onUpdateStudent(student.id, { custom_fields: updated });
        }
      }
    }

    const totalRemoved = columnsToDelete.size;
    toast({ title: 'Columns Deleted', description: `${totalRemoved} column(s) deleted from this course.` });
    setDeleteColumnMode(prev => ({ ...prev, [courseId]: false }));
    setSelectedColumnsToDelete(prev => ({ ...prev, [courseId]: new Set() }));
  };

  const getCourseFieldKey = (courseId: string, columnName: string) => `course_${courseId}:${columnName}`;

  const handleUpdateCustomField = async (studentId: string, courseId: string, columnName: string, value: string) => {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;
    const fieldKey = getCourseFieldKey(courseId, columnName);
    const updatedCustomFields = { ...(student.custom_fields || {}), [fieldKey]: value };
    await onUpdateStudent(studentId, { custom_fields: updatedCustomFields });
  };

  const getSavedColumnsFromData = (courseId: string, students: StudentRecord[]) => {
    const savedCols = new Set<string>();
    const prefix = `course_${courseId}:`;
    students.forEach(student => {
      const cf = student.custom_fields as Record<string, unknown> | null;
      if (cf) {
        Object.keys(cf).forEach(key => {
          if (key.startsWith(prefix)) {
            savedCols.add(key.slice(prefix.length));
          }
        });
      }
    });
    return Array.from(savedCols);
  };

  const getMonthlyColumnsWithData = (students: StudentRecord[]) => {
    const monthsWithData = new Set<string>();
    students.forEach(student => {
      const cf = student.custom_fields as Record<string, unknown> | null;
      if (cf) {
        MONTH_LABELS.forEach(month => {
          const key = month.toLowerCase() + '_attendance';
          if (cf[key] !== undefined && cf[key] !== null && cf[key] !== '') monthsWithData.add(month);
        });
      }
    });
    return MONTH_LABELS.filter(month => monthsWithData.has(month));
  };

  const calculateAvgAttendance = (customFields: Record<string, unknown> | null): number => {
    if (!customFields) return 0;
    const monthKeys = MONTH_LABELS.map(m => m.toLowerCase() + '_attendance');
    let total = 0, count = 0;
    monthKeys.forEach(key => {
      const value = customFields[key];
      if (value !== undefined && value !== null && value !== '') {
        const numValue = typeof value === 'number' ? value : parseFloat(String(value));
        if (!isNaN(numValue)) { total += numValue; count++; }
      }
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  // Edit student row handlers
  const handleOpenEditStudent = (courseId: string, student: StudentRecord) => {
    setEditStudentCourseId(courseId);
    setEditingStudent(student);
    const customFields = student.custom_fields as Record<string, string> | null;
    // Extract course-specific custom fields (strip prefix for form display)
    const coursePrefix = `course_${courseId}:`;
    const courseCustom: Record<string, string> = {};
    if (customFields) {
      Object.entries(customFields).forEach(([key, value]) => {
        if (key.startsWith(coursePrefix)) {
          courseCustom[key.slice(coursePrefix.length)] = String(value);
        }
      });
    }
    setEditStudentForm({
      name: student.name || '',
      student_id: student.student_id || '',
      email: student.email || '',
      contact: student.contact ? String(student.contact) : '',
      ...courseCustom,
    });
  };

  const handleSaveEditStudent = async () => {
    if (!editingStudent) return;
    const { name, student_id, email, contact, ...customFieldUpdates } = editStudentForm;
    
    const baseUpdates: Record<string, any> = {};
    if (name !== (editingStudent.name || '')) baseUpdates.name = name;
    if (student_id !== (editingStudent.student_id || '')) baseUpdates.student_id = student_id;
    if (email !== (editingStudent.email || '')) baseUpdates.email = email;
    if (contact !== (editingStudent.contact ? String(editingStudent.contact) : '')) {
      baseUpdates.contact = contact ? parseInt(contact) : null;
    }

    // Merge custom fields with course prefix
    const existingCustom = (editingStudent.custom_fields as Record<string, unknown>) || {};
    const prefixedUpdates: Record<string, unknown> = {};
    Object.entries(customFieldUpdates).forEach(([key, value]) => {
      prefixedUpdates[getCourseFieldKey(editStudentCourseId, key)] = value;
    });
    const mergedCustom = { ...existingCustom, ...prefixedUpdates };
    baseUpdates.custom_fields = mergedCustom;

    await onUpdateStudent(editingStudent.id, baseUpdates);
    toast({ title: 'Student Updated' });
    setEditingStudent(null);
  };

  const getEditableCustomColumns = (courseId: string, students: StudentRecord[]) => {
    const sessionCols = getCustomColumnsForCourse(courseId).map(c => c.name);
    const savedCols = getSavedColumnsFromData(courseId, students).filter(
      c => !sessionCols.map(s => s.toLowerCase()).includes(c.toLowerCase())
    );
    return [...savedCols, ...sessionCols];
  };

  const renderCourseStudentTable = (courseId: string) => {
    const enrolledStudentIds = getStudentsForCourse(courseId);
    const courseStudentRecords = allStudents.filter(s => enrolledStudentIds.includes(s.id));
    const monthlyColumnsWithData = getMonthlyColumnsWithData(courseStudentRecords);
    const isInDeleteMode = deleteColumnMode[courseId] || false;
    const selectedCols = selectedColumnsToDelete[courseId] || new Set();
    const visibleMonthlyColumns = monthlyColumnsWithData.filter(m => !deletedBaseColumns[courseId]?.has(m + ' Att.'));

    const getDeletableColumns = () => {
      const visibleBase = BASE_COLUMNS.filter(c => c !== 'Name' && isBaseColumnVisible(courseId, c));
      const visibleMonthly = monthlyColumnsWithData
        .filter(m => !deletedBaseColumns[courseId]?.has(m + ' Att.'))
        .map(m => m + ' Att.');
      const sessionColNames = getCustomColumnsForCourse(courseId).map(c => c.name);
      const savedCols = getSavedColumnsFromData(courseId, courseStudentRecords).filter(
        colName => !sessionColNames.map(s => s.toLowerCase()).includes(colName.toLowerCase())
      );
      return [...visibleBase, ...visibleMonthly, ...savedCols, ...sessionColNames];
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{courseStudentRecords.length} students enrolled</span>
          </div>
          <div className="flex gap-2">
            {isInDeleteMode ? (
              <>
                <Button variant="destructive" onClick={() => handleDeleteSelectedColumns(courseId, courseStudentRecords)} disabled={selectedCols.size === 0}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete Selected ({selectedCols.size})
                </Button>
                <Button variant="outline" onClick={() => toggleDeleteColumnMode(courseId)}>
                  <X className="w-4 h-4 mr-2" />Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => toggleDeleteColumnMode(courseId)}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete Column
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline"><Columns className="w-4 h-4 mr-2" />Add Column</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-background border shadow-lg">
                    <div className="space-y-3">
                      <Label>Column Name</Label>
                      <Input placeholder="e.g., Midterm Marks" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} />
                      <Button size="sm" onClick={() => handleAddColumn(courseId)} disabled={!newColumnName.trim()}>Add Column</Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button variant="outline" onClick={() => handleOpenEnroll(courseId)}>
                  <UserPlus className="w-4 h-4 mr-2" />Manage Students
                </Button>
              </>
            )}
          </div>
        </div>

        {courseStudentRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="mb-2">No students enrolled in this course.</p>
            <Button variant="outline" onClick={() => handleOpenEnroll(courseId)}>
              <UserPlus className="w-4 h-4 mr-2" />Enroll Students
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {isBaseColumnVisible(courseId, 'Student ID') && (
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        {isInDeleteMode && <Checkbox checked={selectedCols.has('Student ID')} onCheckedChange={() => toggleColumnSelection(courseId, 'Student ID')} />}
                        Student ID
                      </div>
                    </TableHead>
                  )}
                  {isBaseColumnVisible(courseId, 'Name') && (
                    <TableHead className="font-semibold">Name</TableHead>
                  )}
                  {isBaseColumnVisible(courseId, 'Email') && (
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        {isInDeleteMode && <Checkbox checked={selectedCols.has('Email')} onCheckedChange={() => toggleColumnSelection(courseId, 'Email')} />}
                        Email
                      </div>
                    </TableHead>
                  )}
                  {isBaseColumnVisible(courseId, 'Contact') && (
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        {isInDeleteMode && <Checkbox checked={selectedCols.has('Contact')} onCheckedChange={() => toggleColumnSelection(courseId, 'Contact')} />}
                        Contact
                      </div>
                    </TableHead>
                  )}
                  {isBaseColumnVisible(courseId, 'Attendance') && (
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        {isInDeleteMode && <Checkbox checked={selectedCols.has('Attendance')} onCheckedChange={() => toggleColumnSelection(courseId, 'Attendance')} />}
                        Attendance
                      </div>
                    </TableHead>
                  )}
                  {visibleMonthlyColumns.map(month => (
                    <TableHead key={month} className="font-semibold">
                      <div className="flex items-center gap-2">
                        {isInDeleteMode && <Checkbox checked={selectedCols.has(month + ' Att.')} onCheckedChange={() => toggleColumnSelection(courseId, month + ' Att.')} />}
                        {month} Att.
                      </div>
                    </TableHead>
                  ))}
                  {(() => {
                    const sessionColNames = getCustomColumnsForCourse(courseId).map(c => c.name.toLowerCase());
                    return getSavedColumnsFromData(courseId, courseStudentRecords)
                      .filter(colName => !sessionColNames.includes(colName.toLowerCase()))
                      .map(colName => (
                        <TableHead key={colName} className="font-semibold">
                          <div className="flex items-center gap-2">
                            {isInDeleteMode && <Checkbox checked={selectedCols.has(colName)} onCheckedChange={() => toggleColumnSelection(courseId, colName)} />}
                            {colName}
                          </div>
                        </TableHead>
                      ));
                  })()}
                  {getCustomColumnsForCourse(courseId).filter(col => !col.isSaved).map(col => (
                    <TableHead key={col.id} className="font-semibold">
                      <div className="flex items-center gap-2">
                        {isInDeleteMode && <Checkbox checked={selectedCols.has(col.name)} onCheckedChange={() => toggleColumnSelection(courseId, col.name)} />}
                        {col.name}
                        {!isInDeleteMode && (
                          <>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-success hover:text-success hover:bg-success/10" onClick={() => handleSaveColumn(courseId, col.id)} title="Save column permanently">
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive" onClick={() => handleRemoveColumn(courseId, col.id)} title="Remove column">
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {getCustomColumnsForCourse(courseId).filter(col => col.isSaved).map(col => (
                    <TableHead key={col.id} className="font-semibold">
                      <div className="flex items-center gap-2">
                        {isInDeleteMode && <Checkbox checked={selectedCols.has(col.name)} onCheckedChange={() => toggleColumnSelection(courseId, col.name)} />}
                        {col.name}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseStudentRecords.map((student) => {
                  const customFields = student.custom_fields as Record<string, unknown> | null;
                  const avgAttendance = calculateAvgAttendance(customFields);
                  return (
                    <TableRow key={student.id} className="hover:bg-muted/30">
                      {isBaseColumnVisible(courseId, 'Student ID') && (
                        <TableCell className="font-medium">{student.student_id || '-'}</TableCell>
                      )}
                      {isBaseColumnVisible(courseId, 'Name') && (
                        <TableCell>{student.name}</TableCell>
                      )}
                      {isBaseColumnVisible(courseId, 'Email') && (
                        <TableCell>{student.email || '-'}</TableCell>
                      )}
                      {isBaseColumnVisible(courseId, 'Contact') && (
                        <TableCell>{student.contact || '-'}</TableCell>
                      )}
                      {isBaseColumnVisible(courseId, 'Attendance') && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${avgAttendance >= 90 ? 'bg-success' : avgAttendance >= 75 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${Math.min(100, avgAttendance)}%` }} />
                            </div>
                            <span className="text-sm font-medium">{avgAttendance}%</span>
                          </div>
                        </TableCell>
                      )}
                      {visibleMonthlyColumns.map(month => {
                        const mKey = month.toLowerCase() + '_attendance';
                        const value = customFields?.[mKey];
                        const numValue = typeof value === 'number' ? value : (value ? parseFloat(String(value)) : 0);
                        return (
                          <TableCell key={month}>
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${numValue >= 90 ? 'bg-success' : numValue >= 75 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${Math.min(100, numValue)}%` }} />
                              </div>
                              <span className="text-sm">{numValue || 0}%</span>
                            </div>
                          </TableCell>
                        );
                      })}
                      {(() => {
                        const sessionColNames = getCustomColumnsForCourse(courseId).map(c => c.name.toLowerCase());
                        return getSavedColumnsFromData(courseId, courseStudentRecords)
                          .filter(colName => !sessionColNames.includes(colName.toLowerCase()))
                          .map(colName => (
                            <TableCell key={colName}>
                              <Input className="h-8 w-24" defaultValue={(customFields as Record<string, string> | null)?.[getCourseFieldKey(courseId, colName)] || ''} onBlur={(e) => handleUpdateCustomField(student.id, courseId, colName, e.target.value)} />
                            </TableCell>
                          ));
                      })()}
                      {getCustomColumnsForCourse(courseId).map(col => (
                        <TableCell key={col.id}>
                          <Input className="h-8 w-24" defaultValue={(customFields as Record<string, string> | null)?.[getCourseFieldKey(courseId, col.name)] || ''} onBlur={(e) => handleUpdateCustomField(student.id, courseId, col.name, e.target.value)} />
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEditStudent(courseId, student)} title="Edit student">
                            <Edit2 className="w-4 h-4 mr-1" />Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onRemoveStudentFromCourse(courseId, student.id)}>
                            <UserMinus className="w-4 h-4 mr-1" />Remove
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

  // Set default selected course tab
  if (!selectedCourseTab && courses.length > 0) {
    setSelectedCourseTab(courses[0].id);
  }

  // Get custom columns for edit dialog
  const editCourseStudents = editStudentCourseId
    ? allStudents.filter(s => getStudentsForCourse(editStudentCourseId).includes(s.id))
    : [];
  const editableCustomCols = editStudentCourseId
    ? getEditableCustomColumns(editStudentCourseId, editCourseStudents)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Courses
        </h3>
        <Button onClick={handleOpenAddCourse}>
          <Plus className="w-4 h-4 mr-2" />Add Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">No courses yet. Create your first course to get started.</p>
          <Button onClick={handleOpenAddCourse}>
            <Plus className="w-4 h-4 mr-2" />Create Course
          </Button>
        </Card>
      ) : (
        <Card className="p-6">
          <Tabs value={selectedCourseTab} onValueChange={setSelectedCourseTab}>
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              <TabsList>
                {courses.map(course => (
                  <TabsTrigger key={course.id} value={course.id}>
                    {course.name} ({getStudentsForCourse(course.id).length})
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {courses.map(course => (
              <TabsContent key={course.id} value={course.id}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {course.description && (
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditCourse(course)}>
                      <Pencil className="w-4 h-4 mr-1" />Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCourse(course.id)}>
                      <Trash2 className="w-4 h-4 mr-1" />Delete
                    </Button>
                  </div>
                </div>
                {renderCourseStudentTable(course.id)}
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )}

      {/* Add/Edit Course Dialog */}
      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course-name">Course Name</Label>
              <Input id="course-name" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g., Data Structures" required />
            </div>
            <div>
              <Label htmlFor="course-desc">Description (Optional)</Label>
              <Textarea id="course-desc" value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} placeholder="Brief description of the course" rows={3} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCourseDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveCourse} disabled={!courseName.trim()}>
                {editingCourse ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enroll Students Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Student Enrollment</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {allStudents.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No students available. Add students in the Semesters tab first.</p>
            ) : (
              <div className="space-y-2">
                {allStudents.map(student => {
                  const isEnrolled = getStudentsForCourse(enrollCourseId).includes(student.id);
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.student_id ? `ID: ${student.student_id} · ` : ''}
                          Year {student.year || 1} · Sem {student.semester || 1}
                        </p>
                      </div>
                      <Button
                        variant={isEnrolled ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleToggleEnrollment(enrollCourseId, student.id, isEnrolled)}
                      >
                        {isEnrolled ? (
                          <><UserMinus className="w-4 h-4 mr-1" />Remove</>
                        ) : (
                          <><UserPlus className="w-4 h-4 mr-1" />Enroll</>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => { if (!open) setEditingStudent(null); }}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div>
              <Label>Name</Label>
              <Input value={editStudentForm.name || ''} onChange={(e) => setEditStudentForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label>Student ID</Label>
              <Input value={editStudentForm.student_id || ''} onChange={(e) => setEditStudentForm(prev => ({ ...prev, student_id: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editStudentForm.email || ''} onChange={(e) => setEditStudentForm(prev => ({ ...prev, email: e.target.value }))} />
            </div>
            <div>
              <Label>Contact</Label>
              <Input value={editStudentForm.contact || ''} onChange={(e) => setEditStudentForm(prev => ({ ...prev, contact: e.target.value }))} />
            </div>
            {editableCustomCols.map(colName => (
              <div key={colName}>
                <Label>{colName}</Label>
                <Input value={editStudentForm[colName] || ''} onChange={(e) => setEditStudentForm(prev => ({ ...prev, [colName]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
            <Button onClick={handleSaveEditStudent}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
