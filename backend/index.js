import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import fsSync from 'node:fs'; // Necesario para crear carpetas
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer'; // <--- IMPORTANTE: Librería para archivos

const app = express();
const PORT = 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');
// Definimos la carpeta donde se guardarán los archivos
const UPLOADS_DIR = path.join(__dirname, 'uploads'); 
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; 

// ==========================================
// 📂 CONFIGURACIÓN DE CARGA DE ARCHIVOS (MULTER)
// ==========================================

// 1. Crear la carpeta 'uploads' si no existe
if (!fsSync.existsSync(UPLOADS_DIR)){
    fsSync.mkdirSync(UPLOADS_DIR);
}

// 2. Configurar cómo guardar los archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR); // Guardar en la carpeta uploads
  },
  filename: function (req, file, cb) {
    // Generar nombre único: fecha + nombre original limpio
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanName = file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueSuffix + '-' + cleanName);
  }
});

const upload = multer({ storage: storage });

// ==========================================
// 🧠 LÓGICA DE BASE DE DATOS (IGUAL QUE ANTES)
// ==========================================

const hasValidToken = (req) => {
  if (!ADMIN_TOKEN) return true;
  const headerToken = req.get('x-admin-token');
  return headerToken && headerToken === ADMIN_TOKEN;
};

const buildSnapshot = ({ includePasswords }) => {
  const usuariosSnapshot = includePasswords
    ? usuarios
    : usuarios.map(({ password, ...rest }) => rest);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    usuarios: usuariosSnapshot,
    servicios,
  };
};

const loadSnapshotIntoMemory = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') throw new Error('Snapshot inválido');
  if (!Array.isArray(snapshot.usuarios)) throw new Error('Snapshot inválido: usuarios');
  if (!Array.isArray(snapshot.servicios)) throw new Error('Snapshot inválido: servicios');

  usuarios.length = 0;
  usuarios.push(...snapshot.usuarios);
  servicios = snapshot.servicios;
};

const tryLoadDbFromDisk = async () => {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const snapshot = JSON.parse(raw);
    loadSnapshotIntoMemory(snapshot);
    console.log(`✅ DB cargada desde archivo: ${DB_FILE}`);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      console.log('ℹ️ No existe db.json; iniciando con datos en memoria.');
      return;
    }
    console.error('⚠️ No se pudo cargar db.json:', err);
  }
};

const saveDbToDisk = async (options = {}) => {
  const { includePasswords = true } = options;
  const snapshot = buildSnapshot({ includePasswords });
  await fs.writeFile(DB_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
  return snapshot;
};

// ==========================================
// ⚙️ MIDDLEWARES
// ==========================================
app.use(cors()); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true })); 

// ¡IMPORTANTE! Hacer pública la carpeta uploads para poder descargar los PDFs
// Ahora puedes entrar a http://localhost:4000/uploads/nombre-archivo.pdf
app.use('/uploads', express.static(UPLOADS_DIR));

console.log('✅ Servidor con soporte de ARCHIVOS activo - v3.0');

// DATOS INICIALES
const usuarios = [
  { id: 1, email: 'cesar@infiniguard.com', password: '123', rol: 'admin', nombre: 'Cesar' },
  { id: 6, email: 'administrador@infiniguard.com', password: '123', rol: 'admin', nombre: 'Administrador' },
  { id: 2, email: 'julio@infiniguard.com', password: '123', rol: 'tecnico', nombre: 'Julio' },
  { id: 3, email: 'brayan@infiniguard.com', password: '123', rol: 'tecnico', nombre: 'Brayan' },
  { id: 4, email: 'distribuidor@infiniguard.com', password: '123', rol: 'distribuidor', nombre: 'User' },
  { id: 5, email: 'cliente@infiniguard.com', password: '123', rol: 'cliente', nombre: 'User' },
];
let servicios = [];

// Cargar DB al inicio
await tryLoadDbFromDisk();

// ==========================================
// 🔌 RUTAS (ENDPOINTS)
// ==========================================

app.get('/api/db/export', (req, res) => {
  if (!hasValidToken(req)) return res.status(401).json({ success: false, message: 'No autorizado' });
  const includePasswords = String(req.query.includePasswords || 'false') === 'true';
  res.json({ success: true, snapshot: buildSnapshot({ includePasswords }) });
});

app.post('/api/db/import', async (req, res) => {
  if (!hasValidToken(req)) return res.status(401).json({ success: false, message: 'No autorizado' });
  try {
    const snapshot = req.body?.snapshot || req.body;
    loadSnapshotIntoMemory(snapshot);
    await saveDbToDisk({ includePasswords: true });
    res.json({ success: true, message: 'DB importada', counts: { usuarios: usuarios.length, servicios: servicios.length } });
  } catch (err) {
    res.status(400).json({ success: false, message: err?.message || 'Snapshot inválido' });
  }
});

app.post('/api/db/save', async (req, res) => {
  if (!hasValidToken(req)) return res.status(401).json({ success: false, message: 'No autorizado' });
  try {
    const snapshot = await saveDbToDisk({ includePasswords: true });
    res.json({ success: true, message: 'DB guardada', file: DB_FILE });
  } catch (err) {
    res.status(500).json({ success: false, message: 'No se pudo guardar db.json' });
  }
});

app.post('/api/db/load', async (req, res) => {
  if (!hasValidToken(req)) return res.status(401).json({ success: false, message: 'No autorizado' });
  await tryLoadDbFromDisk();
  res.json({ success: true, message: 'DB recargada' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const usuarioEncontrado = usuarios.find(u => u.email === email && u.password === password);
  if (usuarioEncontrado) {
    const { password, ...datosSeguros } = usuarioEncontrado;
    res.json({ success: true, user: datosSeguros });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  }
});

app.get('/api/servicios', (req, res) => {
  res.json(servicios);
});

app.get('/api/tecnicos', (req, res) => {
  const tecnicos = usuarios.filter(u => u.rol === 'tecnico');
  res.json(tecnicos);
});

app.post('/api/servicios', (req, res) => {
  const nuevosDatos = req.body;
  const nuevoServicio = {
    id: Date.now(),
    titulo: nuevosDatos.titulo, 
    cliente: nuevosDatos.cliente || null,
    usuario: nuevosDatos.usuario || null,
    tecnico: nuevosDatos.tecnico || null,
    tipo: nuevosDatos.tipo,
    cantidad: nuevosDatos.cantidad || 1,
    direccion: nuevosDatos.direccion || '',
    telefono: nuevosDatos.telefono || '',
    descripcion: nuevosDatos.descripcion || '',
    pdf: nuevosDatos.pdf || null,
    foto: Array.isArray(nuevosDatos.foto) ? nuevosDatos.foto : [nuevosDatos.foto] || null,
    estado: nuevosDatos.tecnico ? 'aprobado' : 'pendiente',
    respuestaCotizacion: nuevosDatos.respuestaCotizacion || null,
    precioEstimado: nuevosDatos.precioEstimado || null,
    estadoCliente: null,
    fecha: new Date().toISOString().split('T')[0]
  };
  servicios.push(nuevoServicio);
  saveDbToDisk({ includePasswords: true }).catch(() => {});
  console.log("Nueva solicitud:", nuevoServicio);
  res.json({ success: true, servicio: nuevoServicio });
});

// ------------------------------------------------------------------
// RUTA 4: Actualizar servicio (MODIFICADA PARA ACEPTAR ARCHIVOS)
// 'upload.single' intercepta el archivo que el frontend envía
// ------------------------------------------------------------------
app.put('/api/servicios/:id', upload.single('archivo'), (req, res) => {
  const { id } = req.params;
  const actualizacion = req.body; // Aquí llega el texto (precio, respuesta)
  
  console.log(`Actualizando Servicio ID: ${id}`);
  
  const index = servicios.findIndex(s => s.id == id);
  
  if (index !== -1) {
    // 1. Actualizar campos de texto
    if (actualizacion.estado) servicios[index].estado = actualizacion.estado;
    if (actualizacion.respuestaAdmin) servicios[index].respuestaCotizacion = actualizacion.respuestaAdmin; // Unificamos nombre
    if (actualizacion.precio) servicios[index].precio = actualizacion.precio;
    
    // 2. Si llegó un archivo, guardar su ruta en la base de datos
    if (req.file) {
      console.log('✅ Archivo recibido:', req.file.filename);
      // Guardamos la URL relativa: "uploads/nombre-archivo.pdf"
      servicios[index].pdf = `uploads/${req.file.filename}`;
    }

    // Persistencia
    saveDbToDisk({ includePasswords: true }).catch(() => {});
    res.json({ success: true, servicio: servicios[index] });
  } else {
    res.status(404).json({ success: false, message: 'Servicio no encontrado' });
  }
});

app.get('/api/usuarios', (req, res) => {
  res.json(usuarios);
});

app.post('/api/usuarios', (req, res) => {
  const { nombre, email, password, rol } = req.body;
  const existe = usuarios.find(u => u.email === email);
  if (existe) return res.status(400).json({ success: false, message: 'Email registrado' });
  
  const nuevoUsuario = { id: Date.now(), nombre, email, password, rol };
  usuarios.push(nuevoUsuario);
  saveDbToDisk({ includePasswords: true }).catch(() => {});
  res.json({ success: true, user: nuevoUsuario });
});

app.put('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, rol } = req.body;
  const index = usuarios.findIndex(u => u.id == id);
  if (index !== -1) {
    if (password && password.trim() !== '') {
      usuarios[index] = { ...usuarios[index], nombre, email, password, rol };
    } else {
      usuarios[index] = { ...usuarios[index], nombre, email, rol };
    }
    saveDbToDisk({ includePasswords: true }).catch(() => {});
    res.json({ success: true, user: usuarios[index] });
  } else {
    res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }
});

app.delete('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const index = usuarios.findIndex(u => u.id == id);
  if (index !== -1) {
    usuarios.splice(index, 1);
    saveDbToDisk({ includePasswords: true }).catch(() => {});
    res.json({ success: true, message: 'Usuario eliminado' });
  } else {
    res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`📂 Archivos se guardarán en: ${UPLOADS_DIR}`);
});