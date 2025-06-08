import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { client } from "@/lib/aws_client";

export async function GET(req: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const email = session.user.email;
    
    // Get the URL object to extract query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Base query parameters
    const params: {
      TableName: string;
      KeyConditionExpression: string;
      ExpressionAttributeValues: {
        ":email": { S: string };
        ":startDate"?: { S: string };
        ":endDate"?: { S: string };
      };
      ExpressionAttributeNames?: {
        "#dateAttr": string;
      };
    } = {
      
      TableName: "SnapNutrient_Meal_Nutrient",
      KeyConditionExpression: "id = :email",
      ExpressionAttributeValues: {
        ":email": { S: email },
      },
    };
    // Add date filtering if both dates are provided
    if (startDate && endDate) {
      params.KeyConditionExpression += " AND #dateAttr BETWEEN :startDate AND :endDate";
      params.ExpressionAttributeValues[":startDate"] = { S: startDate };
      params.ExpressionAttributeValues[":endDate"] = { S: endDate };
      
      // Add ExpressionAttributeNames to handle the reserved keyword 'date'
      params.ExpressionAttributeNames = {
        "#dateAttr": "date"
      };
    }
    console.log("Fetching meals with params:", params);

    const command = new QueryCommand(params);
    const data = await client.send(command);

    const meals = data.Items?.map((item) => ({
      id: item.id?.S,
      date: item.date?.S,
      imageKey: item.imageKey?.S,
      name: item.name?.S,
      nutrients: item.nutrients?.M,
    }));

    return NextResponse.json(meals || []);
  } catch (error) {
    console.error("Error in GET /api/meals:", error);
    return NextResponse.json(
      { error: "Failed to fetch meals" },
      { status: 500 }
    );
  }
}