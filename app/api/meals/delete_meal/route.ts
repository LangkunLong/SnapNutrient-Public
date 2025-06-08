// app/api/meals/delete_meal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DeleteItemCommand } from "@aws-sdk/client-dynamodb";
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
      console.log("Delete meal request body:", body);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { date } = body;
    
    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    console.log("Deleting meal for user:", session.user.email, "with date:", date);

    // Delete the meal from DynamoDB
    const params = {
      TableName: "SnapNutrient_Meal_Nutrient",
      Key: {
        "id": { S: session.user.email },
        "date": { S: date }
      }
    };

    try {
      const command = new DeleteItemCommand(params);
      const result = await client.send(command);
      console.log("DynamoDB delete result:", result);
      return NextResponse.json({ success: true, message: "Meal deleted successfully" });
    } catch (dbError) {
      console.error("DynamoDB delete error:", dbError);
      return NextResponse.json(
        { 
          error: "Database deletion failed", 
          details: dbError instanceof Error ? dbError.message : String(dbError) 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in delete meal route:", error);
    // Always return a valid JSON response
    return NextResponse.json(
      { 
        error: "Failed to delete meal", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}