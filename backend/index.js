import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import Database from 'better-sqlite3';

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- BASE DE DATOS (SQLite) ---
const DB_PATH = 'database.db';
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Inicializar Tablas
const initDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT NOT NULL,
      nombre TEXT NOT NULL
    )
  `);

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

  const stmt = db.prepare('SELECT count(*) as count FROM usuarios');
  if (stmt.get().count === 0) {
    const insert = db.prepare('INSERT INTO usuarios (email, password, rol, nombre) VALUES (?, ?, ?, ?)');
    insert.run('administrador@infiniguard.com', '123', 'admin', 'Administrador');
  }
};
initDB();

// --- CONFIGURACIÓN DE ARCHIVOS ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, Date.now() + '-' + cleanName);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// --- RUTAS ---

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM usuarios WHERE email = ? AND password = ?').get(email, password);
  if (user) res.json({ success: true, user });
  else res.status(401).json({ success: false, message: 'Error de credenciales' });
});

app.get('/api/servicios', (req, res) => {
  const servicios = db.prepare('SELECT * FROM servicios ORDER BY id DESC').all();
  // Convertimos el string de la foto a un array real para el frontend
  const formateados = servicios.map(s => ({
    ...s,
    foto: s.foto ? JSON.parse(s.foto) : []
  }));
  res.json(formateados);
});

// RUTA CLAVE: Acepta archivos con upload.fields
app.post('/api/servicios', upload.fields([{ name: 'foto', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), (req, res) => {
  const data = req.body;

  // Convertimos archivos a rutas
  let fotoPath = JSON.stringify([]);
  let pdfPath = null;

  if (req.files && req.files['foto']) {
    fotoPath = JSON.stringify([`uploads/${req.files['foto'][0].filename}`]);
  }
  if (req.files && req.files['pdf']) {
    pdfPath = `uploads/${req.files['pdf'][0].filename}`;
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO servicios (
        titulo, cliente, usuario, tecnico, tipo, cantidad, direccion, telefono, 
        descripcion, pdf, foto, estado, fecha, precioEstimado, respuestaCotizacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      data.titulo, data.cliente || null, data.usuario || 'Anónimo', data.tecnico || null,
      data.tipo, data.cantidad || 1, data.direccion || '', data.telefono || '',
      data.descripcion || '', pdfPath, fotoPath, 'pendiente',
      new Date().toISOString().split('T')[0], null, null
    );

    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/servicios/:id', upload.single('archivo'), (req, res) => {
  const { id } = req.params;
  const update = req.body;
  if (req.file) {
    const pdfPath = `uploads/${req.file.filename}`;
    db.prepare('UPDATE servicios SET pdf = ? WHERE id = ?').run(pdfPath, id);
  }
  if (update.estado) db.prepare('UPDATE servicios SET estado = ? WHERE id = ?').run(update.estado, id);
  if (update.estadoCliente) db.prepare('UPDATE servicios SET estadoCliente = ? WHERE id = ?').run(update.estadoCliente, id);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Server en puerto ${PORT}`);
  console.log("✅ BACKEND NUEVO ACTIVO - SOPORTE PDF + FOTOS (Multer + SQLite)");
});