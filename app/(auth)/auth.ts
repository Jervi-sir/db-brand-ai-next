import { compare } from 'bcrypt-ts';
import NextAuth, { type User as NextAuthUser, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { getUser, createUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';

export interface ExtendedUser extends NextAuthUser {
  role?: string;
}

interface ExtendedSession extends Session {
  user: ExtendedUser;
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          redirect_uri: process.env.AUTH_TRUST_HOST + '/api/auth/callback/google'
        },
  
      }
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        try {
          const users = await getUser(email);
          if (users.length === 0) return null;
          const user = users[0];
          const passwordsMatch = await compare(password, user.password || '');
          if (!passwordsMatch) return null;
          return {
            id: user.id.toString(),
            email: user.email,
            role: user.role || 'user',
          } as ExtendedUser;
        } catch (error) {
          console.error('Credentials authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' && user.email) {
          const existingUsers = await getUser(user.email);
          if (existingUsers.length === 0) {
            await createUser(user.email, null);
          }
          return true;
        }
        return true;
      } catch (error) {
        console.error('signIn callback error:', error);
        return `/login?error=CallbackError`;
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.role = (user as ExtendedUser).role || 'user';
        }
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token }: { session: ExtendedSession; token: any }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          const dbUsers = await getUser(session.user.email || '');
          if (dbUsers.length > 0) {
            const dbUser = dbUsers[0];
            session.user.id = dbUser.id as string;
            session.user.role = dbUser.role || token.role || 'user';
          }
        }
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
    },
  },
  pages: {
    error: '/login',
  },
});