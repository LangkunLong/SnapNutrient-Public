// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { NextAuthOptions } from "next-auth"
import { getUser } from "@/lib/usersFunctions"
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth Credentials');
}

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !user.name) {
        return false;
      }

      try {
        // Check if user exists
        const result = await getUser(user.email);
        const exists = result && result.length > 0;
        console.log('User exists:', exists);
        
        // Set isNewUser flag
        user.isNewUser = !exists;
        
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return true; // Still allow sign in even if check fails
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        console.log("Redirect attempt:", { url, baseUrl })
        return url;
      } catch (error) {
        console.error('Error in redirect callback:', error);
        return baseUrl;
      }
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          isNewUser: token.isNewUser
        }
      };
    },
    async jwt({ token, trigger ,session }) {
      if (trigger === "signIn") {
        try {
          const result = await getUser(token.email as string);
          token.isNewUser = !(result && result.length > 0);
        } catch (error) {
          console.error('Error checking user status:', error);
          token.isNewUser = false;
        }
      }
      else if (trigger === "update" && session) {
        console.log("JWT callback - update trigger", { 
          previousTokenState: token.isNewUser,
          newSessionState: session.user.isNewUser 
        });
        token.isNewUser = session.user.isNewUser;
      }
      return token;
    },
  },
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }