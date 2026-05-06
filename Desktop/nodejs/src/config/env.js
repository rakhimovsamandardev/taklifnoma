import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  BOT_TOKEN: z.string().min(30, 'BOT_TOKEN is required'),
  DATABASE_PATH: z.string().default('./data/bot.sqlite'),
  LOG_LEVEL: z.enum(['silent', 'error', 'warn', 'info', 'debug']).default('info'),
  ADMIN_ID: z.string().optional(),
  ADMIN_GROUP_ID: z.string().optional(),
  ADMIN_CHAT_ID: z.string().optional(),
  CHANNEL_ID: z.string().optional()
});

export const env = envSchema.parse({
  BOT_TOKEN: process.env.BOT_TOKEN,
  DATABASE_PATH: process.env.DATABASE_PATH,
  LOG_LEVEL: process.env.LOG_LEVEL,
  ADMIN_ID: process.env.ADMIN_ID,
  ADMIN_GROUP_ID: process.env.ADMIN_GROUP_ID,
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID,
  CHANNEL_ID: process.env.CHANNEL_ID
});
