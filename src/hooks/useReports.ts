import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import { Json } from '@/integrations/supabase/types';

type ReportStatus = 'draft' | 'submitted_to_hod' | 'submitted_to_principal' | 'approved';

export interface ReportRecord {
  id: string;
  reporter_user_id: string;
  reporter_role: UserRole;
  department_id: string | null;
  submitted_to_user_id: string | null;
  title: string;
  content: string | null;
  chart_data: Json | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface NewReport {
  title: string;
  content?: string;
  chart_data?: Json;
}

export function useReports(userId: string | null, role: UserRole | null, departmentId: string | null) {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = async () => {
    if (!userId || !role) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data || []) as ReportRecord[]);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [userId, role]);

  const createReport = async (report: NewReport) => {
    if (!userId || !role) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporter_user_id: userId,
          reporter_role: role,
          department_id: departmentId,
          title: report.title,
          content: report.content,
          chart_data: report.chart_data,
          status: 'draft' as ReportStatus,
        })
        .select()
        .single();

      if (error) throw error;

      setReports(prev => [data as ReportRecord, ...prev]);
      toast({
        title: 'Report Created',
        description: 'Your report has been saved as draft.',
      });
      return data as ReportRecord;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create report';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateReport = async (id: string, updates: Partial<NewReport>) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setReports(prev => prev.map(r => r.id === id ? data as ReportRecord : r));
      toast({
        title: 'Report Updated',
        description: 'Your report has been updated.',
      });
      return data as ReportRecord;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update report';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const submitReport = async (id: string, targetRole: 'hod' | 'principal') => {
    try {
      const newStatus: ReportStatus = targetRole === 'hod' ? 'submitted_to_hod' : 'submitted_to_principal';
      
      const { data, error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setReports(prev => prev.map(r => r.id === id ? data as ReportRecord : r));
      toast({
        title: 'Report Submitted',
        description: `Report has been submitted to ${targetRole.toUpperCase()}.`,
      });
      return data as ReportRecord;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit report';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const approveReport = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({ status: 'approved' as ReportStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setReports(prev => prev.map(r => r.id === id ? data as ReportRecord : r));
      toast({
        title: 'Report Approved',
        description: 'Report has been approved.',
      });
      return data as ReportRecord;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve report';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    reports,
    loading,
    createReport,
    updateReport,
    submitReport,
    approveReport,
    refetch: fetchReports,
  };
}
