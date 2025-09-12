import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
});

const MEAL_ANALYSIS_ASSISTANT_ID = process.env.OPENAI_MEAL_ANALYSIS_ASSISTANT_ID!;
const MEAL_RECOMMENDATION_ASSISTANT_ID = process.env.OPENAI_MEAL_RECOMMENDATION_ASSISTANT_ID!;

type Nutrients = {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
};


// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uploadFile(base64Image: any) {
    try {
        const base64Data = base64Image.includes('base64,') 
            ? base64Image.split('base64,')[1] 
            : base64Image;

        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer]);
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

        const uploadedFile = await openai.files.create({
            file: file,
            purpose: 'assistants',
        });

        return uploadedFile.id;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function analyzeImageWithAssistant(base64Image: any) {
    let fileId = null;
    console.log('Analyzing image...');
    try {
        fileId = await uploadFile(base64Image);

        // 1. Create a new thread
        const thread = await openai.beta.threads.create();

        // 2. Add a user message (with the image + prompt)
        await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: [
            {
            type: "text",
            text: "Analyze this image and provide the results in a JSON format."
            },
            {
            type: "image_file",
            image_file: { file_id: fileId }
            }
        ]
        });

        // 3. Then create a run to trigger the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: MEAL_ANALYSIS_ASSISTANT_ID,
        });
        
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }

        if (runStatus.status === 'failed') {
            throw new Error('Assistant run failed: ' + runStatus.last_error?.message);
        }

        const messages = await openai.beta.threads.messages.list(thread.id);
        console.log('Messages received:', messages.data);
        // Find text content in the response
        const textContent = messages.data[0].content.find(
            content => content.type === 'text'
        );
        
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No text content found in response');
        }

        let jsonResponse;
        try {
            // Access the value property of the text content
            jsonResponse = JSON.parse(textContent.text.value);
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            jsonResponse = { 
                error: 'Failed to parse JSON response', 
                raw: textContent.text.value 
            };
        }

        return {
            threadId: thread.id,
            response: jsonResponse,
            status: runStatus.status
        };

    } catch (error) {
        console.error('Error in analyzeImageWithAssistant:', error);
        throw error;
    } finally {
        if (fileId) {
            try {
                await openai.files.del(fileId);
            } catch (deleteError) {
                console.error('Error deleting file:', deleteError);
            }
        }
    }
}

export async function generateWeeklyNutritionInsights(
    nutrientData: Nutrients[],
    userInfo?: { goal?: string; activityLevel?: string; exerciseHabits?: string }) {
    let threadId = null;
    console.log('Analyzing weekly nutrition data...');

    try {
        // Summarize weekly nutrient totals
        const totals = nutrientData.reduce(
            (acc: Nutrients, curr: Partial<Nutrients>) => ({
                calories: acc.calories + (curr.calories ?? 0),
                protein: acc.protein + (curr.protein ?? 0),
                carbohydrates: acc.carbohydrates + (curr.carbohydrates ?? 0),
                fat: acc.fat + (curr.fat ?? 0),
                fiber: acc.fiber + (curr.fiber ?? 0),
                sugar: acc.sugar + (curr.sugar ?? 0),
                sodium: acc.sodium + (curr.sodium ?? 0)
            }),
            { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
        );

        // Step 1: Create a Thread
        const thread = await openai.beta.threads.create();
        threadId = thread.id;

        // Compose improved prompt
        const prompt = `Provide personalized nutrient recommendations based on the user's data. Return only valid JSON in the following format:

            {
            "recommendations": {
            "calories": "string",
            "protein": "string",
            "carbohydrates": "string",
            "fat": "string",
            "fiber": "string",
            "sugar": "string",
            "sodium": "string"}
            }

            Weekly nutrient intake summary:
            ${JSON.stringify(totals, null, 2)}

            User goal: ${userInfo?.goal ?? 'not provided'}
            Activity level: ${userInfo?.activityLevel ?? 'not provided'}
            Exercise habits: ${userInfo?.exerciseHabits ?? 'not provided'}
            `;

        // Step 2: Send Message to AI Assistant
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: [
                {
                    type: "text",
                    text: prompt
                },
            ]
        });

        console.log('Thread created:', threadId);

        // Step 3: Start AI Processing
        const run = await openai.beta.threads.runs.create(threadId, { assistant_id: MEAL_RECOMMENDATION_ASSISTANT_ID });
        let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);

        // Step 4: Wait for AI Completion
        while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        }

        if (runStatus.status === 'failed') {
            throw new Error('Assistant run failed: ' + runStatus.last_error?.message);
        }

        // Step 5: Retrieve AI Response
        const messages = await openai.beta.threads.messages.list(threadId);
        console.log('Messages received:', messages.data);

        // Step 6: Extract AI Suggestions
        const textContent = messages.data[0].content.find(content => content.type === 'text');
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No text content found in response');
        }

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(textContent.text.value);
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            jsonResponse = { 
                error: 'Failed to parse JSON response', 
                raw: textContent.text.value 
            };
        }

        return {
            threadId,
            response: jsonResponse,
            status: runStatus.status
        };

    } catch (error) {
        console.error('Error in analyzeNutrientsWithAssistant:', error);
        throw error;
    }
}

export default openai;