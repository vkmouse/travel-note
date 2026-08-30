export const CREATE_TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS itinerary (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    title TEXT NOT NULL,
    location TEXT,
    map_url TEXT,
    note TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    date_start TEXT,
    date_end TEXT,
    link TEXT,
    note TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS info (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    link TEXT,
    note TEXT,
    is_checked INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS checklist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    category TEXT,
    title TEXT NOT NULL,
    note TEXT,
    is_checked INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS itinerary_user_date_idx ON itinerary(user_id, date, "order")`,
  `CREATE INDEX IF NOT EXISTS documents_user_order_idx ON documents(user_id, "order")`,
  `CREATE INDEX IF NOT EXISTS info_user_order_idx ON info(user_id, "order")`,
  `CREATE INDEX IF NOT EXISTS checklist_user_order_idx ON checklist(user_id, "order")`,
]
