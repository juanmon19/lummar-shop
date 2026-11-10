// config/database.js
// Conexión centralizada a PostgreSQL (Neon / Supabase / Vercel Marketplace)
// En Vercel cada función serverless puede reutilizar el pool entre invocaciones.

import { Pool } from 'pg';

const globalForDb = globalThis;

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDbPool() {
  if (!isDbConfigured()) {
    return null;
  }

  if (!globalForDb.__lummarPgPool) {
    const sslEnabled = process.env.DATABASE_SSL !== 'false';

    globalForDb.__lummarPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    globalForDb.__lummarPgPool.on('error', (error) => {
      console.error('[PostgreSQL] Error inesperado en el pool:', error.message);
    });
  }

  return globalForDb.__lummarPgPool;
}

export async function query(text, params = []) {
  const db = getDbPool();
  if (!db) {
    const error = new Error(
      'DATABASE_URL no está configurada. Conecta una base de datos PostgreSQL (Neon, Supabase o Vercel Marketplace).'
    );
    error.codigo = 'DB_NO_CONFIGURADA';
    throw error;
  }

  return db.query(text, params);
}

// Ejecuta SQL sin parámetros (permite varios comandos separados por ;).
export async function exec(text) {
  const db = getDbPool();
  if (!db) {
    const error = new Error('DATABASE_URL no está configurada.');
    error.codigo = 'DB_NO_CONFIGURADA';
    throw error;
  }
  return db.query(text);
}

export async function withTransaction(callback) {
  const db = getDbPool();
  if (!db) {
    const error = new Error('DATABASE_URL no está configurada.');
    error.codigo = 'DB_NO_CONFIGURADA';
    throw error;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function healthCheck() {
  if (!isDbConfigured()) {
    return { configured: false, connected: false };
  }

  try {
    const { rows } = await query('SELECT NOW() AS ahora');
    return { configured: true, connected: true, ahora: rows[0]?.ahora || null };
  } catch (error) {
    return { configured: true, connected: false, error: error.message };
  }
}
