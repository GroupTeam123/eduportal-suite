import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDocuments } from '@/hooks/useDocuments';
import { Upload, Trash2, FileText, Download, Save, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export default function HODProfile() {
  const { user, supabaseUser, departmentId } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile(supabaseUser?.id || null);
  const { documents, loading: docsLoading, uploadDocument, deleteDocument, getDownloadUrl } = useDocuments(supabaseUser?.id || null, departmentId);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: user?.department || '',
    phone: '',
    bio: '',
    qualification: '',
    experience: '',
    achievements: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Sync form data with profile when loaded
  useState(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      }));
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      await uploadDocument(file);
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteDocument = async (doc: typeof documents[0]) => {
    await deleteDocument(doc);
  };

  const handleDownload = async (doc: typeof documents[0]) => {
    const url = await getDownloadUrl(doc.storage_path);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile({
      full_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      bio: formData.bio,
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DashboardLayout title="About Me" subtitle="Manage your personal information and documents">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-secondary mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl font-bold text-secondary-foreground">
                {(profile?.full_name || formData.name || 'HOD').split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold">{profile?.full_name || formData.name}</h2>
            <p className="text-primary font-medium">Head of Department</p>
            <p className="text-muted-foreground">{user?.department || formData.department}</p>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Email:</span> {profile?.email || formData.email}</p>
              {formData.phone && <p><span className="text-muted-foreground">Phone:</span> {formData.phone}</p>}
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
                  value={formData.name || profile?.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || profile?.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || profile?.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={user?.department || formData.department}
                  disabled
                  className="mt-1.5 bg-muted"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || profile?.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1.5 min-h-[100px]"
                placeholder="Tell us about yourself..."
              />
            </div>

            <Button onClick={handleSaveProfile} className="mt-6" disabled={profileLoading}>
              {profileLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
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
                <Button asChild disabled={isUploading}>
                  <span>
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload Document
                  </span>
                </Button>
                <Input
                  id="doc-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </Label>
            </div>

            {docsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No documents uploaded yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Upload documents to share with the Principal.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}