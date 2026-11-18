import type { DefaultSession, DefaultJWT } from 'next-auth';

export type UserTier = 'USER' | 'RESELLER' | 'ADMIN' | 'SUPER_ADMIN';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      tier: UserTier;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    tier: UserTier;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    tier: UserTier;
  }
}
