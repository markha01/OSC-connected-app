// MariaDB Database Configuration
import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool (initially without database to allow creation)
let pool = null;

async function initPool() {
  if (pool) return pool;

  // First, ensure the database exists
  const initConn = await mariadb.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectTimeout: 10000,
  });

  try {
    // Create database if it doesn't exist
    await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    console.log(`✅ Database '${process.env.DB_NAME}' is ready`);
  } finally {
    await initConn.end();
  }

  // Now create the pool with the database
  pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    acquireTimeout: 30000,
    connectTimeout: 10000,
  });

  return pool;
}

// Test connection
async function testConnection() {
  let conn;
  try {
    const p = await initPool();
    conn = await p.getConnection();
    console.log('✅ Successfully connected to MariaDB on osaas.io');
    return true;
  } catch (err) {
    console.error('❌ Error connecting to MariaDB:', err.message);
    return false;
  } finally {
    if (conn) conn.release();
  }
}

// Get a connection from the pool
async function getConnection() {
  try {
    const p = await initPool();
    return await p.getConnection();
  } catch (err) {
    console.error('Error getting database connection:', err);
    throw err;
  }
}

// Execute a query
async function query(sql, params = []) {
  let conn;
  try {
    const p = await initPool();
    conn = await p.getConnection();
    const result = await conn.query(sql, params);
    return result;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

export { pool, testConnection, getConnection, query };
export default pool;
