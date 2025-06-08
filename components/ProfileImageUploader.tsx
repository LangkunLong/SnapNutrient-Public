import React, { useState, useEffect } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { userAPI_helper } from '@/app/lib/userAPIHelper/helperFunctions';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/store/userStore';

import Image from 'next/image';

interface ProfileImageUploaderProps {
  currentImage?: string;
  onImageChange?: (imageKey: string) => void;
}

const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({ currentImage, onImageChange }) => {
  const [previewUrl, setPreviewUrl] = useState(currentImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const { userData, setUserData } = useUserStore();
  const { toast } = useToast();
  useEffect(() => {
    async function updatePreviewImg() {
      if (userData?.profileImageUrl) {
        setPreviewUrl(userData.profileImageUrl);
        console.log('Profile image updated:', userData.profileImageUrl);
      }
    }
    updatePreviewImg();
  }, [userData]);
   // Function to fetch new signed URL

  interface HandleImageChangeEvent extends React.ChangeEvent<HTMLInputElement> {
    target: HTMLInputElement & { files: FileList };
  }

  const handleImageChange = async (event: HandleImageChangeEvent): Promise<void> => {
    const file = event.target.files[0];
    if (file) {
      try {
        setIsUploading(true);
        
        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
            setUserData((prev: typeof userData) => ({
            ...prev,
            profileImageUrl: previewUrl
            }));
        };
        reader.readAsDataURL(file);

        // Upload to S3 and update DynamoDB
        const result: { success: boolean; key: string } = await userAPI_helper.uploadProfileImage(file);
        
        if (result.success) {
          toast({
            title: "Success",
            description: "Profile image updated successfully",
          });
          console.log('Profile image uploaded:', result.key);
          if (onImageChange) {
            onImageChange(result.key);
          }
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        // Revert preview on error
        setPreviewUrl(currentImage || '');
        setUserData((prev: typeof userData) => ({
          ...prev,
          profileImageUrl: currentImage || ''
        }));
      } finally {
        setIsUploading(false);
      }
    }
  };
  interface RefreshSignedUrlResponse {
    url: string;
  }

  const refreshSignedUrl = async (imageKey: string): Promise<string | null> => {
    try {
      const response: Response = await fetch(`/api/s3_generateURL?key=${imageKey}`);
      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }
      const data: RefreshSignedUrlResponse = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error fetching signed URL:', error);
      return null;
    }
  };
  const handleImageError = async () => {
    console.log('Image failed to load, refreshing signed URL');
    if (userData?.profileImage) {
      const newUrl = await refreshSignedUrl(userData.profileImage);
      if (newUrl) {
        setPreviewUrl(newUrl);
        setUserData((prev: typeof userData) => ({
          ...prev,
          profileImageUrl: newUrl
        }));
      }
    }
  };
  return (
    <div className="relative w-24 h-24 mx-auto mb-4">
      <div className={`w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200 ${!previewUrl ? 'border-dashed' : ''}`}>
        {userData?.profileImageUrl ? (
          <Image 
            src={userData?.profileImageUrl || "/api/placeholder/96/96"} 
            alt="Profile" 
            className="w-full h-full object-cover"
            width={96}
            height={96}
            onError={handleImageError}
          />
        ) : (
          <Camera className="w-8 h-8 text-gray-400" />
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>
      
      <label 
        htmlFor="profile-image-upload" 
        className={`absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <Upload className="w-4 h-4 text-gray-600" />
      </label>
      
      <input
        id="profile-image-upload"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleImageChange}
        disabled={isUploading}
      />
    </div>
  );
};

export default ProfileImageUploader;