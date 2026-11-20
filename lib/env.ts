import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Auth
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET too short'),
  NEXTAUTH_URL: z.string().url().optional(),

  // Backend
  BACKEND_URL: z.string().url('BACKEND_URL must be a valid URL').optional().default(''),
  BACKEND_JWT_SECRET: z.string().min(16),
  FRONTEND_SHARED_SECRET: z.string().optional().default(''),
  INTERNAL_SECRET: z.string().optional().default(''),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 chars'),

  // Payment
  MUSTIKAPAY_API_KEY: z.string().optional().default(''),
  MUSTIKAPAY_BASE_URL: z.string().optional().default('https://api.mustikapay.com'),
  // Notifications
  RESEND_API_KEY: z.string().optional().default(''),
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_BOT_USERNAME: z.string().optional().default('XuriNotifyBot'),

  // Cron
  CRON_SECRET: z.string().optional().default(''),

  // Runtime
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

type EnvSchema = z.infer<typeof envSchema>;

function validateEnv(): EnvSchema {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.errors.map(e => `  ${e.path.join('.')}: ${e.message}`).join('\n');
    console.error(`\n❌ Invalid environment variables:\n${errors}\n`);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables');
    }
  }
  return (result.success ? result.data : process.env) as EnvSchema;
}

export const env = validateEnv();
