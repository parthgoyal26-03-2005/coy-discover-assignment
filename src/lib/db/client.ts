import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const globalDb = globalThis as unknown as { coyPool?: Pool };
export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Copy .env.example to .env.local, then run db:local, db:migrate and db:seed.');
  globalDb.coyPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 8000 });
  return drizzle(globalDb.coyPool, { schema });
}
