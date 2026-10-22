import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60; // 30 days

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'mockshikhar_super_secret_jwt_key_2026_dev',
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: THIRTY_DAYS_SECONDS,
    updateAge: 24 * 60 * 60, // Refresh session token once every 24 hours of active use
  },
  jwt: {
    maxAge: THIRTY_DAYS_SECONDS,
  },
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: THIRTY_DAYS_SECONDS, // Crucial: sets Max-Age attribute so mobile browsers & PWAs persist session across app restarts
      },
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid email or password');
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        // Rate limit: max 5 login attempts per 15 minutes per email
        const { success } = rateLimit(`login:${email}`, 5, 15 * 60 * 1000);
        if (!success) {
          throw new Error('Too many login attempts. Please try again in 15 minutes.');
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Block unverified users from logging in with password
        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email?.toLowerCase().trim();
        if (!email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // Link Google account to existing user if not already linked
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: 'google',
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
          }

          // Mark verified automatically for Google users
          if (!existingUser.emailVerified) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: new Date() },
            });
          }

          user.id = existingUser.id;
          (user as any).role = existingUser.role;
        } else {
          // Create new user, marked emailVerified automatically
          const newUser = await prisma.user.create({
            data: {
              name: user.name || 'User',
              email,
              emailVerified: new Date(),
              image: user.image,
              role: 'USER',
            },
          });

          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });

          user.id = newUser.id;
          (user as any).role = newUser.role;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        if (user.email) token.email = user.email;
        token.role = (user as unknown as { role?: string }).role || 'USER';
      }
      if (trigger === 'update' && session?.name) {
        token.name = session.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id || token.sub) as string;
        if (token.email) session.user.email = token.email as string;
        // @ts-expect-error role is added to custom session
        session.user.role = token.role as 'USER' | 'ADMIN';
      }
      return session;
    },
  },
});
