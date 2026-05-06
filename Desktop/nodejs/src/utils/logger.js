import { env } from '../config/env.js';

const levels = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
const current = levels[env.LOG_LEVEL] ?? levels.info;

function out(level, msg, data) {
  if (levels[level] > current) return;
  const line = data !== undefined ? `${msg} ${JSON.stringify(data)}` : msg;
  const fn = level === 'error' ? console.error : console.log;
  fn(`[${level}] ${line}`);
}

export const log = {
  error: (msg, data) => out('error', msg, data),
  warn: (msg, data) => out('warn', msg, data),
  info: (msg, data) => out('info', msg, data),
  debug: (msg, data) => out('debug', msg, data)
};
