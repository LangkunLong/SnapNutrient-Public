import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateUserProfileImage } from '@/lib/usersFunctions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageKey } = await request.json();
    if (!imageKey) {
      return NextResponse.json({ error: 'Image key is required' }, { status: 400 });
    }

    const result = await updateUserProfileImage(session.user.email, imageKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating profile image:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}