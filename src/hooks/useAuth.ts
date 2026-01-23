import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  department_id?: string;
  department_name?: string;
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer data fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setDepartmentId(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleData) {
        setRole(roleData.role as UserRole);
      }

      // Fetch department assignment if teacher
      if (roleData?.role === 'teacher') {
        const { data: assignmentData } = await supabase
          .from('teacher_assignments')
          .select('department_id')
          .eq('teacher_user_id', userId)
          .maybeSingle();
        
        if (assignmentData) {
          setDepartmentId(assignmentData.department_id);
        }
      }

      // Fetch HOD's department
      if (roleData?.role === 'hod') {
        const { data: deptData } = await supabase
          .from('departments')
          .select('id')
          .eq('hod_user_id', userId)
          .maybeSingle();
        
        if (deptData) {
          setDepartmentId(deptData.id);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, selectedRole: UserRole, selectedDepartmentId?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: selectedRole,
          department_id: selectedDepartmentId,
        }
      }
    });

    if (error) throw error;

    // If user is created, create profile and assign role via edge function
    if (data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        full_name: fullName,
        email: email,
      });

      // Assign role via edge function
      await supabase.functions.invoke('assign-role', {
        body: {
          user_id: data.user.id,
          role: selectedRole,
          department_id: selectedDepartmentId,
        }
      });
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setRole(null);
    setDepartmentId(null);
  };

  return {
    user,
    session,
    profile,
    role,
    departmentId,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!session,
  };
}
