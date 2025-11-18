const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bus_booking',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
});

// Quick connection check on startup so logs show DB status.
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message || err);
  } else {
    connection.query('SELECT 1', (qErr) => {
      if (qErr) console.error('❌ Database test query failed:', qErr.message || qErr);
      else console.log('✅ Database connected:', process.env.DB_NAME || 'bus_booking');
      connection.release();
    });
  }
});

module.exports = pool;
