require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas get
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/servicios', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'servicios.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

app.get('/pago', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pago.html'));
});

app.get('/logout', (req, res) => {
  // Sin express-session, solo redirige al login
  res.redirect('/login');
});

// Login que verifica si el password está hasheado
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.send('<h1>Usuario no encontrado</h1><a href="/">Volver</a>');
    }

    const usuario = result.rows[0];
    const storedPassword = usuario.password;

    const isHashed = storedPassword.startsWith('$2b$');

    if (isHashed) {
      const match = await bcrypt.compare(password, storedPassword);
      if (!match) {
        return res.send('<h1>Contraseña incorrecta</h1><a href="/login">Volver</a>');
      }
    } else {
      if (password !== storedPassword) {
        return res.send('<h1>Contraseña incorrecta</h1><a href="/login">Volver</a>');
      }

      // Hashear y actualizar contraseña automáticamente
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashedPassword, usuario.id]);
      console.log(`Contraseña convertida a hash para el usuario con ID ${usuario.id}`);
    }

    // Login exitoso
    res.redirect('/pago');

  } catch (err) {
    console.error('Error al procesar login:', err);
    res.status(500).send('Error en el servidor al procesar el login.');
  }
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verifica si el correo ya existe
    const { rows } = await pool.query(
      'SELECT 1 FROM usuarios WHERE email = $1',
      [email]
    );
    if (rows.length) {
      return res.send('<h1>Correo ya existe</h1><a href="/register">Volver</a>');
    }

    // Hashea la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserta el nuevo usuario
    await pool.query(
      'INSERT INTO usuarios (email, password) VALUES ($1, $2)',
      [email, hashedPassword]
    );

    res.send('<h1>Registro OK</h1><a href="/login">Login</a>');
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).send('Error en el servidor al registrar.');
  }
});

// Ruta de prueba para ver usuarios (solo desarrollo, no usar en producción así)
app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios;');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).send(`
      <h1>Error al obtener usuarios</h1>
      <p>${err.message}</p>
      <pre>${err.stack}</pre>
    `);
  }
});

//Server route
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
