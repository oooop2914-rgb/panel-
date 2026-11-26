import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import { query } from './db';
import { verify } from '@node-rs/argon2';
import type { UserTier } from '@/types/next-auth';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const { rows } = await query<{
          id: string; email: string; name: string | null;
          password_hash: string | null; tier: UserTier;
          is_banned: boolean; email_verified: Date | null;
        }>(
          `SELECT id, email, name, password_hash, tier, is_banned, email_verified
           FROM users WHERE email_normalized = $1`,
          [email]
        );

        const user = rows[0];
        if (!user || !user.password_hash) return null;
        if (user.is_banned) throw new Error('ACCOUNT_BANNED');

        const valid = await verify(user.password_hash, password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
        };
      },
    }),
  ],
  pages: { signIn: '/login', error: '/login' },
  callbacks: {

    async signIn({ user, account }) {
      if (account?.provider === 'github' && user.email) {
        const email = user.email.toLowerCase().trim();
        const { rows } = await query<{ id: string; is_banned: boolean }>(
          'SELECT id, is_banned FROM users WHERE email_normalized = $1', [email]
        );
        if (rows[0]?.is_banned) return false;
        if (rows.length === 0) {
          const code = 'GH-' + Math.random().toString(36).slice(2, 8).toUpperCase();
          await query(
            `INSERT INTO users (email, email_normalized, name, tier, email_verified, referral_code, created_at, updated_at)
             VALUES ($1, $2, $3, 'USER', NOW(), $4, NOW(), NOW())`,
            [email, email, user.name ?? email.split('@')[0], code]
          );
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = user.tier as UserTier;
      } else if (token.id) {
        try {
          const { rows } = await query<{ tier: UserTier }>(
            'SELECT tier FROM users WHERE id=$1',
            [token.id as string]
          );
          if (rows[0]) token.tier = rows[0].tier;
        } catch {
          // ignore refresh error
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.tier = token.tier as UserTier;
      return session;
    },
  },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
});
