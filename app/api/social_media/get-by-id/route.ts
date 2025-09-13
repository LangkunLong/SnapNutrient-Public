import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/usersFunctions';
import { generateSignedGetUrl } from '@/lib/s3Functions';

export const dynamic = 'force-dynamic';


// The HTTP method function is automatically called when corresponding type of request is made to this endpoint
// if don't have the async and await, it will not wait for the asynchronous operations to the complete and directly returns
// it's like serving a meal with only plate and chef is still cooking
// The returned Promise(object to represent the eventual completion (or failure) of an asynchronous operation and its resulting value.) 
// will be incomplete and will be like [[PromiseState]]: "pending", [[PromiseResult]]: undefined
export async function GET(request: NextRequest) {
  try {
    // Get userId from query parameter
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    // Get user data from DynamoDB
    const userProfile = await getUser(userId);
    
    // If user not found
    if (!userProfile || userProfile.length === 0) {
      return NextResponse.json([]);
    }
    
    // If user has a profile image, get a signed URL
    if (userProfile[0]?.profileImage?.S) {
      try {
        const signedUrl = await generateSignedGetUrl(userProfile[0].profileImage.S);
        // Add the signed URL to the user profile
        userProfile[0] = {
          ...userProfile[0],
          profileImageUrl: { S: signedUrl }
        };
      } catch (error) {
        console.error('Error generating profile image URL:', error);
        // Don't fail the whole request if image URL generation fails
      }
    }
    
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}