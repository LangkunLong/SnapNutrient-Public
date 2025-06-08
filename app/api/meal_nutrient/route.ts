/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { saveMealNutrients } from "@/lib/meal_nutrientFunctions";

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
  imageKey: string;
  createdAt?: string;
}

// Validation helper
function validateMealData(data: any): { isValid: boolean; error?: string } {
  if (!data.name || typeof data.name !== 'string') {
    return { isValid: false, error: 'Invalid meal name' };
  }

  if (!data.imageKey || typeof data.imageKey !== 'string') {
    return { isValid: false, error: 'Image key is required' };
  }

  if (!data.nutrients) {
    return { isValid: false, error: 'Nutrients data is required' };
  }

  const requiredNutrients = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar', 'sodium'];
  for (const nutrient of requiredNutrients) {
    const value = Number(data.nutrients[nutrient]);
    if (isNaN(value) || value < 0) {
      return { isValid: false, error: `Invalid ${nutrient} value` };
    }
  }

  return { isValid: true };
}

export async function POST(req: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const mealData = await req.json();

    // Validate meal data
    const validation = validateMealData(mealData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Format the data
    const formattedMealData: MealData = {
      name: mealData.name,
      imageKey: mealData.imageKey,
      nutrients: {
        calories: Number(mealData.nutrients.calories),
        protein: Number(mealData.nutrients.protein),
        carbohydrates: Number(mealData.nutrients.carbohydrates),
        fat: Number(mealData.nutrients.fat),
        fiber: Number(mealData.nutrients.fiber),
        sugar: Number(mealData.nutrients.sugar),
        sodium: Number(mealData.nutrients.sodium)
      },
      createdAt: mealData.createdAt || new Date().toISOString()
    };

    // Save to database
    const savedMeal = await saveMealNutrients({
      id: session.user.email,
      ...formattedMealData,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: savedMeal
    });

  } catch (error) {
    console.error('Error in POST /api/photo-nutrients:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'This meal has already been saved' },
          { status: 409 }
        );
      }

      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    // Generic error
    return NextResponse.json(
      { error: 'Failed to save meal' },
      { status: 500 }
    );
  }
}
