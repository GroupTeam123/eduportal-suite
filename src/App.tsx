import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherReports from "./pages/teacher/TeacherReports";
import TeacherProfile from "./pages/teacher/TeacherProfile";

// HOD pages
import HODDashboard from "./pages/hod/HODDashboard";
import HODTeachers from "./pages/hod/HODTeachers";
import HODStudents from "./pages/hod/HODStudents";
import HODReports from "./pages/hod/HODReports";
import HODSubmit from "./pages/hod/HODSubmit";
import HODProfile from "./pages/hod/HODProfile";

// Principal pages
import PrincipalDashboard from "./pages/principal/PrincipalDashboard";
import PrincipalDepartments from "./pages/principal/PrincipalDepartments";
import PrincipalHODs from "./pages/principal/PrincipalHODs";
import PrincipalReports from "./pages/principal/PrincipalReports";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (user?.role !== allowedRole) {
    return <Navigate to={`/${user?.role}`} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      
      {/* Teacher Routes */}
      <Route path="/teacher" element={<ProtectedRoute allowedRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/students" element={<ProtectedRoute allowedRole="teacher"><TeacherStudents /></ProtectedRoute>} />
      <Route path="/teacher/reports" element={<ProtectedRoute allowedRole="teacher"><TeacherReports /></ProtectedRoute>} />
      <Route path="/teacher/profile" element={<ProtectedRoute allowedRole="teacher"><TeacherProfile /></ProtectedRoute>} />
      
      {/* HOD Routes */}
      <Route path="/hod" element={<ProtectedRoute allowedRole="hod"><HODDashboard /></ProtectedRoute>} />
      <Route path="/hod/teachers" element={<ProtectedRoute allowedRole="hod"><HODTeachers /></ProtectedRoute>} />
      <Route path="/hod/students" element={<ProtectedRoute allowedRole="hod"><HODStudents /></ProtectedRoute>} />
      <Route path="/hod/reports" element={<ProtectedRoute allowedRole="hod"><HODReports /></ProtectedRoute>} />
      <Route path="/hod/submit" element={<ProtectedRoute allowedRole="hod"><HODSubmit /></ProtectedRoute>} />
      <Route path="/hod/profile" element={<ProtectedRoute allowedRole="hod"><HODProfile /></ProtectedRoute>} />
      
      {/* Principal Routes */}
      <Route path="/principal" element={<ProtectedRoute allowedRole="principal"><PrincipalDashboard /></ProtectedRoute>} />
      <Route path="/principal/departments" element={<ProtectedRoute allowedRole="principal"><PrincipalDepartments /></ProtectedRoute>} />
      <Route path="/principal/hods" element={<ProtectedRoute allowedRole="principal"><PrincipalHODs /></ProtectedRoute>} />
      <Route path="/principal/reports" element={<ProtectedRoute allowedRole="principal"><PrincipalReports /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
