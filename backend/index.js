const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Database = require('better-sqlite3');
const path = require('path');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- CONFIGURACIÓN ---
dotenv.config();
const db = new Database(path.join(__dirname, 'rcp_alert.db'));
db.pragma('foreign_keys = ON');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-rcp-key';

// --- BASE DE DATOS ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'responder',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS responder_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    credential_type TEXT NOT NULL,
    credential_name TEXT NOT NULL,
    is_available INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'pending',
    last_location_lat REAL,
    last_location_lng REAL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS emergencies (
    id TEXT PRIMARY KEY,
    triggered_by_name TEXT,
    location_lat REAL NOT NULL,
    location_lng REAL NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// --- SERVIDOR ---
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[JS-SERVER] ${req.method} ${req.url}`);
  next();
});

// --- RUTAS ---
app.get('/health', (req, res) => res.json({ status: 'ok', engine: 'pure-js-v2' }));

app.post('/api/emergencies', (req, res) => {
  const { location_lat, location_lng, triggered_by_name } = req.body;
  const id = randomUUID();
  console.log(`[SOS] !!! EMERGENCIA RECIBIDA !!! Lat: ${location_lat}, Lng: ${location_lng}`);
  
  db.prepare('INSERT INTO emergencies (id, location_lat, location_lng, triggered_by_name) VALUES (?, ?, ?, ?)').run(id, location_lat, location_lng, triggered_by_name || 'Anónimo');
  
  io.emit('emergency:new', { id, location_lat, location_lng, triggered_by_name });
  res.status(201).json({ id, message: 'Alerta activada' });
});

// 2. Auth (Login/Register)
// Usamos múltiples rutas para asegurar compatibilidad total
app.post(['/api/auth/register', '/auth/register', '/api/register'], async (req, res) => {
  const { first_name, last_name, email, phone, password, credential_type, credential_name } = req.body;
  console.log(`[AUTH] Intento de registro para: ${email}`);
  try {
    const userId = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (id, first_name, last_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?, ?)').run(userId, first_name, last_name, email, phone, hash);
    db.prepare('INSERT INTO responder_profiles (id, user_id, credential_type, credential_name) VALUES (?, ?, ?, ?)').run(randomUUID(), userId, credential_type, credential_name);
    console.log(`[AUTH] Usuario registrado: ${email}`);
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (e) {
    console.error(`[AUTH ERROR]`, e);
    res.status(400).json({ error: 'Error en registro (posible email duplicado)' });
  }
});

app.post(['/api/auth/login', '/auth/login', '/api/login'], async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH] Intento de login: ${email}`);
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({ token, user: { first_name: user.first_name, role: user.role } });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (e) {
    console.error(`[AUTH ERROR]`, e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// --- SOCKETS ---
io.on('connection', (socket) => {
  console.log('[Socket] Conectado:', socket.id);
});

// --- ARRANQUE ---
const PORT = 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ******************************************
  🚀 SERVIDOR RCP ALERT - ¡MODO ESTABLE JS!
  ******************************************
  El servidor está listo y escuchando.
  PRUEBA: http://127.0.0.1:3000/health
  ******************************************
  `);
});
