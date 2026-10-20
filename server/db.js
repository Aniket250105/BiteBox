import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFileName = process.env.DB_FILE || process.env.DATABASE_FILE || 'bitebox.db';
const dbPath = path.isAbsolute(dbFileName)
  ? dbFileName
  : path.resolve(__dirname, '..', dbFileName);
const db = new Database(dbPath);

// Enforce foreign key constraints and WAL performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export default db;
