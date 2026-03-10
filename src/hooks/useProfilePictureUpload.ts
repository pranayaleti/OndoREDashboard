import { useState } from 'react';
import { authApi } from '../lib/api';
import { useToast } from './use-toast';

interface ProfileUploadOptions {
  userId: string;
}

interface ProfileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function useProfilePictureUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadProfilePicture = async (
    imageDataUrl: string,
    options: ProfileUploadOptions
  ): Promise<ProfileUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Convert data URL to blob
      const blob = await fetch(imageDataUrl).then(res => res.blob());
      const file = new File([blob], `profile-${options.userId}.jpg`, { type: 'image/jpeg' });

      // Generate presigned URL for upload using the auth endpoint
      setUploadProgress(20);
      const presignedData = await authApi.getProfilePictureUploadUrl({
        contentType: file.type,
        fileName: file.name,
      });

      // Upload to storage
      setUploadProgress(40);
      await fetch(presignedData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      setUploadProgress(100);
      
      toast({
        title: "Upload successful",
        description: "Profile picture uploaded successfully.",
      });

      return { success: true, url: presignedData.publicUrl ?? presignedData.uploadUrl };
    } catch (error: unknown) {
      console.error('Profile picture upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload profile picture. Please try again."
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadProfilePicture,
    isUploading,
    uploadProgress,
  };
}
