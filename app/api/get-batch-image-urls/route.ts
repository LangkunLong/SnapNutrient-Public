// Improve the get-batch-image-urls endpoint for better error handling
// File: app/api/get-batch-image-urls/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const S3_BUCKET_NAME = "snapnutrient-s3";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received keys in API:", body.keys);

    if (!Array.isArray(body.keys) || body.keys.length === 0) {
      return NextResponse.json({ 
        urls: [], 
        message: "No valid keys provided" 
      }, { status: 200 }); // Return empty array instead of error
    }

    const { keys } = body;

    // Validate input
    if (!Array.isArray(keys)) {
      return NextResponse.json({ 
        urls: [], 
        message: "Keys must be provided as an array" 
      }, { status: 200 }); // Return empty array
    }

    const validKeys = keys.filter(key => typeof key === 'string' && key.trim() !== '');
    
    if (validKeys.length === 0) {
      return NextResponse.json({ 
        urls: [], 
        message: "No valid keys after filtering" 
      }, { status: 200 }); // Return empty array
    }

    if (validKeys.length > 100) {
      validKeys.length = 100; // Limit to 100 keys
    }

    // Sanitize the keys (remove 'blob:' prefix if present)
    const sanitizedKeys = validKeys.map((key) => {
      // First, remove the 'blob:' prefix
      key = key.replace('blob:', '');
      
      // Then, remove the 'http://localhost:3000/' part if it exists
      return key.startsWith('http://localhost:3000/') 
        ? key.replace('http://localhost:3000/', '') 
        : key;
    });

    // Process all presigned URL generations concurrently
    const urlPromises = sanitizedKeys.map(async (key) => {
      try {
        const command = new GetObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key,
        });

        // Generate presigned URL with 24 hour expiration for better caching
        const url = await getSignedUrl(s3Client, command, { expiresIn: 86400 });
        return { key, url };
      } catch (error) {
        console.error(`Error generating presigned URL for key ${key}:`, error);
        return { key, url: null }; // Return null for failed URLs
      }
    });

    // Wait for all presigned URLs to be generated
    const results = await Promise.all(urlPromises);
    console.log("Generated Presigned URLs:", results);

    // Filter out any failed URL generations
    const urls = results.filter((result) => result.url !== null);

    return NextResponse.json({ urls }, { status: 200 });
  } catch (error) {
    console.error('Error processing batch URL generation:', error);
    return NextResponse.json({ 
      urls: [],
      error: 'Failed to generate presigned URLs' 
    }, { status: 200 });  // Return empty array instead of error status
  }
}