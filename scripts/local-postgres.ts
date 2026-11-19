import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
const pg = new EmbeddedPostgres({ databaseDir: './.postgres', user: 'coy', password: 'coy_local_only', port: 54329, persistent: true, initdbFlags: ['--encoding=UTF8'], postgresFlags: ['-h', '127.0.0.1'] });
if (!existsSync('./.postgres/PG_VERSION')) await pg.initialise();
await pg.start();
try { await pg.createDatabase('coy'); } catch (error) {
  if (!(error instanceof Error) || !error.message.includes('already exists')) throw error;
}
console.log('Local PostgreSQL ready on 127.0.0.1:54329. Leave this terminal open.');
let stopping = false;
async function stop() { if (!stopping) { stopping = true; await pg.stop(); process.exit(0); } }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
await new Promise(() => {});
