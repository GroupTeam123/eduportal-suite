import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/contexts/AuthContext';
import { Send, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TeacherSubmit() {
  const { supabaseUser, user, departmentId } = useAuth();
  const { reports, loading, submitReport, refetch } = useReports(supabaseUser?.id || null, user?.role || null, departmentId);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // Filter reports that are drafts and ready to submit to HOD
  const pendingReports = reports.filter(r => r.status === 'draft');

  const toggleReport = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSubmit = async () => {
    if (selectedReports.length === 0) {
      toast({
        title: 'Select Reports',
        description: 'Please select at least one report to submit.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit all selected reports to HOD
      for (const reportId of selectedReports) {
        await submitReport(reportId, 'hod');
      }
      setSubmitted(true);
      setSelectedReports([]);
      toast({
        title: 'Reports Submitted',
        description: `${selectedReports.length} report(s) have been sent to the HOD.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit reports. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <DashboardLayout title="Submit to HOD" subtitle="Send reports to the HOD for review">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Reports Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Your reports have been successfully sent to the HOD for review.
          </p>
          <Button onClick={() => { setSubmitted(false); refetch(); }}>Submit More Reports</Button>
        </Card>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout title="Submit to HOD" subtitle="Send reports to the HOD for review">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Submit to HOD" subtitle="Send reports to the HOD for review">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Select Reports to Submit</h3>
          
          {pendingReports.length > 0 ? (
            <>
              <div className="space-y-3 mb-6">
                {pendingReports.map((report) => (
                  <label
                    key={report.id}
                    className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedReports.includes(report.id)}
                      onCheckedChange={() => toggleReport(report.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-medium">{report.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">
                      Draft
                    </span>
                  </label>
                ))}
              </div>

              <div className="mb-6">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any comments or notes for the HOD..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 min-h-[100px]"
                />
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit to HOD ({selectedReports.length} selected)
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No draft reports available for submission.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create reports from the Reports section first.
              </p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
