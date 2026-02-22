import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    try {
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      _db = drizzle(connection, { schema, mode: 'default' });
      console.log('[Database] Connected successfully');
    } catch (error) {
      console.error('[Database] Connection failed:', error);
      throw error;
    }
  }

  return _db;
}

export { schema };
