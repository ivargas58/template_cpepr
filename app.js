require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./db'); 
const session = require('express-session');


const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'un-secreto-cualquiera',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 // 1 hora
  }
}));


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

app.get('/pago', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pago.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.status(500).send('Error al cerrar sesión.');
    }
    res.redirect('/login');
  });
});


// Este login verifica el password si esta en texto plano de serlo asi lo encripta 
// De estarlo solo lo valida sino encripta y luego valida
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

// POST /register
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1) revisa existencia
    const { rows } = await pool.query(
      'SELECT 1 FROM usuarios WHERE email = $1',
      [email]
    );
    if (rows.length) {
      return res.send('<h1>Correo ya existe</h1><a href="/register">Volver</a>');
    }

    // 2) hashea
    const hashed = await bcrypt.hash(password, 10);

    // 3) inserta sin 'id'
    await pool.query(
      'INSERT INTO usuarios (email, password) VALUES ($1, $2)',
      [email, hashed]
    );

    res.send('<h1>Registro OK</h1><a href="/login">Login</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al registrar');
  }
});



app.post('/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.send('<h1>Correo no registrado</h1><a href="/forgot-password">Volver</a>');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE usuarios SET password = $1 WHERE email = $2', [hashedPassword, email]);

    res.send('<h1>Contraseña actualizada correctamente</h1><a href="/login">Iniciar sesión</a>');
  } catch (err) {
    console.error('Error al recuperar contraseña:', err);
    res.status(500).send('Error en el servidor al actualizar la contraseña.');
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
