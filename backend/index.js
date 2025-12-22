import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import Database from 'better-sqlite3'; // <--- NUEVA LIBRERÍA

const app = express();
const PORT = 4000;

// Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 💾 CONFIGURACIÓN DE SQLITE (BASE DE DATOS)
// ==========================================

// NOTA PARA RAILWAY: Si configuras un Volumen, cambia esta ruta.
// Por ejemplo: const DB_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'database.db') : 'database.db';
const DB_PATH = 'database.db'; 

const db = new Database(DB_PATH);
// Habilitar modo WAL para mejor rendimiento y concurrencia
db.pragma('journal_mode = WAL'); 

console.log(`✅ Base de datos SQLite conectada: ${DB_PATH}`);

// Inicializar Tablas si no existen
const initDB = () => {
  // Tabla Usuarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT NOT NULL,
      nombre TEXT NOT NULL
    )
  `);

  // Tabla Servicios
  // Nota: 'foto' se guardará como TEXTO (JSON string) porque SQLite no tiene tipo ARRAY nativo
  db.exec(`
    CREATE TABLE IF NOT EXISTS servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT,
      cliente TEXT,
      usuario TEXT,
      tecnico TEXT,
      tipo TEXT,
      cantidad INTEGER,
      direccion TEXT,
      telefono TEXT,
      descripcion TEXT,
      pdf TEXT,
      foto TEXT, 
      estado TEXT,
      respuestaCotizacion TEXT,
      precioEstimado TEXT,
      estadoCliente TEXT,
      fecha TEXT
    )
  `);
  
  // Crear usuario admin por defecto si no existe nadie
  const stmt = db.prepare('SELECT count(*) as count FROM usuarios');
  const result = stmt.get();
  if (result.count === 0) {
    console.log('⚡ Creando usuario admin por defecto...');
    const insert = db.prepare('INSERT INTO usuarios (email, password, rol, nombre) VALUES (?, ?, ?, ?)');
    insert.run('administrador@infiniguard.com', '123', 'admin', 'Administrador');
  }
};

initDB();

// ==========================================
// 📂 CONFIGURACIÓN DE ARCHIVOS (MULTER)
// ==========================================
const UPLOADS_DIR = path.join(__dirname, 'uploads'); 
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanName = file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueSuffix + '-' + cleanName);
  }
});
const upload = multer({ storage });

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// ==========================================
// 🔌 RUTAS API (CAMBIADAS A SQL)
// ==========================================

// --- LOGIN ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  // Buscamos usuario en la DB
  const stmt = db.prepare('SELECT * FROM usuarios WHERE email = ? AND password = ?');
  const user = stmt.get(email, password);

  if (user) {
    const { password, ...datosSeguros } = user;
    res.json({ success: true, user: datosSeguros });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  }
});

// --- SERVICIOS (GET) ---
app.get('/api/servicios', (req, res) => {
  const stmt = db.prepare('SELECT * FROM servicios ORDER BY id DESC');
  const servicios = stmt.all();
  
  // Convertimos el campo 'foto' de texto JSON a Array real para que el frontend lo entienda
  const serviciosFormateados = servicios.map(s => ({
    ...s,
    foto: s.foto ? JSON.parse(s.foto) : [] // Parseamos el JSON string
  }));

  res.json(serviciosFormateados);
});

// --- SERVICIOS (POST - CREAR) ---
app.post('/api/servicios', (req, res) => {
  const data = req.body;
  
  // Preparamos los datos. Convertimos array de fotos a string JSON para guardar en SQLite
  const fotoString = JSON.stringify(Array.isArray(data.foto) ? data.foto : (data.foto ? [data.foto] : []));

  const stmt = db.prepare(`
    INSERT INTO servicios (
      titulo, cliente, usuario, tecnico, tipo, cantidad, direccion, telefono, 
      descripcion, pdf, foto, estado, fecha
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    data.titulo, data.cliente || null, data.usuario || null, data.tecnico || null, 
    data.tipo, data.cantidad || 1, data.direccion || '', data.telefono || '', 
    data.descripcion || '', data.pdf || null, fotoString, 
    data.tecnico ? 'aprobado' : 'pendiente', 
    new Date().toISOString().split('T')[0]
  );

  res.json({ success: true, id: info.lastInsertRowid });
});

// --- SERVICIOS (PUT - ACTUALIZAR) ---
app.put('/api/servicios/:id', upload.single('archivo'), (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // Verificamos si existe el servicio
  const check = db.prepare('SELECT * FROM servicios WHERE id = ?').get(id);
  if (!check) return res.status(404).json({ success: false, message: 'Servicio no encontrado' });

  // Lógica para actualizar campos dinámicamente
  // 1. Si hay archivo nuevo, actualizamos PDF
  if (req.file) {
    const pdfPath = `uploads/${req.file.filename}`;
    db.prepare('UPDATE servicios SET pdf = ? WHERE id = ?').run(pdfPath, id);
  }

  // 2. Actualizamos campos de texto si vienen
  if (updateData.estado) db.prepare('UPDATE servicios SET estado = ? WHERE id = ?').run(updateData.estado, id);
  if (updateData.respuestaAdmin) db.prepare('UPDATE servicios SET respuestaCotizacion = ? WHERE id = ?').run(updateData.respuestaAdmin, id);
  if (updateData.precio) db.prepare('UPDATE servicios SET precioEstimado = ? WHERE id = ?').run(updateData.precio, id);

  res.json({ success: true, message: 'Actualizado' });
});

// --- USUARIOS (CRUD BÁSICO) ---
app.get('/api/usuarios', (req, res) => {
  const users = db.prepare('SELECT id, nombre, email, rol FROM usuarios').all();
  res.json(users);
});

app.post('/api/usuarios', (req, res) => {
  const { nombre, email, password, rol } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)');
    const info = stmt.run(nombre, email, password, rol);
    res.json({ success: true, user: { id: info.lastInsertRowid, nombre, email, rol } });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, message: 'Email ya registrado' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/usuarios/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM usuarios WHERE id = ?');
  const info = stmt.run(req.params.id);
  if (info.changes > 0) res.json({ success: true });
  else res.status(404).json({ success: false });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor SQLite corriendo en: http://localhost:${PORT}`);
});