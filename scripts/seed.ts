import { config } from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { profiles } from '../src/lib/db/schema';
import { profileFixtures } from '../src/data/profiles';
config({ path: '.env.local', quiet: true });
config({ quiet: true });
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env.local first.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await drizzle(pool).transaction(async tx => {
    for (const profile of profileFixtures) await tx.insert(profiles).values(profile).onConflictDoUpdate({ target: profiles.id, set: profile });
  });
  console.log(`Seeded ${profileFixtures.length} fictional profiles. Existing sessions preserved.`);
} finally { await pool.end(); }
