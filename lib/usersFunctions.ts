import {client} from './aws_client';

import { PutItemCommand, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const USER_INFO_TABLE = "SnapNutrient_Users";
/*
  TableName: USER_INFO_TABLE,
    Item: {
      "id": { S: profileData.email },  // Primary key
      "Name": { S: profileData.name },  // Attribute with capital N
      "updatedAt": { S: now },
      "createdAt": { S: now },
      "Gender": { S: profileData.gender || "" },
      "Weight": { N: profileData.weight?.toString() || "0" },
      "Height": { N: profileData.height?.toString() || "0" },
      "ActivityLevel": { S: profileData.activityLevel || "" },
      "Goal": { S: profileData.goal || "" },
      "Age": { N: profileData.age?.toString() || VALIDATION.DEFAULT_AGE.toString() },
      ...(nutritionMetrics && {
        "BMR": { N: nutritionMetrics.bmr.toString() },
        "TDEE": { N: nutritionMetrics.tdee.toString() },
        "ProteinNeeds": { N: nutritionMetrics.proteinNeeds.toString() },
        "AdjustedCalories": { N: nutritionMetrics.adjustedCalories.toString() }
      })
*/
export type UserProfile = {
  email: string;
  name: string;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  activityFactor: ActivityLevel;
  age: number;
  goal: Goal;
  createdAt: string;
  updatedAt: string;
  calculatedMetrics?: {
    bmr: number;
    tdee: number;
    proteinNeeds: number;
    adjustedCalories: number;
  };
}

export enum ActivityLevel {
  SEDENTARY = 'SEDENTARY',
  LIGHTLY_ACTIVE = 'LIGHTLY_ACTIVE',
  MODERATELY_ACTIVE = 'MODERATELY_ACTIVE',
  VERY_ACTIVE = 'VERY_ACTIVE',
  SUPER_ACTIVE = 'SUPER_ACTIVE'
}

// Add these validation constants at the top
const VALIDATION = {
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

// Activity multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHTLY_ACTIVE]: 1.375,
  [ActivityLevel.MODERATELY_ACTIVE]: 1.55,
  [ActivityLevel.VERY_ACTIVE]: 1.725,
  [ActivityLevel.SUPER_ACTIVE]: 1.9
};

// Calorie adjustments based on goals (as percentages)
const GOAL_CALORIE_ADJUSTMENTS = {
  [Goal.LOSE_WEIGHT]: -0.20, // 20% deficit
  [Goal.GAIN_MUSCLE]: 0.10,  // 10% surplus
  [Goal.MAINTAIN_WEIGHT]: 0, // No adjustment
  [Goal.ATHLETIC_PERFORMANCE]: 0.05 // 5% surplus
};

// Additional constants for nutrient recommendations
const NUTRIENT_PERCENTAGES = {
  carbs: { min: 0.45, max: 0.65 },  // 45-65% of total calories
  fats: { min: 0.20, max: 0.35 },   // 20-35% of total calories
  protein: { min: 0.10, max: 0.35 } // Already included, just for reference
};

// General dietary guidelines
const DIETARY_GUIDELINES = {
  cholesterol: 300,  // mg per day
  fiber: { male: 38, female: 25 }, // g per day
  sodium: 2300,  // mg per day
  sugar: 0.10    // Limit added sugars to 10% of total calories
};

interface NutritionMetrics {
  bmr: number;
  tdee: number;
  proteinNeeds: number;
  adjustedCalories: number;
}

export async function testDBConnection() {
  console.log("Starting DynamoDB connection test...");
  
  try {
    // Test 1: List all tables
    // console.log("\nTest 1: Scanning table");
    // const scanCommand = new ScanCommand({
    //   TableName: USER_INFO_TABLE,
    //   Limit: 1  // Just get one item to verify access
    // });
    
    // const scanResponse = await client.send(scanCommand);
    // console.log("Scan successful. Number of items:", scanResponse.Items?.length);
    // console.log("Sample data:", scanResponse.Items?.[0]);
  } catch (error) {
    console.error("DynamoDB connection test failed:", error);
  }
}

export async function addUser(profileData: {
  email?: string;
  name?: string;
  gender?: string;
  weight?: number;
  height?: number;
  age?: number;
  activityLevel?: ActivityLevel;
  goal?: Goal;
}) {
  // Log the input parameters
  const now = new Date().toISOString();

  console.log("Adding user with params:", profileData);
  if (!profileData.email || !profileData.name) {
    throw new Error("Email and name are required");
  }

  // Calculate nutrition metrics if we have all required data
  let nutritionMetrics;
  if (profileData.gender && profileData.weight && profileData.height && 
      profileData.activityLevel && profileData.goal && profileData.age) {
      nutritionMetrics = calculateNutritionMetrics(
      profileData.gender,
      profileData.age,
      profileData.weight,
      profileData.height,
      profileData.activityLevel,
      profileData.goal
    );
  }
  const params = {
    TableName: USER_INFO_TABLE,
    Item: {
      "id": { S: profileData.email },  // Primary key
      "name": { S: profileData.name },  // Attribute with capital N
      "updatedAt": { S: now },
      "createdAt": { S: now },
      "gender": { S: profileData.gender || "" },
      "weight": { N: profileData.weight?.toString() || "0" },
      "height": { N: profileData.height?.toString() || "0" },
      "activityLevel": { S: profileData.activityLevel || "" },
      "goal": { S: profileData.goal || "" },
      "age": { N: profileData.age?.toString() || VALIDATION.DEFAULT_AGE.toString() },
      ...(nutritionMetrics && {
        "BMR": { N: nutritionMetrics.bmr.toString() },
        "TDEE": { N: nutritionMetrics.tdee.toString() },
        "ProteinNeeds": { N: nutritionMetrics.proteinNeeds.toString() },
        "AdjustedCalories": { N: nutritionMetrics.adjustedCalories.toString() },
        "CarbsMin": { N: nutritionMetrics.carbsMin.toString() },
        "CarbsMax": { N: nutritionMetrics.carbsMax.toString() },
        "FatMin": { N: nutritionMetrics.fatMin.toString() },
        "FatMax": { N: nutritionMetrics.fatMax.toString() },
        "Cholesterol": { N: nutritionMetrics.cholesterol.toString() },
        "Fiber": { N: nutritionMetrics.fiber.toString() },
        "Sodium": { N: nutritionMetrics.sodium.toString() },
        "SugarMax": { N: nutritionMetrics.sugarMax.toString() }
      })
    }
  };

  try {
    const command = new PutItemCommand(params);
    const result = await client.send(command);
    console.log("User successfully added to DynamoDB:", result);
    return result;
  } catch (error) {
    console.error("Error in addUser:", error);
    throw error;
  }
}

export async function getUser(email: string) {
  const params = {
    TableName: USER_INFO_TABLE,
    KeyConditionExpression: 'id = :email',
    ExpressionAttributeValues: {
      ':email': { S: email },
    },
  };
  console.log("Getting user with params:", params);
  const command = new QueryCommand(params);
  const result = await client.send(command);
  console.log("User found:", result.Items);
  return result.Items;
}

export async function checkUserExists(email: string){
    const result = await getUser(email);
    return result && result.length > 0; // Returns true if the user exists, false otherwise
}

export async function updateUserProfile(profileData: {
  email: string;
  gender?: string;
  weight?: number;
  height?: number;
  age?: number;
  activityLevel?: ActivityLevel;
  goal?: Goal;
}) {
  const now = new Date().toISOString();

  // Calculate nutrition metrics if we have all required data
  let nutritionMetrics;
  if (
    profileData.gender &&
    profileData.weight &&
    profileData.height &&
    profileData.activityLevel &&
    profileData.goal &&
    profileData.age
  ) {
    nutritionMetrics = calculateNutritionMetrics(
      profileData.gender,
      profileData.age,
      profileData.weight,
      profileData.height,
      profileData.activityLevel,
      profileData.goal
    );
  }

  // Define update expressions and values
  const updateExpression = [
    "SET gender = :gender, weight = :weight, height = :height, activityLevel = :activityLevel, goal = :goal, updatedAt = :updatedAt, age = :age",
    nutritionMetrics ? ", BMR = :bmr, TDEE = :tdee, ProteinNeeds = :proteinNeeds, AdjustedCalories = :adjustedCalories, CarbsMin = :carbsMin, CarbsMax = :carbsMax, FatMin = :fatMin, FatMax = :fatMax, Cholesterol = :cholesterol, Fiber = :fiber, Sodium = :sodium, SugarMax = :sugarMax" : ""
  ].join("");

  const expressionAttributeValues = {
    ":gender": { S: profileData.gender || "" },
    ":weight": { N: profileData.weight?.toString() || "0" },
    ":height": { N: profileData.height?.toString() || "0" },
    ":activityLevel": { S: profileData.activityLevel || "" },
    ":goal": { S: profileData.goal || "" },
    ":updatedAt": { S: now },
    ":age": { N: profileData.age?.toString() || VALIDATION.DEFAULT_AGE.toString() },
    ...(nutritionMetrics && {
      ":bmr": { N: nutritionMetrics.bmr.toString() },
      ":tdee": { N: nutritionMetrics.tdee.toString() },
      ":proteinNeeds": { N: nutritionMetrics.proteinNeeds.toString() },
      ":adjustedCalories": { N: nutritionMetrics.adjustedCalories.toString() },
      ":carbsMin": { N: nutritionMetrics.carbsMin.toString() },
      ":carbsMax": { N: nutritionMetrics.carbsMax.toString() },
      ":fatMin": { N: nutritionMetrics.fatMin.toString() },
      ":fatMax": { N: nutritionMetrics.fatMax.toString() },
      ":cholesterol": { N: nutritionMetrics.cholesterol.toString() },
      ":fiber": { N: nutritionMetrics.fiber.toString() },
      ":sodium": { N: nutritionMetrics.sodium.toString() },
      ":sugarMax": { N: nutritionMetrics.sugarMax.toString() }
    })
  };

  const params = {
    TableName: USER_INFO_TABLE,
    Key: {
      id: { S: profileData.email }
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues
  };

  console.log("Updating user profile with params:", params);

  try {
    const command = new UpdateItemCommand(params);
    const result = await client.send(command);
    console.log("User profile updated successfully:", result);
    return result;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}
// Add this to your existing updateUserProfile function
export async function updateUserProfileImage(email: string, imageKey: string) {
  const now = new Date().toISOString();

  const params = {
    TableName: USER_INFO_TABLE,
    Key: {
      id: { S: email }
    },
    UpdateExpression: "SET profileImage = :imageKey, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":imageKey": { S: imageKey },
      ":updatedAt": { S: now }
    },
  };

  try {
    const command = new UpdateItemCommand(params);
    const result = await client.send(command);
    console.log("User profile image updated successfully:", result);
    return result;
  } catch (error) {
    console.error("Error updating profile image:", error);
    throw error;
  }
}

// ------------------ Nutrition calculations ------------------
function calculateBMR(gender: string, weight: number, height: number, age: number = 30): number {
  console.log('BMR Inputs:', { gender, weight, height, age }); // Debug log
  
  // Add input validation
  if (!weight || !height || weight <= 0 || height <= 0) {
    throw new Error(`Invalid inputs for BMR calculation: weight=${weight}, height=${height}`);
  }

  // Mifflin-St Jeor Equation
  const result = gender === 'male'
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;

  console.log('BMR Result:', result); // Debug log
  return result;
}

function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  console.log('TDEE Inputs:', { bmr, activityLevel }); // Debug log
  
  if (!bmr || bmr <= 0) {
    throw new Error(`Invalid BMR for TDEE calculation: ${bmr}`);
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  if (!multiplier) {
    throw new Error(`Invalid activity level: ${activityLevel}`);
  }

  const result = bmr * multiplier;
  console.log('TDEE Result:', result); // Debug log
  return result;
}

function calculateProteinNeeds(weight: number, goal: Goal): number {
  console.log('Protein Needs Inputs:', { weight, goal }); // Debug log
  
  if (!weight || weight <= 0) {
    throw new Error(`Invalid weight for protein calculation: ${weight}`);
  }

  // Base protein needs (in grams per kg of body weight)
  let proteinMultiplier = 0.8; // RDA minimum

  if (goal == (Goal.ATHLETIC_PERFORMANCE)) {
    proteinMultiplier = 2.0;
  } else if (goal == (Goal.GAIN_MUSCLE)) {
    proteinMultiplier = 1.8;
  } else if (goal == (Goal.LOSE_WEIGHT)) {
    proteinMultiplier = 1.6;
  }

  const result = weight * proteinMultiplier;
  console.log('Protein Needs Result:', result); // Debug log
  return result;
}

function calculateAdjustedCalories(tdee: number, goal: Goal): number {
  console.log('Adjusted Calories Inputs:', { tdee, goal}); // Debug log
  
  if (!tdee || tdee <= 0) {
    throw new Error(`Invalid TDEE for calorie adjustment: ${tdee}`);
  }

  let maxAdjustment = 0;
  const adjustment = GOAL_CALORIE_ADJUSTMENTS[goal];
  if (Math.abs(adjustment) > Math.abs(maxAdjustment)) {
    maxAdjustment = adjustment;
  }

  const result = Math.round(tdee * (1 + maxAdjustment));
  console.log('Adjusted Calories Result:', result); // Debug log
  return result;
}
// Function to calculate macronutrient grams from calories
function calculateMacronutrientGrams(calories: number, percentage: number, perGramCalorie: number): number {
  return Math.round((calories * percentage) / perGramCalorie);
}

function calculateNutritionMetrics(
  gender: string,
  age: number,
  weight: number,
  height: number,
  activityLevel: ActivityLevel,
  goal: Goal
): NutritionMetrics & { carbsMin: number; carbsMax: number; fatMin: number; fatMax: number; cholesterol: number; fiber: number; sodium: number; sugarMax: number } {
  console.log('Nutrition Metrics Inputs:', {
    gender,
    weight,
    height,
    activityLevel,
    goal
  });

  // Input validation with detailed error messages
  if (!gender || !['male', 'female'].includes(gender.toLowerCase())) {
    throw new Error(`Invalid gender: ${gender}. Must be 'male' or 'female'`);
  }

  const validationError = validateInputs(weight, height);
  if (validationError) {
    throw new Error(validationError);
  }

  if (!Object.values(ActivityLevel).includes(activityLevel)) {
    throw new Error(`Invalid activity level: ${activityLevel}`);
  }

  if (!Object.values(Goal).includes(goal)) {
    throw new Error('At least one goal must be specified');
  }


  try {
    const bmr = calculateBMR(gender.toLowerCase(), weight, height, age);
    const tdee = calculateTDEE(bmr, activityLevel);
    const proteinNeeds = calculateProteinNeeds(weight, goal);
    const adjustedCalories = calculateAdjustedCalories(tdee, goal);

      // Calculate macronutrient needs
  const carbsMin = calculateMacronutrientGrams(adjustedCalories, NUTRIENT_PERCENTAGES.carbs.min, 4);
  const carbsMax = calculateMacronutrientGrams(adjustedCalories, NUTRIENT_PERCENTAGES.carbs.max, 4);
  const fatMin = calculateMacronutrientGrams(adjustedCalories, NUTRIENT_PERCENTAGES.fats.min, 9);
  const fatMax = calculateMacronutrientGrams(adjustedCalories, NUTRIENT_PERCENTAGES.fats.max, 9);
  const sugarMax = Math.round(adjustedCalories * DIETARY_GUIDELINES.sugar / 4);  // Grams of sugar
  const cholesterol = DIETARY_GUIDELINES.cholesterol;
  const fiber = gender === 'male' ? DIETARY_GUIDELINES.fiber.male : DIETARY_GUIDELINES.fiber.female;
  const sodium = DIETARY_GUIDELINES.sodium
  
    const results = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      proteinNeeds: Math.round(proteinNeeds),
      adjustedCalories: Math.round(adjustedCalories),
      carbsMin,
      carbsMax,
      fatMin,
      fatMax,
      cholesterol,
      fiber,
      sodium,
      sugarMax
    };

    console.log('Final Nutrition Metrics:', results);

    // Final validation of results
    Object.entries(results).forEach(([key, value]) => {
      if (isNaN(value) || value <= 0) {
        throw new Error(`Invalid ${key} calculation result: ${value}`);
      }
    });

    return results;
  } catch (error) {
    console.error('Error in nutrition calculations:', error);
    throw new Error(
      `Calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function validateInputs(weight: number, height: number): string | null {
  console.log('Validating inputs:', { weight, height }); // Debug log

  if (typeof weight !== 'number' || isNaN(weight)) {
    return 'Weight must be a valid number';
  }
  if (typeof height !== 'number' || isNaN(height)) {
    return 'Height must be a valid number';
  }
  
  if (weight < VALIDATION.MIN_WEIGHT || weight > VALIDATION.MAX_WEIGHT) {
    return `Weight must be between ${VALIDATION.MIN_WEIGHT} and ${VALIDATION.MAX_WEIGHT} kg`;
  }
  if (height < VALIDATION.MIN_HEIGHT || height > VALIDATION.MAX_HEIGHT) {
    return `Height must be between ${VALIDATION.MIN_HEIGHT} and ${VALIDATION.MAX_HEIGHT} cm`;
  }
  return null;
}