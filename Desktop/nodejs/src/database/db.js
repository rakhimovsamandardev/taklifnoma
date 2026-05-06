import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db;

export function initDb() {
  const dbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const migrationPath = path.join(__dirname, 'migrations', 'init.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  db.exec(sql);
  log.info({ dbPath }, 'database initialized');
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized; call initDb() first');
  }
  return db;
}
