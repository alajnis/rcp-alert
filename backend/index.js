const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const path = require('path');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- CONFIGURACIÓN ---
dotenv.config();

// Configuración de PostgreSQL (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para Supabase en muchas configuraciones
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-rcp-key';

// Test de conexión inicial con mayor nivel de detalle
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Conexión a Supabase exitosa:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Error crítico de conexión a Supabase:', err.message);
    console.log('💡 Tip: Revisa que la IP de tu PC no esté bloqueada en Supabase o que la password sea correcta.');
    // No matamos el proceso para permitir depuración
  }
};
testConnection();

// --- SERVIDOR ---
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[CLOUD-SERVER] ${req.method} ${req.url}`);
  next();
});

// --- LÓGICA DE GEOLOCALIZACIÓN (Haversine) ---
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- RUTAS ---
app.get('/health', (req, res) => res.json({ status: 'ok', engine: 'supabase-cloud-v1' }));

// 1. Registro
app.post(['/api/auth/register', '/auth/register'], async (req, res) => {
  const { first_name, last_name, email, phone, password, credential_type, credential_name } = req.body;
  console.log(`[AUTH] Intento de registro: ${email}`);
  
  try {
    const userId = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    
    // Usamos pool para las queries con sintaxis $1, $2
    await pool.query(
      'INSERT INTO users (id, first_name, last_name, email, phone, password_hash) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, first_name, last_name, email, phone, hash]
    );
    
    await pool.query(
      'INSERT INTO responder_profiles (id, user_id, credential_type, credential_name) VALUES ($1, $2, $3, $4)',
      [randomUUID(), userId, credential_type, credential_name]
    );
    
    res.status(201).json({ message: 'Usuario registrado correctamente en Supabase' });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Error al registrar usuario' });
  }
});

// 2. Login
app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({ token, user: { first_name: user.first_name, role: user.role } });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Error de servidor' });
  }
});

// 3. Emergencias
app.post('/api/emergencies', async (req, res) => {
  const { location_lat, location_lng, triggered_by_name } = req.body;
  const id = randomUUID();
  
  try {
    await pool.query(
      'INSERT INTO emergencies (id, location_lat, location_lng, triggered_by_name) VALUES ($1, $2, $3, $4)',
      [id, location_lat, location_lng, triggered_by_name || 'Anónimo']
    );
    
    io.emit('emergency:new', { id, location_lat, location_lng, triggered_by_name });
    console.log(`[SOS] !!! EMERGENCIA NUBE !!! Lat: ${location_lat}, Lng: ${location_lng}`);
    res.status(201).json({ id, message: 'Alerta activada en la nube' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Fallo al activar alerta' });
  }
});

// --- SOCKETS ---
io.on('connection', (socket) => {
  console.log('[Socket Cloud] Cliente conectado:', socket.id);
});

// --- ARRANQUE ---
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ******************************************
  🚀 SERVIDOR RCP ALERT - ¡MODO SUPABASE!
  ******************************************
  Conectado a la base de datos de la nube.
  ******************************************
  `);
});
