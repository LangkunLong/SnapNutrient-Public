// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SnapNutrient',
    short_name: 'SnapNutrient',
    description: 'AI-Powered Nutrition Tracking and Social Platform',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: 'https://snapnutrient.s3.us-east-1.amazonaws.com/undefined/SnapNutrient.png',
        sizes: '788x712',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'https://snapnutrient.s3.us-east-1.amazonaws.com/undefined/SnapNutrient-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'https://snapnutrient.s3.us-east-1.amazonaws.com/undefined/SnapNutrient-384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'https://snapnutrient.s3.us-east-1.amazonaws.com/undefined/SnapNutrient-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
    ],
    display_override: ['standalone', 'fullscreen'],
    prefer_related_applications: false,
    
    // Additional features for better app-like experience
    dir: 'ltr',
    lang: 'en',
    launch_handler: {
      client_mode: ['navigate-existing', 'auto']
    },
  }
}