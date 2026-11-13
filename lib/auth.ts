import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { query } from './db';
import { verify } from '@node-rs/argon2';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
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
          password_hash: string | null; tier: string;
          is_banned: boolean; email_verified: Date | null;
        }>(
          `SELECT id, email, name, password_hash, tier, is_banned, email_verified
           FROM users WHERE email_normalized = $1`,
          [email]
        );

        const user = rows[0];
        if (!user || !user.password_hash) return null;
        if (user.is_banned) throw new Error('ACCOUNT_BANNED');
        if (!user.email_verified) throw new Error('EMAIL_NOT_VERIFIED');

        const valid = await verify(user.password_hash, password);
        if (!valid) return null;

        await query('UPDATE users SET last_login_ip = $1 WHERE id = $2', [null, user.id]);

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as { tier?: string }).tier;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { tier?: string }).tier = token.tier as string;
      return session;
    },
  },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
});
