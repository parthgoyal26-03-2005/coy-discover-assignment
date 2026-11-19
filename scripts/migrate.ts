import { config } from 'dotenv';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
config({ path: '.env.local', quiet: true });
config({ quiet: true });
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env.local. See .env.example.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(782416)');
  await client.query('CREATE TABLE IF NOT EXISTS coy_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const name = '0001_initial';
  if (!(await client.query('SELECT 1 FROM coy_migrations WHERE name=$1', [name])).rowCount) {
    await client.query(await readFile('src/lib/db/migrations/0001_initial.sql', 'utf8'));
    await client.query('INSERT INTO coy_migrations(name) VALUES ($1)', [name]);
  }
  await client.query('COMMIT');
  console.log('Database migrations applied.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
