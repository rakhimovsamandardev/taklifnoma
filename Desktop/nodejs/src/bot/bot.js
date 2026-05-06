import { Telegraf } from 'telegraf';
import { env } from '../config/env.js';

export function createBot() {
  return new Telegraf(env.BOT_TOKEN);
}
