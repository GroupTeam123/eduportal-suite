import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: Record<UserRole, User> = {
  teacher: {
    id: '1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@institute.edu',
    role: 'teacher',
    department: 'Computer Science',
  },
  hod: {
    id: '2',
    name: 'Prof. Michael Chen',
    email: 'michael.chen@institute.edu',
    role: 'hod',
    department: 'Computer Science',
  },
  principal: {
    id: '3',
    name: 'Dr. Elizabeth Warren',
    email: 'elizabeth.warren@institute.edu',
    role: 'principal',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Mock authentication - in production, this would call your backend
    if (password.length >= 4) {
      setUser(mockUsers[role]);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
