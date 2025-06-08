// app/api/presigned-url/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generatePresignedUrl, generateSignedGetUrl } from '@/lib/s3Functions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileType, folder} = await request.json();
    if (!fileType) {
      return NextResponse.json({ error: 'File type is required' }, { status: 400 });
    }

    const { url, key } = await generatePresignedUrl(fileType, folder);
    return NextResponse.json({ url, key });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the key from the URL parameters
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Image key is required' }, { status: 400 });
    }

    const signedUrl = await generateSignedGetUrl(key);
    return NextResponse.json({ url: signedUrl });

  } catch (error) {
    console.error('Error generating signed GET URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}