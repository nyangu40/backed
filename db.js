const mysql = require('mysql2');
require('dotenv').config();

// =========================
// 1. Parse DATABASE_URL if provided
// =========================
let dbConfig = {};
if (process.env.DATABASE_URL) {
  try {
    const u = new URL(process.env.DATABASE_URL);

    dbConfig.host = u.hostname;
    dbConfig.user = decodeURIComponent(u.username);
    dbConfig.password = decodeURIComponent(u.password);
    dbConfig.database = u.pathname ? u.pathname.replace(/^\//, '') : process.env.MYSQLDATABASE;

    if (u.port) dbConfig.port = Number(u.port);
  } catch (e) {
    console.warn('Invalid DATABASE_URL. Falling back to Railway variables.');
  }
}

// =========================
// 2. Create MySQL pool using Railway env variables
// =========================
const pool = mysql.createPool({
  host: dbConfig.host || process.env.MYSQLHOST || 'localhost',
  user: dbConfig.user || process.env.MYSQLUSER || 'root',
  password: dbConfig.password || process.env.MYSQLPASSWORD || '',
  database: dbConfig.database || process.env.MYSQLDATABASE || 'bus_booking',
  port: dbConfig.port || process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
});

// =========================
// 3. Internal connection test (shows in Railway logs)
// =========================
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message || err);
  } else {
    connection.query('SELECT 1', (qErr) => {
      if (qErr) {
        console.error('❌ Database test query failed:', qErr.message || qErr);
      } else {
        console.log('✅ Database connected successfully:', process.env.MYSQLDATABASE);
      }
      connection.release();
    });
  }
});

module.exports = pool;
