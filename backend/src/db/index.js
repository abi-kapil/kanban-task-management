// Database connection pool and utility helpers.
// All controllers import `query` from here — never open raw connections elsewhere.

import pg from 'pg';
import {readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// ESM doesn't expose __dirname natively, so we derive it from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connection pool — reuses DB connections instead of opening a new one per query.
// SSL is required for hosted Postgres (e.g. Railway, Supabase) in production.
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// If a pooled connection unexpectedly errors, log it and exit so the process restarts cleanly.
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Reads schema.sql and runs it against the database on server startup.
// Uses IF NOT EXISTS so it is safe to call repeatedly without recreating tables.
export async function initDB() {
    const client = await pool.connect();
    try {
        const sql = readFileSync(join(__dirname, "schema.sql"), 'utf8');
        await client.query(sql);
        console.log("Database initialized successfully");
    } catch (err) {
        console.error("Database initialization error:", err);
        throw err;
    } finally {
        client.release(); // always release back to pool, even on error
    }
}

// Thin wrapper around pool.query that adds dev-mode performance logging.
// Logs the first 80 chars of the query, execution time, and affected row count.
export async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV == "development") {
        console.log("Query executed", {text: text.slice(0, 80), duration, rows: res.rowCount });
    }
    return res;
}
