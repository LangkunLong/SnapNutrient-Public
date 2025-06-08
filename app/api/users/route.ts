// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addUser, getUser, updateUserProfile } from '@/lib/usersFunctions';
import { generateSignedGetUrl } from '@/lib/s3Functions';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await getUser(session.user.email);
     // If user has a profile image, get a signed URL
     if (userProfile?.[0]?.profileImage?.S) {
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newProfileData = await request.json();
    if (!newProfileData.email || !newProfileData.name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await getUser(newProfileData.email);
    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const addResult = await addUser(newProfileData);
    return NextResponse.json(addResult, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedProfileData = await request.json();
    const updateResult = await updateUserProfile(updatedProfileData);
    return NextResponse.json(updateResult);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}