import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  // Define public paths that don't require authentication
  const publicPaths = [
    '/',              // Home page
    '/auth/signin',   // Sign-in page
    '/auth/error',    // Error page
    '/privacy-policy',       // Privacy policy
    '/pages/unauthorized_client/profiile_setup', // Profile setup
    '/manifest.webmanifest', // Add this line
  ];

  // Get the current pathname
  const pathname = request.nextUrl.pathname;

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || 
    pathname.startsWith('/pages/unauthorized_client/')
  );

  // Allow access to public paths without authentication
  if (isPublicPath) {
    return NextResponse.next();
  }

  // If not public path and no token, redirect to signin
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check user state
  const isNewUser = token.isNewUser === true; // Explicit check for true
  const isProfileSetup = pathname.startsWith('/pages/unauthorized_client/profiile_setup');
  const isAuthorizedPath = pathname.startsWith('/authorized_client/');

  console.log('Middleware Check:', {
    pathname,
    isNewUser,
    isProfileSetup,
    isAuthorizedPath,
    token: {
      ...token,
      // Exclude sensitive information from logs
      sub: undefined,
      email: undefined
    }
  });

  // Routing logic based on user state
  if (isNewUser) {
    // New users should only access profile setup
    if (!isProfileSetup) {
      console.log('Redirecting new user to profile setup');
      return NextResponse.redirect(new URL('/pages/unauthorized_client/profiile_setup', request.url));
    }
  } else {
    // Existing users shouldn't access profile setup
    if (isProfileSetup) {
      console.log('Redirecting existing user to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Check if trying to access authorized routes
  if (isAuthorizedPath && isNewUser) {
    console.log('Preventing new user from accessing authorized routes');
    return NextResponse.redirect(new URL('/pages/unauthorized_client/profiile_setup', request.url));
  }

  return NextResponse.next();
}

// Update the matcher to be more specific
export const config = {
  matcher: [
    // Match all paths except:
    '/((?!api|_next/static|_next/image|favicon.ico|public|assets).*)',
    // Include specific paths you want to protect:
    '/profile_setup',
    '/authorized_client/:path*',
  ]
};