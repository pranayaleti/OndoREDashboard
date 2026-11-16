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
      // The caller saves this URL on the profile. The signed PUT URL expires and cannot be
      // viewed, so without a public URL there is nothing worth uploading.
      const publicUrl = presignedData.publicUrl;
      if (!publicUrl) throw new Error("Storage did not return a public URL for the picture.");

      // Upload to storage
      setUploadProgress(40);
      // The auth endpoint names the signed URL `presignedUrl`; reading `uploadUrl` sent the
      // PUT to "undefined" and reported success without uploading anything.
      const upload = await fetch(presignedData.presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!upload.ok) throw new Error(`Upload failed (${upload.status})`);

      setUploadProgress(100);
      
      toast({
        title: "Upload successful",
        description: "Profile picture uploaded successfully.",
      });

      return { success: true, url: publicUrl };
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
