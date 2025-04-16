const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const pool = require('./db.js');
const path = require('path');

// Middleware para leer body de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir archivos estáticos
app.use(express.static('public'));

// Rutas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/jkx', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length > 0) {
      // Usuario válido
      res.redirect('/dashboard.html');
    } else {
      // Credenciales incorrectas
      res.send('<h1>Login inválido</h1><a href="/jkx">Volver</a>');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al procesar login');
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener usuarios');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
