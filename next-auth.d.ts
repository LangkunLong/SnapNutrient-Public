// types/next-auth.d.ts - Create this file in your project root

import 'next-auth';
import { DefaultSession } from 'next-auth';

// Define the profile type based on your database schema
interface UserProfile {
  Gender?: string;
  Weight?: number;
  Height?: number;
  ActivityLevel?: string;
  Goals?: string;
  // Add any other profile fields you have
}

declare module 'next-auth' {
  interface Session {
    user: {
      isNewUser?: boolean;
      profile?: UserProfile;
    } & DefaultSession['user']
  }

  interface User {
    isNewUser?: boolean;
    profile?: UserProfile;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    isNewUser?: boolean;
    profile?: UserProfile;
  }
}