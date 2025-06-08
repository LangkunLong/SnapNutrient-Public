export const userAPI_helper = {
  // Fetch user data from API
  fetchUser: async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user data');
      }
      const data = await response.json();
      return data && data.length > 0 ? data[0] : null; // Return null if no users found
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Create new user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createUser: async (profileData: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      const createdUser = await response.json();
      console.log('User created successfully:', createdUser);
      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateUser: async (profileData: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  
  uploadProfileImage: async (file: File) => {
    try {
      // Get file extension
      const fileExt = file.name.split('.').pop() || '';

      // Get presigned URL
      const presignedUrlResponse = await fetch('/api/s3_generateURL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileType: fileExt,
          folder: "profile-images"
        }),
      });

      if (!presignedUrlResponse.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const { url, key } = await presignedUrlResponse.json();

      // Upload to S3
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type, // Use the actual file type
        },
        mode: 'cors' // Explicitly set CORS mode
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Update user profile with new image key
      const updateResponse = await fetch('/api/users/update-profile-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageKey: key }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update user profile');
      }

      return { success: true, url, key };
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }
};