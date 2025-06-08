// Types for meal data
interface MealNutrients {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  }
  
  interface MealData {
    name: string;
    nutrients: MealNutrients;
    createdAt?: string;
  }
  
  export const dietAPI_helper = {
    // Upload meal image and create record
    uploadMealImage: async (mealData: MealData, file: File) => {
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
            folder: 'meal-images'
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
            'Content-Type': file.type,
          },
          mode: 'cors'
        });
  
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to S3');
        }
  
        // Create meal record with image key
        const response = await fetch('/api/meal_nutrient', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            ...mealData,
            imageKey: key
          }),
        });
  
        if (!response.ok) {
          throw new Error('Failed to save meal data');
        }
  
        const savedMeal = await response.json();
        return { success: true, data: savedMeal, key };
      } catch (error) {
        console.error('Error in uploadMealImage:', error);
        throw error;
      }
    },
  
    base64ToFile: (base64String: string, fileName: string): File => {
      const arr = base64String.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
  
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
  
      return new File([u8arr], fileName, { type: mime });
    }
  };