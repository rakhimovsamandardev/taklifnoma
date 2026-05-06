CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  state TEXT NOT NULL DEFAULT 'IDLE',
  state_data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER NOT NULL,
  photos TEXT NOT NULL,
  rooms INTEGER NOT NULL,
  house_type TEXT NOT NULL,
  address TEXT NOT NULL,
  area REAL NOT NULL,
  total_floors INTEGER NOT NULL,
  current_floor INTEGER NOT NULL,
  condition TEXT NOT NULL,
  price REAL NOT NULL,
  phone TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);

CREATE TABLE IF NOT EXISTS processed_messages (
  chat_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  PRIMARY KEY (chat_id, message_id)
);
