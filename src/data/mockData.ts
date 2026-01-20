import { Student, Document, Report, Department } from '@/types';

export const mockStudents: Student[] = [
  { id: '1', name: 'Alice Johnson', rollNumber: 'CS2024001', email: 'alice.j@student.edu', department: 'Computer Science', semester: 4, attendance: 92, grades: { 'DSA': 85, 'OS': 78, 'DBMS': 90 } },
  { id: '2', name: 'Bob Smith', rollNumber: 'CS2024002', email: 'bob.s@student.edu', department: 'Computer Science', semester: 4, attendance: 88, grades: { 'DSA': 72, 'OS': 85, 'DBMS': 78 } },
  { id: '3', name: 'Carol Williams', rollNumber: 'CS2024003', email: 'carol.w@student.edu', department: 'Computer Science', semester: 4, attendance: 95, grades: { 'DSA': 92, 'OS': 88, 'DBMS': 95 } },
  { id: '4', name: 'David Brown', rollNumber: 'CS2024004', email: 'david.b@student.edu', department: 'Computer Science', semester: 4, attendance: 78, grades: { 'DSA': 68, 'OS': 72, 'DBMS': 75 } },
  { id: '5', name: 'Eva Martinez', rollNumber: 'CS2024005', email: 'eva.m@student.edu', department: 'Computer Science', semester: 4, attendance: 90, grades: { 'DSA': 88, 'OS': 82, 'DBMS': 86 } },
  { id: '6', name: 'Frank Lee', rollNumber: 'CS2024006', email: 'frank.l@student.edu', department: 'Computer Science', semester: 4, attendance: 85, grades: { 'DSA': 76, 'OS': 79, 'DBMS': 82 } },
  { id: '7', name: 'Grace Chen', rollNumber: 'CS2024007', email: 'grace.c@student.edu', department: 'Computer Science', semester: 4, attendance: 97, grades: { 'DSA': 95, 'OS': 92, 'DBMS': 98 } },
  { id: '8', name: 'Henry Wilson', rollNumber: 'CS2024008', email: 'henry.w@student.edu', department: 'Computer Science', semester: 4, attendance: 82, grades: { 'DSA': 70, 'OS': 75, 'DBMS': 72 } },
];

export const mockDocuments: Document[] = [
  { id: '1', name: 'Research Paper - AI in Education.pdf', type: 'PDF', size: '2.4 MB', uploadedAt: '2024-01-15', uploadedBy: 'Dr. Sarah Johnson' },
  { id: '2', name: 'Semester Report Q3.docx', type: 'Word', size: '856 KB', uploadedAt: '2024-01-10', uploadedBy: 'Dr. Sarah Johnson' },
  { id: '3', name: 'Student Performance Analytics.xlsx', type: 'Excel', size: '1.2 MB', uploadedAt: '2024-01-08', uploadedBy: 'Dr. Sarah Johnson' },
  { id: '4', name: 'Teaching Certificate.pdf', type: 'PDF', size: '450 KB', uploadedAt: '2023-12-20', uploadedBy: 'Dr. Sarah Johnson' },
];

export const mockReports: Report[] = [
  { id: '1', title: 'Q4 2023 Student Performance Analysis', createdAt: '2024-01-12', createdBy: 'Dr. Sarah Johnson', department: 'Computer Science', status: 'submitted', charts: ['attendance', 'grades'] },
  { id: '2', title: 'Annual Attendance Report 2023', createdAt: '2024-01-05', createdBy: 'Dr. Sarah Johnson', department: 'Computer Science', status: 'approved', charts: ['attendance'] },
  { id: '3', title: 'Mid-Semester Progress Report', createdAt: '2023-11-20', createdBy: 'Prof. John Davis', department: 'Computer Science', status: 'draft', charts: ['grades'] },
];

export const mockDepartments: Department[] = [
  { id: '1', name: 'Computer Science', hodName: 'Prof. Michael Chen', teacherCount: 12, studentCount: 180 },
  { id: '2', name: 'Electronics', hodName: 'Dr. Amanda Foster', teacherCount: 10, studentCount: 150 },
  { id: '3', name: 'Mechanical Engineering', hodName: 'Prof. Robert Kumar', teacherCount: 14, studentCount: 200 },
  { id: '4', name: 'Civil Engineering', hodName: 'Dr. Patricia Wang', teacherCount: 8, studentCount: 120 },
  { id: '5', name: 'Information Technology', hodName: 'Prof. James Taylor', teacherCount: 11, studentCount: 160 },
];

export const mockTeachers = [
  { id: '1', name: 'Dr. Sarah Johnson', email: 'sarah.j@institute.edu', department: 'Computer Science', subjects: ['Data Structures', 'Algorithms'], students: 45 },
  { id: '2', name: 'Prof. John Davis', email: 'john.d@institute.edu', department: 'Computer Science', subjects: ['Operating Systems', 'Networks'], students: 52 },
  { id: '3', name: 'Dr. Emily Parker', email: 'emily.p@institute.edu', department: 'Computer Science', subjects: ['Database Systems', 'Web Development'], students: 48 },
  { id: '4', name: 'Prof. Mark Anderson', email: 'mark.a@institute.edu', department: 'Computer Science', subjects: ['Machine Learning', 'AI'], students: 38 },
];

export const mockHODs = [
  { id: '1', name: 'Prof. Michael Chen', email: 'michael.c@institute.edu', department: 'Computer Science', teacherCount: 12, yearsOfService: 15, documents: 8 },
  { id: '2', name: 'Dr. Amanda Foster', email: 'amanda.f@institute.edu', department: 'Electronics', teacherCount: 10, yearsOfService: 12, documents: 6 },
  { id: '3', name: 'Prof. Robert Kumar', email: 'robert.k@institute.edu', department: 'Mechanical Engineering', teacherCount: 14, yearsOfService: 18, documents: 10 },
  { id: '4', name: 'Dr. Patricia Wang', email: 'patricia.w@institute.edu', department: 'Civil Engineering', teacherCount: 8, yearsOfService: 10, documents: 5 },
];
