import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { mockReports } from '@/data/mockData';
import { Send, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HODSubmit() {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const approvedReports = mockReports.filter(r => r.status === 'approved' || r.status === 'submitted');

  const toggleReport = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSubmit = () => {
    if (selectedReports.length === 0) {
      toast({
        title: 'Select Reports',
        description: 'Please select at least one report to submit.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast({
        title: 'Reports Submitted',
        description: 'Selected reports have been sent to the Principal.',
      });
    }, 2000);
  };

  if (submitted) {
    return (
      <DashboardLayout title="Submit to Principal" subtitle="Send compiled reports to the Principal">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Reports Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            {selectedReports.length} report(s) have been successfully sent to the Principal for review.
          </p>
          <Button onClick={() => setSubmitted(false)}>Submit More Reports</Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Submit to Principal" subtitle="Send compiled reports to the Principal">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Select Reports to Submit</h3>
          
          <div className="space-y-3 mb-6">
            {approvedReports.map((report) => (
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
                    By {report.createdBy} • {report.createdAt}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  report.status === 'approved' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
                }`}>
                  {report.status}
                </span>
              </label>
            ))}
          </div>

          <div className="mb-6">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any comments or notes for the Principal..."
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
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit to Principal ({selectedReports.length} selected)
              </>
            )}
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
