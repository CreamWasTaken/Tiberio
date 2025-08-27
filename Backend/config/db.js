const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Connection pool configuration for better performance
  connectionLimit: 10, // Limit concurrent connections
  acquireTimeout: 60000, // 60 seconds to acquire connection
  timeout: 60000, // 60 seconds query timeout
  reconnect: true, // Enable automatic reconnection
  // Queue configuration
  queueLimit: 0, // No limit on queued requests
  // Connection configuration
  charset: 'utf8mb4',
  // SSL configuration (if needed)
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;