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

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
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

/*const crypto = require('crypto');
const nodemailer = require('nodemailer');

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.send('<h1>Correo no registrado</h1><a href="/forgot-password">Volver</a>');
    }

    // Crear token único
    const token = crypto.randomBytes(32).toString('hex');

    // Guardar token en base de datos
    await pool.query('UPDATE usuarios SET reset_token = $1 WHERE email = $2', [token, email]);

    // Configurar transportador de Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,   // Tu Gmail
        pass: process.env.EMAIL_PASS    // Tu contraseña de aplicación Gmail
      }
    });

    const resetLink = `http://tu-dominio.com/reset-password/${token}`; // Cambia por tu dominio real

    await transporter.sendMail({
      from: '"Soporte" <tuemail@gmail.com>',
      to: email,
      subject: 'Recuperar contraseña',
      html: `
        <h2>Recuperar contraseña</h2>
        <p>Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
        <a href="${resetLink}">Restablecer contraseña</a>
      `
    });

    res.send('<h1>Correo enviado. Revisa tu bandeja de entrada.</h1><a href="/login">Volver</a>');

  } catch (err) {
    console.error('Error en forgot-password:', err);
    res.status(500).send('Error en el servidor.');
  }
});
*/
app.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE reset_token = $1', [token]);
    if (result.rows.length === 0) {
      return res.send('<h1>Token inválido</h1><a href="/forgot-password">Intentar de nuevo</a>');
    }

    // Mostrar formulario para nueva contraseña
    res.send(`
      <h1>Restablecer contraseña</h1>
      <form action="/reset-password/${token}" method="POST">
        <input type="password" name="newPassword" placeholder="Nueva contraseña" required />
        <button type="submit">Guardar nueva contraseña</button>
      </form>
    `);
  } catch (err) {
    console.error('Error mostrando página de reset:', err);
    res.status(500).send('Error en el servidor.');
  }
});

app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE reset_token = $1', [token]);
    if (result.rows.length === 0) {
      return res.send('<h1>Token inválido</h1><a href="/forgot-password">Intentar de nuevo</a>');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE usuarios SET password = $1, reset_token = NULL WHERE reset_token = $2', [hashedPassword, token]);

    res.send('<h1>Contraseña actualizada exitosamente.</h1><a href="/login">Iniciar sesión</a>');
  } catch (err) {
    console.error('Error actualizando contraseña:', err);
    res.status(500).send('Error en el servidor.');
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
