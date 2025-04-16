// test-db.js
const pool = require('./db');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
  } else {
    console.log('✅ Conexión exitosa:', res.rows[0]);
  }

  pool.end(); // Cierra la conexión
});
