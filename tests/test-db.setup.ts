import { getTestDatabaseConfig } from './e2e/test-db.config';

function sanitizeSchemaName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

function ensureDbSchemaEnv(): void {
  if (process.env.DB_SCHEMA && process.env.DB_SCHEMA.trim()) return;

  // Prefer a per-run schema so we can safely enable dropSchema without
  // attempting to drop the built-in 'public' schema.
  const runId = process.env.GITHUB_RUN_ID ?? String(Date.now());
  const workerId = process.env.JEST_WORKER_ID ?? '1';
  const rand = Math.random().toString(36).slice(2, 8);
  process.env.DB_SCHEMA = sanitizeSchemaName(`test_${runId}_${workerId}_${rand}`);
}

beforeAll(async () => {
  // If tests are running against sqlite (default fallback), nothing to do.
  // If postgres is used, ensure we have a schema and that it exists.
  ensureDbSchemaEnv();

  const config = getTestDatabaseConfig() as any;
  if (config?.type !== 'postgres') {
    console.log('[test-db.setup] Skipping schema creation: DB type is not postgres');
    return;
  }

  const schema: string | undefined = config.schema;
  if (!schema || schema === 'public') {
    console.log('[test-db.setup] Skipping schema creation: using public schema');
    return;
  }

  // Defensive: avoid malformed schema names breaking the SQL.
  if (!/^[a-zA-Z0-9_]+$/.test(schema)) {
    throw new Error(`Invalid DB schema name: ${schema}`);
  }

  console.log(`[test-db.setup] Creating schema "${schema}" if not exists...`);

  // `pg` is a transitive dependency of TypeORM's postgres driver.
  // Jest runs this file in CJS mode, so dynamic import() may fail.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Client } = require('pg') as typeof import('pg');
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
  });

  try {
    await client.connect();
    console.log('[test-db.setup] Connected to Postgres');
    
    // Quote the identifier to avoid issues with sanitization edge cases.
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    console.log(`[test-db.setup] Schema "${schema}" created/verified successfully`);
  } catch (error) {
    console.error('[test-db.setup] FAILED to create schema:', error);
    throw error; // Re-throw to fail the test suite early
  } finally {
    await client.end();
  }
});
