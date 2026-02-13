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
  BookOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  showBadge?: boolean;
  expandable?: boolean;
  expandKey?: string;
}

const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const teacherNav: NavItem[] = [
  { label: 'Dashboard', icon: BarChart3, path: '/teacher' },
  { label: 'Students', icon: Users, path: '/teacher/students', expandable: true, expandKey: 'students' },
  { label: 'Courses', icon: BookOpen, path: '/teacher/students?tab=courses', expandable: true, expandKey: 'courses' },
  { label: 'Reports', icon: FileText, path: '/teacher/reports' },
  { label: 'Submit Report', icon: Send, path: '/teacher/submit' },
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

interface CourseInfo {
  id: string;
  name: string;
}

export function DashboardSidebar() {
  const { user, departmentId, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [newReportsCount, setNewReportsCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [courses, setCourses] = useState<CourseInfo[]>([]);

  const navItems = user?.role === 'teacher' 
    ? teacherNav 
    : user?.role === 'hod' 
    ? hodNav 
    : principalNav;

  // Fetch courses for teacher sidebar
  useEffect(() => {
    if (!user || user.role !== 'teacher') return;

    const fetchCourses = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('courses')
          .select('id, name')
          .order('created_at', { ascending: false });
        if (!error && data) setCourses(data);
      } catch (err) {
        console.error('Error fetching courses for sidebar:', err);
      }
    };

    fetchCourses();

    const channel = supabase
      .channel('sidebar-courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        fetchCourses();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
        {navItems.map((item) => {
          const isActive = item.path.includes('?')
            ? location.pathname + location.search === item.path
            : location.pathname === item.path && !location.search;
          const isExpanded = item.expandable && expandedSections[item.expandKey!];

          return (
            <div key={item.path}>
              <button
                onClick={() => {
                  if (item.expandable) {
                    toggleSection(item.expandKey!);
                  }
                  const [path, query] = item.path.split('?');
                  navigate(query ? `${path}?${query}` : path);
                }}
                className={cn(
                  'nav-link w-full',
                  isActive && 'active'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.showBadge && newReportsCount > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs px-2 py-0.5">
                    {newReportsCount}
                  </Badge>
                )}
                {item.expandable && (
                  isExpanded
                    ? <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
                    : <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
                )}
              </button>

              {/* Students sub-items: Year 1-4 */}
              {item.expandKey === 'students' && isExpanded && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {YEAR_LABELS.map((label, idx) => {
                    const yearNum = String(idx + 1);
                    const isYearActive = location.pathname === '/teacher/students' 
                      && !location.search
                      && false; // sub-items just navigate, active highlight handled by parent
                    return (
                      <button
                        key={yearNum}
                        onClick={() => {
                          navigate(`/teacher/students?year=${yearNum}`);
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                          'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                          location.search === `?year=${yearNum}` && location.pathname === '/teacher/students' && 'text-sidebar-foreground bg-sidebar-accent/50'
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sidebar-foreground/40" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Courses sub-items: existing courses + Add Course */}
              {item.expandKey === 'courses' && isExpanded && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => {
                        navigate(`/teacher/students?tab=courses&course=${course.id}`);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors truncate',
                        'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                        location.search.includes(`course=${course.id}`) && 'text-sidebar-foreground bg-sidebar-accent/50'
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sidebar-foreground/40 shrink-0" />
                      <span className="truncate">{course.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
