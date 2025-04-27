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

app.get('/conocenos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'conocenos.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/logout', (req, res) => {
  // Sin express-session, solo redirige al login
  res.redirect('/login');
});

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
      await pool.query('UPDATE usuarios SET password = $1 WHERE email = $2', [hashedPassword, usuario.email]);
      console.log(`Contraseña convertida a hash para el usuario con email ${usuario.email}`);
    }

    // Login exitoso: redirige según rol
    if (usuario.rol === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/pago');
    }

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

    // Inserta el nuevo usuario con rol 'user'
    await pool.query(
      'INSERT INTO usuarios (email, password, rol) VALUES ($1, $2, $3)',
      [email, hashedPassword, 'user']
    );

    res.send('<h1>Registro OK</h1><a href="/login">Login</a>');
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).send('Error en el servidor al registrar.');
  }
});


//Server route
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
