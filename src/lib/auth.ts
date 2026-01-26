import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          throw new Error('No account found with this email');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          companyName: user.companyName,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionTier: user.subscriptionTier,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.companyName = user.companyName;
        token.subscriptionStatus = user.subscriptionStatus;
        token.subscriptionTier = user.subscriptionTier;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.companyName = token.companyName as string;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
        session.user.subscriptionTier = token.subscriptionTier as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface User {
    id: string;
    companyName?: string | null;
    subscriptionStatus?: string | null;
    subscriptionTier?: string | null;
  }

  interface Session {
    user: User & {
      id: string;
      companyName?: string;
      subscriptionStatus?: string;
      subscriptionTier?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    companyName?: string;
    subscriptionStatus?: string;
    subscriptionTier?: string;
  }
}
