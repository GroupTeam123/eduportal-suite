import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DocumentRecord {
  id: string;
  uploader_user_id: string;
  department_id: string | null;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  description: string | null;
  created_at: string;
}

export function useDocuments(userId: string | null, departmentId: string | null) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const uploadDocument = async (file: File, description?: string) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Upload to storage
      const filePath = `${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          uploader_user_id: userId,
          department_id: departmentId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          description,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setDocuments(prev => [data, ...prev]);
      toast({
        title: 'Document Uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload document';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteDocument = async (doc: DocumentRecord) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.storage_path]);

      if (storageError) throw storageError;

      // Delete database record
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast({
        title: 'Document Deleted',
        description: `${doc.file_name} has been removed.`,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getDownloadUrl = async (storagePath: string) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate download link',
        variant: 'destructive',
      });
      return null;
    }

    return data.signedUrl;
  };

  return {
    documents,
    loading,
    uploadDocument,
    deleteDocument,
    getDownloadUrl,
    refetch: fetchDocuments,
  };
}
