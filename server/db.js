// MySQL connection pool (mysql2/promise). All SQL is parameterised — never
// interpolate values into a query string (brief §5.6).

import mysql from 'mysql2/promise';
import { DB } from './config.js';

export const pool = mysql.createPool({
  host: DB.host,
  port: DB.port,
  user: DB.user,
  password: DB.password,
  database: DB.database,
  connectionLimit: DB.connectionLimit,
  namedPlaceholders: true,
  charset: 'utf8mb4',
});

// Returns true if the database answers a trivial query.
export async function ping() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    return rows?.[0]?.ok === 1;
  } catch {
    return false;
  }
}
