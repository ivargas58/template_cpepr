// db.js
require('dotenv').config();
const { Pool } = require('pg');

// Agrega logs para verificar que las variables están correctamente cargadas
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD tipo:', typeof process.env.DB_PASSWORD);
console.log('DB_PASSWORD valor:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  }
});

module.exports = pool;
