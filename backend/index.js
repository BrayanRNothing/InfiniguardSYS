import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import pkg from 'pg';
import dotenv from 'dotenv';
import { migrarDocumentos } from './migrations/documentos.js';
import crearRutasDocumentos from './routes/documentos.js';

dotenv.config();
const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- BASE DE DATOS (PostgreSQL) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Inicializar Tablas
const initDB = async () => {
  try {
    // Tabla Usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL,
        nombre TEXT NOT NULL
      )
    `);

    // Tabla de Cotizaciones Independientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cotizaciones (
        id SERIAL PRIMARY KEY,
        numero TEXT UNIQUE,
        fecha DATE,
        cliente_nombre TEXT,
        titulo TEXT,
        datos JSONB,
        pdf_url TEXT,
        total REAL
      )
    `);

    // Tabla Servicios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS servicios (
        id SERIAL PRIMARY KEY,
        titulo TEXT,
        cliente TEXT,
        usuario TEXT,
        tecnico TEXT,
        tecnicoId INTEGER,
        tipo TEXT,
        cantidad INTEGER,
        direccion TEXT,
        telefono TEXT,
        descripcion TEXT,
        modelo TEXT,
        pdf TEXT,
        foto TEXT, 
        estado TEXT,
        respuestaCotizacion TEXT,
        precioEstimado TEXT,
        pdfCotizacion TEXT,
        estadoCliente TEXT,
        fecha TEXT,
        fechaServicio TEXT,
        horaServicio TEXT,
        notas TEXT,
        tecnicoAsignado TEXT,
        telefonoTecnico TEXT,
        fechaProgramada TEXT,
        porcentajeComision REAL DEFAULT 0,
        documentos JSONB DEFAULT '[]',
        historial JSONB DEFAULT '[]'
      )
    `);

    // Migración: Agregar columnas si no existen
    const addColumn = async (table, column, type, defaultValue = null) => {
      try {
        let sql = `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`;
        if (defaultValue !== null) sql += ` DEFAULT ${defaultValue}`;
        await pool.query(sql);
      } catch (e) {
        // Ignorar si ya existe
      }
    };

    await addColumn('servicios', 'modelo', 'TEXT');
    await addColumn('servicios', 'pdfCotizacion', 'TEXT');
    await addColumn('servicios', 'tecnicoId', 'INTEGER');
    await addColumn('servicios', 'fechaServicio', 'TEXT');
    await addColumn('servicios', 'horaServicio', 'TEXT');
    await addColumn('servicios', 'notas', 'TEXT');
    await addColumn('servicios', 'tecnicoAsignado', 'TEXT');
    await addColumn('servicios', 'telefonoTecnico', 'TEXT');
    await addColumn('servicios', 'fechaProgramada', 'TEXT');
    await addColumn('servicios', 'porcentajeComision', 'REAL', '0');

    // Migrar datos existentes de 'tecnico' a 'tecnicoAsignado'
    try {
      await pool.query(`
        UPDATE servicios 
        SET tecnicoAsignado = tecnico 
        WHERE tecnico IS NOT NULL AND tecnicoAsignado IS NULL
      `);
    } catch (e) {
      console.log('Error migrando datos de técnico:', e.message);
    }

    const { rowCount } = await pool.query('SELECT id FROM usuarios LIMIT 1');
    if (rowCount === 0) {
      await pool.query(
        'INSERT INTO usuarios (email, password, rol, nombre) VALUES ($1, $2, $3, $4)',
        ['admin@infiniguard.com', '123', 'admin', 'Administrador']
      );

      console.log('✅ Usuario administrador creado:');
      console.log('   Email: admin@infiniguard.com');
      console.log('   Password: 123');
    }

    // Migrar rol 'cliente' a 'usuario' en la tabla de usuarios
    try {
      await pool.query("UPDATE usuarios SET rol = 'usuario' WHERE rol = 'cliente'");
      console.log("✅ Migración de roles completada: 'cliente' -> 'usuario'");
    } catch (e) {
      console.error('Error migrando roles:', e.message);
    }

    // Migrar documentos
    await migrarDocumentos(pool);

  } catch (err) {
    console.error('❌ Error inicializando DB:', err.message);
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

// Registrar rutas de documentos
app.use('/api', crearRutasDocumentos(pool));

// --- RUTAS ---

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND password = $2', [email, password]);
    const user = result.rows[0];
    if (user) res.json({ success: true, user });
    else res.status(401).json({ success: false, message: 'Error de credenciales' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET solo técnicos
app.get('/api/tecnicos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE rol = $1', ['tecnico']);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/servicios', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM servicios ORDER BY id DESC');
    const formateados = rows.map(s => {
      let fotoArray = [];
      if (s.foto) {
        try {
          fotoArray = typeof s.foto === 'string' ? JSON.parse(s.foto) : s.foto;
        } catch (e) {
          fotoArray = [s.foto];
        }
      }
      return {
        ...s,
        foto: Array.isArray(fotoArray) ? fotoArray[0] : (fotoArray ? [fotoArray][0] : null)
      };
    });
    res.json(formateados);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/servicios', upload.fields([{ name: 'foto', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
  const data = req.body;
  let fotoPath = JSON.stringify([]);
  let pdfPath = null;

  if (req.files && req.files['foto']) {
    fotoPath = JSON.stringify([`uploads/${req.files['foto'][0].filename}`]);
  }
  if (req.files && req.files['pdf']) {
    pdfPath = `uploads/${req.files['pdf'][0].filename}`;
  }

  try {
    const result = await pool.query(`
      INSERT INTO servicios (
        titulo, cliente, usuario, tecnico, tipo, cantidad, direccion, telefono, 
        descripcion, modelo, pdf, foto, estado, fecha, precioEstimado, respuestaCotizacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id
    `, [
      data.titulo, data.cliente || null, data.usuario || 'Anónimo', data.tecnico || null,
      data.tipo, data.cantidad || 1, data.direccion || '', data.telefono || '',
      data.descripcion || '', data.modelo || '', pdfPath, fotoPath, 'pendiente',
      new Date().toISOString().split('T')[0], null, null
    ]);

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/servicios/:id', upload.single('archivo'), async (req, res) => {
  const { id } = req.params;
  const update = req.body;

  try {
    if (req.file) {
      const pdfPath = `uploads/${req.file.filename}`;
      await pool.query('UPDATE servicios SET pdfCotizacion = $1 WHERE id = $2', [pdfPath, id]);
    }

    if (update.estado) {
      await pool.query('UPDATE servicios SET estado = $1 WHERE id = $2', [update.estado, id]);
    }

    if (update.estadoCliente) {
      await pool.query('UPDATE servicios SET estadoCliente = $1 WHERE id = $2', [update.estadoCliente, id]);
    }

    if (update.precio || update.precioEstimado) {
      const precio = update.precio || update.precioEstimado;
      await pool.query('UPDATE servicios SET precioEstimado = $1 WHERE id = $2', [precio, id]);
    }

    if (update.respuestaAdmin || update.respuestaCotizacion) {
      const respuesta = update.respuestaAdmin || update.respuestaCotizacion;
      await pool.query('UPDATE servicios SET respuestaCotizacion = $1 WHERE id = $2', [respuesta, id]);
    }

    if (update.tecnico) {
      await pool.query('UPDATE servicios SET tecnico = $1 WHERE id = $2', [update.tecnico, id]);
    }

    if (update.tecnicoAsignado) {
      await pool.query('UPDATE servicios SET tecnicoAsignado = $1 WHERE id = $2', [update.tecnicoAsignado, id]);
    }

    if (update.telefonoTecnico) {
      await pool.query('UPDATE servicios SET telefonoTecnico = $1 WHERE id = $2', [update.telefonoTecnico, id]);
    }

    if (update.fechaProgramada) {
      await pool.query('UPDATE servicios SET fechaProgramada = $1 WHERE id = $2', [update.fechaProgramada, id]);
    }

    if (update.tecnicoId) {
      await pool.query('UPDATE servicios SET tecnicoId = $1 WHERE id = $2', [update.tecnicoId, id]);
    }

    if (update.fechaServicio) {
      await pool.query('UPDATE servicios SET fechaServicio = $1 WHERE id = $2', [update.fechaServicio, id]);
    }

    if (update.horaServicio) {
      await pool.query('UPDATE servicios SET horaServicio = $1 WHERE id = $2', [update.horaServicio, id]);
    }

    if (update.notas) {
      await pool.query('UPDATE servicios SET notas = $1 WHERE id = $2', [update.notas, id]);
    }

    if (update.porcentajeComision !== undefined) {
      await pool.query('UPDATE servicios SET porcentajeComision = $1 WHERE id = $2', [update.porcentajeComision, id]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error en PUT:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Faltan datos' });

  try {
    const exists = await pool.query('SELECT 1 FROM usuarios WHERE email = $1', [email]);
    if (exists.rowCount > 0) return res.status(409).json({ success: false, message: 'El email ya está registrado' });

    const result = await pool.query(
      'INSERT INTO usuarios (email, password, rol, nombre) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, password, 'usuario', email.split('@')[0]]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id',
      [nombre, email, password, rol]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, rol } = req.body;
  try {
    if (password) {
      await pool.query(
        'UPDATE usuarios SET nombre = $1, email = $2, password = $3, rol = $4 WHERE id = $5',
        [nombre, email, password, rol, id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET nombre = $1, email = $2, rol = $3 WHERE id = $4',
        [nombre, email, rol, id]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINTS COTIZACIONES ---
app.get('/api/standalone-cotizaciones', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cotizaciones ORDER BY fecha DESC, numero DESC');
    res.json({ success: true, cotizaciones: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/standalone-cotizaciones', async (req, res) => {
  const { numero, fecha, cliente_nombre, titulo, datos, pdf_url, total } = req.body;
  try {
    await pool.query(`
      INSERT INTO cotizaciones (numero, fecha, cliente_nombre, titulo, datos, pdf_url, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (numero) DO UPDATE SET
        fecha = EXCLUDED.fecha,
        cliente_nombre = EXCLUDED.cliente_nombre,
        titulo = EXCLUDED.titulo,
        datos = EXCLUDED.datos,
        pdf_url = EXCLUDED.pdf_url,
        total = EXCLUDED.total
    `, [numero, fecha, cliente_nombre, titulo, JSON.stringify(datos), pdf_url, total]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/standalone-cotizaciones/upload', upload.single('pdf'), (req, res) => {
  if (req.file) {
    res.json({ success: true, url: `uploads/${req.file.filename}` });
  } else {
    res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
  }
});

app.delete('/api/standalone-cotizaciones/:numero', async (req, res) => {
  const { numero } = req.params;
  try {
    await pool.query('DELETE FROM cotizaciones WHERE numero = $1', [numero]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/db/reset', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE servicios RESTART IDENTITY CASCADE');
    console.log('✅ Base de datos reiniciada - Todos los servicios eliminados');
    res.json({ success: true, message: 'Base de datos reiniciada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server en puerto ${PORT}`));
