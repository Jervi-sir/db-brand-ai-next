import { compare } from 'bcrypt-ts';
import NextAuth, { type User as NextAuthUser, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

export interface ExtendedUser extends NextAuthUser {
  role?: string;
}

interface ExtendedSession extends Session {
  user: ExtendedUser;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);
        if (users.length === 0) return null;
        // biome-ignore lint: Forbidden non-null assertion.
        const user = users[0];
        const passwordsMatch = await compare(password, user.password || '');
        if (!passwordsMatch) return null;
        // return users[0] as any;
        return {
          id: user.id.toString(), // Convert to string for NextAuth
          email: user.email,
          role: user.role || 'user', // Default to 'user' if no role
        } as ExtendedUser;

      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as ExtendedUser).role || 'user'; // Pass role to token
      }
      return token;
    },
    async session({ session, token }: { session: ExtendedSession; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string; // Pass role to session

        // Optionally, fetch fresh data from the database
        const dbUsers = await getUser(session.user.email || '');
        if (dbUsers.length > 0) {
          const dbUser = dbUsers[0];
          session.user.role = dbUser.role || token.role || 'user';
        }
      }
      return session;
    },
  },
});
