import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useStudents, StudentRecord } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';

const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function HODStudents() {
  const { departmentId } = useAuth();
  const { students, loading } = useStudents(departmentId);
  const [selectedTab, setSelectedTab] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter students by year
  const getStudentsByYear = (year: number) => {
    return students.filter(s => (s.year || 1) === year);
  };

  // Get all monthly attendance columns that have data in any student
  const getMonthlyColumnsWithData = (yearStudents: StudentRecord[]) => {
    const monthsWithData = new Set<string>();
    yearStudents.forEach(student => {
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

  // Get saved columns from existing student custom_fields (columns that have data)
  const getSavedColumnsFromData = (yearStudents: StudentRecord[]) => {
    const savedCols = new Set<string>();
    const monthKeys = MONTH_LABELS.map(m => m.toLowerCase() + '_attendance');
    
    yearStudents.forEach(student => {
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

  // Filter students by search query
  const filterStudents = (yearStudents: StudentRecord[]) => {
    if (!searchQuery.trim()) return yearStudents;
    const query = searchQuery.toLowerCase();
    return yearStudents.filter(s => 
      s.name.toLowerCase().includes(query) ||
      (s.student_id && s.student_id.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query))
    );
  };

  const renderStudentTable = (yearStudents: StudentRecord[]) => {
    const monthlyColumnsWithData = getMonthlyColumnsWithData(yearStudents);
    const savedColumns = getSavedColumnsFromData(yearStudents);
    const filteredStudents = filterStudents(yearStudents);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredStudents.length} of {yearStudents.length} students
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No students found.</p>
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
                  <TableHead className="font-semibold">Guardian</TableHead>
                  <TableHead className="font-semibold">Attendance</TableHead>
                  {monthlyColumnsWithData.map(month => (
                    <TableHead key={month} className="font-semibold">
                      {month} Att.
                    </TableHead>
                  ))}
                  {savedColumns.map(colName => (
                    <TableHead key={colName} className="font-semibold capitalize">
                      {colName.replace(/_/g, ' ')}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const customFields = student.custom_fields as Record<string, unknown> | null;
                  const avgAttendance = calculateAvgAttendance(customFields);
                  return (
                    <TableRow key={student.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{student.student_id || '-'}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email || '-'}</TableCell>
                      <TableCell>{student.contact || '-'}</TableCell>
                      <TableCell>{student.guardian_name || '-'}</TableCell>
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
                        const key = month.toLowerCase() + '_attendance';
                        const value = customFields?.[key];
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
                      {savedColumns.map(colName => (
                        <TableCell key={colName}>
                          {String(customFields?.[colName] || '-')}
                        </TableCell>
                      ))}
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
      <DashboardLayout title="Department Students" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Department Students" subtitle="View all student records in your department">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Student Records</h2>
              <p className="text-sm text-muted-foreground">Total: {students.length} students</p>
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            {YEAR_LABELS.map((label, idx) => {
              const yearStudents = getStudentsByYear(idx + 1);
              return (
                <TabsTrigger key={idx + 1} value={String(idx + 1)}>
                  {label} ({yearStudents.length})
                </TabsTrigger>
              );
            })}
          </TabsList>

          {YEAR_LABELS.map((_, idx) => (
            <TabsContent key={idx + 1} value={String(idx + 1)}>
              {renderStudentTable(getStudentsByYear(idx + 1))}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </DashboardLayout>
  );
}