/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { analyzeImageWithAssistant } from '@/lib/openai';

export const maxDuration = 300; // Set max duration to 5 minutes
export const dynamic = 'force-dynamic'; // Disable static optimization

export async function POST(req: Request) {
    console.log('Received analyze-image request');
    
    try {
        // Ensure request can be parsed
        let body;
        try {
            body = await req.json();
        } catch (e) {
            console.error('Error parsing request body:', e);
            return NextResponse.json(
                { error: 'Invalid request format' },
                { status: 400 }
            );
        }

        const { image } = body;
        
        if (!image) {
            console.error('No image provided in request');
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        if (typeof image !== 'string' || !image.startsWith('data:image/')) {
            console.error('Invalid image format');
            return NextResponse.json(
                { error: 'Invalid image format' },
                { status: 400 }
            );
        }

        // Log image size for debugging
        console.log('Image size (bytes):', image.length);

        try {
            console.log('Calling OpenAI assistant...');
            const result = await analyzeImageWithAssistant(image);
            console.log('OpenAI response received:', JSON.stringify(result, null, 2));

            if (!result || typeof result !== 'object') {
                throw new Error('Invalid response from OpenAI assistant');
            }

            // Normalize the assistant response to always return
            // { name: string, nutrients: { ... } }
            const raw = (result as any).response || {};
            const nutrientSource = raw.nutrients || raw;
            const normalizedResponse = {
                name: typeof raw.name === 'string' ? raw.name : '',
                nutrients: {
                    calories: Number(nutrientSource.calories) || 0,
                    protein: Number(nutrientSource.protein) || 0,
                    carbohydrates: Number(nutrientSource.carbohydrates) || 0,
                    fat: Number(nutrientSource.fat) || 0,
                    fiber: Number(nutrientSource.fiber) || 0,
                    sugar: Number(nutrientSource.sugar) || 0,
                    sodium: Number(nutrientSource.sodium) || 0,
                },
            };

            return NextResponse.json({
                ...result,
                response: normalizedResponse,
            });
            
        } catch (openaiError: any) {
            console.error('OpenAI API error:', {
                message: openaiError.message,
                status: openaiError.status,
                stack: openaiError.stack,
            });

            if (openaiError.status === 429) {
                return NextResponse.json(
                    { error: 'Rate limit exceeded. Please try again later.' },
                    { status: 429 }
                );
            }

            if (openaiError.message?.includes('billing')) {
                return NextResponse.json(
                    { error: 'API billing error' },
                    { status: 402 }
                );
            }

            return NextResponse.json(
                { 
                    error: 'Failed to analyze image with AI service',
                    details: openaiError.message 
                },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Unexpected error:', {
            message: error.message,
            stack: error.stack,
        });
        
        return NextResponse.json(
            { 
                error: 'An unexpected error occurred',
                details: error.message 
            },
            { status: 500 }
        );
    }
}