import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Email tidak valid').max(255),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  referralCode: z.string().optional(),
});

export const OtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP harus 6 digit').regex(/^\d+$/),
});

export const CreateServerSchema = z.object({
  name: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/, 'Hanya huruf, angka, strip, underscore'),
  ram: z.number().int().min(512).max(15360),
  nodeId: z.number().int().positive(),
  eggId: z.number().int().positive(),
  panelServerId: z.string().uuid().optional(),
});

export const BuySlotSchema = z.object({
  quantity: z.enum(['1', '3', '5']),
});

export const BuyResellerSchema = z.object({
  plan: z.enum(['RESELLER_DAILY', 'RESELLER_MONTHLY', 'RESELLER_YEARLY']),
});

export const AddPanelServerSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(100),
  panelUrl: z.string().url().regex(/^https?:\/\//),
  apiKey: z.string().min(32),
  clientKey: z.string().min(32),
  region: z.string().max(10).optional(),
  priority: z.number().int().min(1).max(999).default(99),
  minTier: z.enum(['USER', 'RESELLER']).default('USER'),
});

export const BanUserSchema = z.object({
  reason: z.string().min(5),
  durationDays: z.number().int().min(0).optional(),
  suspendServers: z.boolean().default(false),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateServerInput = z.infer<typeof CreateServerSchema>;
export type AddPanelServerInput = z.infer<typeof AddPanelServerSchema>;
