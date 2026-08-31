export const CREATE_TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS travels (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date_start TEXT,
    date_end TEXT,
    "order" INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS itinerary (
    id TEXT PRIMARY KEY,
    travel_id TEXT NOT NULL,
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
    travel_id TEXT NOT NULL,
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
    travel_id TEXT NOT NULL,
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
    travel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    category TEXT,
    title TEXT NOT NULL,
    note TEXT,
    is_checked INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS travel_members (
    id TEXT PRIMARY KEY,
    travel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL,
    invited_by TEXT NOT NULL,
    invited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TEXT,
    UNIQUE (travel_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS travels_user_order_idx ON travels(user_id, "order")`,
  `CREATE INDEX IF NOT EXISTS travel_members_user_status_idx ON travel_members(user_id, status)`,
  `CREATE INDEX IF NOT EXISTS itinerary_travel_date_idx ON itinerary(travel_id, date, "order")`,
  `CREATE INDEX IF NOT EXISTS documents_travel_order_idx ON documents(travel_id, "order")`,
  `CREATE INDEX IF NOT EXISTS info_travel_order_idx ON info(travel_id, "order")`,
  `CREATE INDEX IF NOT EXISTS checklist_travel_order_idx ON checklist(travel_id, "order")`,
]
