import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db = null;

export function getDb() {
  if (db) return db;

  const isRailway = Boolean(process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_ENVIRONMENT);
  const defaultDbPath = isRailway ? '/data/agents.db' : './data/agents.db';
  const dbPath = process.env.DATABASE_PATH || defaultDbPath;
  const resolvedDbPath = path.resolve(dbPath);
  const dir = path.dirname(resolvedDbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(resolvedDbPath);
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
