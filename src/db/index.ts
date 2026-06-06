import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/vendorbridge';

// Disable pre-prepared statements because we want to be safe with connection poolers like PgBouncer
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
