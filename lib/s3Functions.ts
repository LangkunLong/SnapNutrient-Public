import {s3Client} from './aws_client';

import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';

const S3_BUCKET_NAME="snapnutrient"
// lib/s3Functions.ts

export async function generatePresignedUrl(fileType: string, folder: string) {
    const fileKey = `${folder}/${uuidv4()}${fileType.startsWith('.') ? fileType : '.' + fileType}`;
    
    // Map file extension to MIME type
    const mimeType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    }[fileType.toLowerCase()] || 'application/octet-stream';
  
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: mimeType,
    });
    console.log(command)
    try {
      const signedUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 3600,
      });
      return {
        url: signedUrl,
        key: fileKey
      };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw error;
    }
}
export async function generateSignedGetUrl(key: string) {
try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    console.log("Get image: ", key)
    const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // URL expires in 1 hour
    });
    console.log("Get image success: ", signedUrl)
    return signedUrl;
} catch (error) {
    console.error('Error generating signed GET URL:', error);
    throw error;
}
}