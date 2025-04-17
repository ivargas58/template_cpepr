// db.js
const { Pool } = require('pg');

// Configura tu conexión a la base de datos en RDS
const pool = new Pool({
  host: 'simple-node-app.cbkk2cg4ulnw.us-east-2.rds.amazonaws.com', 
  user: 'postgres',                        
  password: 'postgres',               
  database: 'simple_node_app',             
  port: 5432,                           
  ssl: {
    rejectUnauthorized: false, // importante para RDS públicas sin certificado verificado
  }
});

// Exporta el pool para usarlo en otros archivos
module.exports = pool;
