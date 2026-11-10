// config/database.js
// Conexión centralizada a PostgreSQL en Vercel (Neon / Supabase / Vercel Postgres)

import { Pool } from 'pg';

let pool;

export function getDbPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

export async function query(text, params = []) {
  const db = getDbPool();
  if (!db) {
    throw new Error('DATABASE_URL no está configurada en las variables de entorno.');
  }
  const result = await db.query(text, params);
  return result;
}
