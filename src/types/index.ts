export type UserRole = 'teacher' | 'hod' | 'principal';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  department: string;
  semester: number;
  attendance: number;
  grades: Record<string, number>;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Report {
  id: string;
  title: string;
  createdAt: string;
  createdBy: string;
  department: string;
  status: 'draft' | 'submitted' | 'approved';
  charts: string[];
}

export interface Department {
  id: string;
  name: string;
  hodName: string;
  teacherCount: number;
  studentCount: number;
}
