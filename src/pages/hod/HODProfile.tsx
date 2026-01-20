import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mockDocuments } from '@/data/mockData';
import { Document } from '@/types';
import { Upload, Trash2, FileText, Download, Save, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function HODProfile() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>(mockDocuments.slice(0, 3));
  const [formData, setFormData] = useState({
    name: user?.name || 'Prof. Michael Chen',
    email: user?.email || 'michael.chen@institute.edu',
    department: user?.department || 'Computer Science',
    phone: '+1 (555) 234-5678',
    bio: 'Head of Computer Science Department with 15 years of academic and administrative experience. Leading research initiatives in AI and Machine Learning.',
    qualification: 'Ph.D. in Computer Science, M.Tech',
    experience: '15 years',
    achievements: 'Best Department Award 2023, Published 45+ research papers',
  });
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newDoc: Document = {
        id: String(Date.now()),
        name: file.name,
        type: file.type.split('/')[1].toUpperCase(),
        size: `${(file.size / 1024).toFixed(0)} KB`,
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: user?.name || 'Unknown',
      };
      setDocuments([newDoc, ...documents]);
      toast({
        title: 'Document Uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  const handleDeleteDocument = (doc: Document) => {
    setDocuments(documents.filter(d => d.id !== doc.id));
    toast({
      title: 'Document Deleted',
      description: `${doc.name} has been removed.`,
    });
  };

  const handleSaveProfile = () => {
    toast({
      title: 'Profile Updated',
      description: 'Your profile information has been saved.',
    });
  };

  return (
    <DashboardLayout title="About Me" subtitle="Manage your personal information and documents">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-secondary mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl font-bold text-secondary-foreground">
                {formData.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold">{formData.name}</h2>
            <p className="text-primary font-medium">Head of Department</p>
            <p className="text-muted-foreground">{formData.department}</p>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Qualification:</span> {formData.qualification}</p>
              <p><span className="text-muted-foreground">Experience:</span> {formData.experience}</p>
            </div>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1.5 min-h-[100px]"
              />
            </div>

            <div className="mt-4">
              <Label htmlFor="achievements">Key Achievements</Label>
              <Textarea
                id="achievements"
                value={formData.achievements}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <Button onClick={handleSaveProfile} className="mt-6">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </Card>

          {/* Documents */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-display text-lg font-semibold">My Documents</h3>
              </div>
              <Label htmlFor="doc-upload" className="cursor-pointer">
                <Button asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </span>
                </Button>
                <Input
                  id="doc-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </Label>
            </div>

            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.size} • {doc.uploadedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
