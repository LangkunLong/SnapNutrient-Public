/* eslint-disable @typescript-eslint/no-explicit-any */
// 
import { NextResponse } from "next/server";
import { generateWeeklyNutritionInsights } from "@/lib/openai";

export const maxDuration = 300; // Set max duration to 5 minutes
export const dynamic = "force-dynamic"; // Disable static optimization

export async function POST(req: Request) {
    console.log("Received analyze-nutrients request");

    try {
        // Ensure request can be parsed
        let body;
        try {
            body = await req.json();
        } catch (e) {
            console.error("Error parsing request body:", e);
            return NextResponse.json(
                { error: "Invalid request format" },
                { status: 400 }
            );
        }

        const { nutrients } = body;

        // Prevent empty API calls
        if (!nutrients || nutrients.length === 0) {
            console.error("No nutrient data provided");
            return NextResponse.json(
                { error: "No nutrient data provided" },
                { status: 400 }
            );
        }

        try {
            console.log("Calling OpenAI for nutrient analysis...");
            const rawResult = await generateWeeklyNutritionInsights(nutrients);
            console.log("OpenAI response received:", JSON.stringify(rawResult, null, 2));

            // Ensure OpenAI always returns structured data
            const structuredResult = parseAIResponse(rawResult);
            return NextResponse.json(structuredResult);

        } catch (openaiError: any) {
            console.error("OpenAI API error:", {
                message: openaiError.message,
                status: openaiError.status,
                stack: openaiError.stack,
            });

            if (openaiError.status === 429) {
                return NextResponse.json(
                    { error: "Rate limit exceeded. Please try again later." },
                    { status: 429 }
                );
            }

            if (openaiError.message?.includes("billing")) {
                return NextResponse.json(
                    { error: "API billing error" },
                    { status: 402 }
                );
            }

            return NextResponse.json(
                { error: "Failed to analyze nutrients with AI service", details: openaiError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Unexpected error:", {
            message: error.message,
            stack: error.stack,
        });

        return NextResponse.json(
            { error: "An unexpected error occurred", details: error.message },
            { status: 500 }
        );
    }
}

const parseAIResponse = (rawResponse: any) => {
    const defaultFormat = {
        recommendations: {
            calories: "No data available.",
            protein: "No data available.",
            carbohydrates: "No data available.",
            fat: "No data available.",
            fiber: "No data available.",
            sugar: "No data available.",
            sodium: "No data available."
        }
    };

    try {
        // Ensure the response follows the expected format
        if (!rawResponse || !rawResponse.response?.recommendations) {
            console.warn("Unexpected AI response format. Using fallback.");
            return defaultFormat;
        }

        const recommendations = rawResponse.response.recommendations;

        // Ensure all keys exist
        return {
            recommendations: {
                calories: recommendations.calories || defaultFormat.recommendations.calories,
                protein: recommendations.protein || defaultFormat.recommendations.protein,
                carbohydrates: recommendations.carbohydrates || defaultFormat.recommendations.carbohydrates,
                fat: recommendations.fat || defaultFormat.recommendations.fat,
                fiber: recommendations.fiber || defaultFormat.recommendations.fiber,
                sugar: recommendations.sugar || defaultFormat.recommendations.sugar,
                sodium: recommendations.sodium || defaultFormat.recommendations.sodium,
            }
        };
    } catch (error) {
        console.error("Error parsing AI response:", error);
        return defaultFormat;
    }
};
