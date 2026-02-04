import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDocuments } from '@/hooks/useDocuments';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Trash2, FileText, Download, Save, User, Loader2 } from 'lucide-react';

export default function TeacherProfile() {
  const { user, supabaseUser, departmentId } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile(supabaseUser?.id || null);
  const { documents, loading: docsLoading, uploadDocument, deleteDocument, getDownloadUrl } = useDocuments(supabaseUser?.id || null, departmentId);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || user?.name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    qualifications: ((profile as unknown) as Record<string, unknown>)?.qualifications as string || '',
    years_of_experience: ((profile as unknown) as Record<string, unknown>)?.years_of_experience as number | '' || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Update form when profile loads
  useState(() => {
    if (profile) {
      const profileData = (profile as unknown) as Record<string, unknown>;
      setFormData({
        full_name: profile.full_name,
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        qualifications: profileData?.qualifications as string || '',
        years_of_experience: profileData?.years_of_experience as number | '' || '',
      });
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadDocument(file, 'Personal document');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      await deleteDocument(doc);
    }
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    const url = await getDownloadUrl(storagePath);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateProfile(formData);
    setIsSaving(false);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (profileLoading) {
    return (
      <DashboardLayout title="About Me" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="About Me" subtitle="Manage your personal information and documents">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-foreground">
                {(formData.full_name || 'U').split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold">{formData.full_name || 'User'}</h2>
            <p className="text-muted-foreground">{user?.department || 'No department'}</p>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Role:</span> {user?.role || 'Teacher'}</p>
              <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
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
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                  value={user?.department || 'Not assigned'}
                  disabled
                  className="mt-1.5 bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <Input
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g., M.Tech, PhD"
                />
              </div>
              <div>
                <Label htmlFor="years_of_experience">Years of Experience</Label>
                <Input
                  id="years_of_experience"
                  type="number"
                  value={formData.years_of_experience}
                  onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value ? parseInt(e.target.value) : '' })}
                  className="mt-1.5"
                  placeholder="e.g., 5"
                  min={0}
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
                placeholder="Tell us about yourself..."
              />
            </div>

            <Button onClick={handleSaveProfile} className="mt-6" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
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

            {docsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
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
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.storage_path, doc.file_name)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No documents uploaded yet</p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
