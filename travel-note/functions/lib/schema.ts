export const CREATE_TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS itinerary (
    id TEXT PRIMARY KEY,
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
    "order" INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    link TEXT,
    note TEXT,
    is_checked INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS checklist (
    id TEXT PRIMARY KEY,
    "order" INTEGER NOT NULL,
    category TEXT,
    title TEXT NOT NULL,
    note TEXT,
    is_checked INTEGER NOT NULL DEFAULT 0
  )`,
]
