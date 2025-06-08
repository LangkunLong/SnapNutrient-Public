// app/api/meals/update_meal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { client } from "@/lib/aws_client";

export async function POST(req: NextRequest) {
  try {
    // Get user session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { date, name, nutrients } = body;
    
    // Log received data for debugging
    console.log("Received data:", { date, name, nutrients });

    if (!date || !name || !nutrients) {
      return NextResponse.json(
        { error: "Missing required fields", receivedData: { date, name, nutrients } },
        { status: 400 }
      );
    }

    // Update the meal in DynamoDB
    const params = {
      TableName: "SnapNutrient_Meal_Nutrient",
      Key: {
        "id": { S: session.user.email },
        "date": { S: date }
      },
      UpdateExpression: "SET #name = :name, nutrients = :nutrients",
      ExpressionAttributeNames: {
        "#name": "name"  // 'name' is a reserved word in DynamoDB
      },
      ExpressionAttributeValues: {
        ":name": { S: name },
        ":nutrients": { 
          M: {
            "calories": { N: nutrients.calories.toString() },
            "protein": { N: nutrients.protein.toString() },
            "carbohydrates": { N: nutrients.carbohydrates.toString() },
            "fat": { N: nutrients.fat.toString() },
            "fiber": { N: nutrients.fiber.toString() },
            "sugar": { N: nutrients.sugar.toString() },
            "sodium": { N: nutrients.sodium.toString() }
          }
        }
      }
    };

    const command = new UpdateItemCommand(params);
    await client.send(command);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating meal:", error);
    return NextResponse.json(
      { error: "Failed to update meal", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}