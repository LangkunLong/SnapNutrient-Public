// store/userStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
export enum ActivityLevel {
    SEDENTARY = 'SEDENTARY',
    LIGHTLY_ACTIVE = 'LIGHTLY_ACTIVE',
    MODERATELY_ACTIVE = 'MODERATELY_ACTIVE',
    VERY_ACTIVE = 'VERY_ACTIVE',
    SUPER_ACTIVE = 'SUPER_ACTIVE'
}

// Add these validation constants at the top
export const VALIDATION = {
MIN_WEIGHT: 30, // kg
MAX_WEIGHT: 300,
MIN_HEIGHT: 100, // cm
MAX_HEIGHT: 250,
DEFAULT_AGE: 30
};

export enum Goal {
LOSE_WEIGHT = 'LOSE_WEIGHT',
GAIN_MUSCLE = 'GAIN_MUSCLE',
MAINTAIN_WEIGHT = 'MAINTAIN_WEIGHT',
ATHLETIC_PERFORMANCE = 'ATHLETIC_PERFORMANCE'
}

interface UserState {
  userData: {
    id: string;
    name: string;
    gender: string;
    weight: number;
    height: number;
    age: number;
    activityLevel: string;
    goal: string;
    createdAt: string;
    updatedAt: string;
    BMR?: number;
    TDEE?: number;
    ProteinNeeds?: number;
    AdjustedCalories?: number;
    profileImage?: string; // S3 key
    profileImageUrl?: string; // S3 signed URL
  } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setUserData: (data: any) => void;
  clearUserData: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userData: null,
      setUserData: (data) => set({ userData: data }),
      clearUserData: () => set({ userData: null }),
    }),
    {
      name: 'user-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Convert DynamoDB format to regular object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertDynamoDBToRegular(dynamoDBItem: any) {
  if (!dynamoDBItem) return null;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const regular: any = {};
  
  Object.keys(dynamoDBItem).forEach(key => {
    const item = dynamoDBItem[key];
    // Handle different DynamoDB types
    if (item.S !== undefined) regular[key] = item.S;
    if (item.N !== undefined) regular[key] = Number(item.N);
    if (item.SS !== undefined) regular[key] = item.SS;
    // Add more type conversions as needed
  });
  
  return regular;
}