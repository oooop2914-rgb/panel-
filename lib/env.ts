import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL:           z.string().url('DATABASE_URL harus URL yang valid'),
  NEXTAUTH_SECRET:        z.string().min(16, 'NEXTAUTH_SECRET terlalu pendek'),
  NEXTAUTH_URL:           z.string().url().optional(),
  BACKEND_URL:            z.string().url().optional().default(''),
  BACKEND_JWT_SECRET:     z.string().min(16),
  FRONTEND_SHARED_SECRET: z.string().optional().default(''),
  INTERNAL_SECRET:        z.string().optional().default(''),
  ENCRYPTION_KEY:         z.string().min(32, 'ENCRYPTION_KEY minimal 32 karakter'),
  MUSTIKAPAY_API_KEY:     z.string().optional().default(''),
  MUSTIKAPAY_BASE_URL:    z.string().optional().default('https://mustikapayment.com/api/v1'),
  RESEND_API_KEY:         z.string().optional().default(''),
  TELEGRAM_BOT_TOKEN:     z.string().optional().default(''),
  TELEGRAM_BOT_USERNAME:  z.string().optional().default('XuriNotifyBot'),
  CRON_SECRET:            z.string().optional().default(''),
  NODE_ENV:               z.enum(['development', 'test', 'production']).default('development'),
});

type EnvSchema = z.infer<typeof envSchema>;

function validateEnv(): EnvSchema {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.errors.map(e => `  ${e.path.join('.')}: ${e.message}`).join('\n');
    console.error(`\n❌ Environment variables tidak valid:\n${errors}\n`);
    if (process.env.NODE_ENV === 'production') throw new Error('Invalid environment variables');
  }
  return (result.success ? result.data : process.env) as EnvSchema;
}

export const env = validateEnv();
