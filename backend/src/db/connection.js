import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db = null;

export function getDb() {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || './data/agents.db';
  const resolvedDbPath = path.resolve(dbPath);
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log(`[DB] SQLite path: ${resolvedDbPath}`);

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
