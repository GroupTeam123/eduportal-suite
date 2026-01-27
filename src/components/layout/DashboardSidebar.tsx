import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  BarChart3,
  Upload,
  User,
  LogOut,
  GraduationCap,
  Building2,
  FolderOpen,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  showBadge?: boolean;
}

const teacherNav: NavItem[] = [
  { label: 'Dashboard', icon: BarChart3, path: '/teacher' },
  { label: 'Students', icon: Users, path: '/teacher/students' },
  { label: 'Reports', icon: FileText, path: '/teacher/reports' },
  { label: 'About Me', icon: User, path: '/teacher/profile' },
];

const hodNav: NavItem[] = [
  { label: 'Dashboard', icon: BarChart3, path: '/hod' },
  { label: 'Teachers', icon: GraduationCap, path: '/hod/teachers' },
  { label: 'Students', icon: Users, path: '/hod/students' },
  { label: 'Reports', icon: FileText, path: '/hod/reports', showBadge: true },
  { label: 'Submit Report', icon: Send, path: '/hod/submit' },
  { label: 'About Me', icon: User, path: '/hod/profile' },
];

const principalNav: NavItem[] = [
  { label: 'Dashboard', icon: BarChart3, path: '/principal' },
  { label: 'Departments', icon: Building2, path: '/principal/departments' },
  { label: 'HOD Data', icon: GraduationCap, path: '/principal/hods' },
  { label: 'Teacher Data', icon: Users, path: '/principal/teachers' },
  { label: 'Reports', icon: FolderOpen, path: '/principal/reports', showBadge: true },
];

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [newReportsCount, setNewReportsCount] = useState(0);

  const navItems = user?.role === 'teacher' 
    ? teacherNav 
    : user?.role === 'hod' 
    ? hodNav 
    : principalNav;

  // Fetch new reports count for HOD and Principal
  useEffect(() => {
    if (!user || user.role === 'teacher') return;

    const fetchNewReportsCount = async () => {
      try {
        if (user.role === 'hod') {
          // For HOD: count reports with status 'submitted_to_hod' in their department
          const { data: dept } = await supabase
            .from('departments')
            .select('id')
            .eq('hod_user_id', user.id)
            .single();

          if (dept) {
            const { count } = await supabase
              .from('reports')
              .select('*', { count: 'exact', head: true })
              .eq('department_id', dept.id)
              .eq('status', 'submitted_to_hod');
            
            setNewReportsCount(count || 0);
          }
        } else if (user.role === 'principal') {
          // For Principal: count reports with status 'submitted_to_principal'
          const { count } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'submitted_to_principal');
          
          setNewReportsCount(count || 0);
        }
      } catch (error) {
        console.error('Error fetching new reports count:', error);
      }
    };

    fetchNewReportsCount();

    // Set up realtime subscription for reports changes
    const channel = supabase
      .channel('reports-count-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchNewReportsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always navigate to home page after logout attempt
      navigate('/', { replace: true });
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sidebar-foreground text-lg">EduPortal</h1>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role} Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'nav-link w-full',
              location.pathname === item.path && 'active'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.showBadge && newReportsCount > 0 && (
              <Badge variant="destructive" className="ml-auto text-xs px-2 py-0.5">
                {newReportsCount}
              </Badge>
            )}
          </button>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-foreground">
              {user?.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.department || 'Institute'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-link w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
