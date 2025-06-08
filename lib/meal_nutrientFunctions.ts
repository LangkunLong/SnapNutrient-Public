import { client } from './aws_client';
import { PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";

const PHOTO_NUTRIENT_TABLE = "SnapNutrient_Meal_Nutrient";

export interface MealNutrients {
  id: string;
  imageKey: string;
  name: string;
  nutrients: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  userId?: string;
  createdAt?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export async function saveMealNutrients(data: MealNutrients) {
  const now = new Date().toISOString();

  if (!data.id || !data.imageKey || !data.name || !data.nutrients) {
    throw new Error("Missing required fields");
  }

  // Validate all nutrient values are numbers
  const nutrientFields: (keyof MealNutrients['nutrients'])[] = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar', 'sodium'];
  for (const field of nutrientFields) {
    if (typeof data.nutrients[field] !== 'number' || isNaN(data.nutrients[field])) {
      throw new Error(`Invalid ${field} value: must be a number`);
    }
  }

  const params = {
    TableName: PHOTO_NUTRIENT_TABLE,
    Item: {
      "id": { S: data.id },
      "imageKey": { S: data.imageKey },
      "name": { S: data.name },
      "nutrients": { 
        M: {
          "calories": { N: data.nutrients.calories.toString() },
          "protein": { N: data.nutrients.protein.toString() },
          "carbohydrates": { N: data.nutrients.carbohydrates.toString() },
          "fat": { N: data.nutrients.fat.toString() },
          "fiber": { N: data.nutrients.fiber.toString() },
          "sugar": { N: data.nutrients.sugar.toString() },
          "sodium": { N: data.nutrients.sodium.toString() }
        }
      },
      "date": { S: data.createdAt || now }
    }
  };

  try {
    console.log("Saving photo nutrients:", params);
    const command = new PutItemCommand(params);
    const result = await client.send(command);
    console.log("Photo nutrients saved successfully:", result);
    return result;
  } catch (error) {
    console.error("Error saving photo nutrients:", error);
    throw error;
  }
}

// Get single photo nutrient record by ID
export async function getPhotoNutrient(id: string) {
  const params = {
    TableName: PHOTO_NUTRIENT_TABLE,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': { S: id },
    },
  };

  try {
    const command = new QueryCommand(params);
    const result = await client.send(command);
    
    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return convertDynamoDBToRegular(result.Items[0]);
  } catch (error) {
    console.error("Error getting photo nutrient:", error);
    throw error;
  }
}

// Get user's photo nutrients for a specific date range
export async function getUserPhotoNutrients(
  userId: string,
  dateRange: DateRange
) {
  const params = {
    TableName: PHOTO_NUTRIENT_TABLE,
    IndexName: "userId-createdAt-index",
    KeyConditionExpression: 'userId = :userId AND createdAt BETWEEN :startDate AND :endDate',
    ExpressionAttributeValues: {
      ':userId': { S: userId },
      ':startDate': { S: dateRange.startDate },
      ':endDate': { S: dateRange.endDate }
    },
    ScanIndexForward: false // Return results in descending order (newest first)
  };

  try {
    const command = new QueryCommand(params);
    const result = await client.send(command);
    
    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map(convertDynamoDBToRegular);
  } catch (error) {
    console.error("Error getting user photo nutrients:", error);
    throw error;
  }
}
// Helper function to convert DynamoDB format to regular JSON
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertDynamoDBToRegular(item: any): MealNutrients {
  return {
    id: item.id.S,
    imageKey: item.imageKey.S,
    name: item.name.S,
    nutrients: {
      calories: parseInt(item.nutrients.M.calories.N),
      protein: parseFloat(item.nutrients.M.protein.N),
      carbohydrates: parseFloat(item.nutrients.M.carbohydrates.N),
      fat: parseFloat(item.nutrients.M.fat.N),
      fiber: parseFloat(item.nutrients.M.fiber.N),
      sugar: parseFloat(item.nutrients.M.sugar.N),
      sodium: parseInt(item.nutrients.M.sodium.N)
    },
    createdAt: item.createdAt?.S,
    userId: item.userId?.S
  };
}

// Calculate totals for a set of meals
export function calculateDailyTotals(meals: MealNutrients[]) {
  return meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.nutrients.calories,
    protein: acc.protein + meal.nutrients.protein,
    carbohydrates: acc.carbohydrates + meal.nutrients.carbohydrates,
    fat: acc.fat + meal.nutrients.fat,
    fiber: acc.fiber + meal.nutrients.fiber,
    sugar: acc.sugar + meal.nutrients.sugar,
    sodium: acc.sodium + meal.nutrients.sodium
  }), {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });
}

// Calculate averages per meal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateMealAverages(totals: any, mealCount: number) {
  if (mealCount === 0) return totals;

  return {
    calories: Math.round(totals.calories / mealCount),
    protein: Number((totals.protein / mealCount).toFixed(1)),
    carbohydrates: Number((totals.carbohydrates / mealCount).toFixed(1)),
    fat: Number((totals.fat / mealCount).toFixed(1)),
    fiber: Number((totals.fiber / mealCount).toFixed(1)),
    sugar: Number((totals.sugar / mealCount).toFixed(1)),
    sodium: Math.round(totals.sodium / mealCount)
  };
}