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
import crearRutasPNC from './routes/pnc.js';
import crearRutasDAE from './routes/dae.js';
import { enviarEmailBienvenida, notificarNuevaCotizacion, notificarCambioEstado, notificarTecnicoNuevaTarea, notificarAdminServicioCompletado } from './services/emailService.js';



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

    // Migración: Agregar teléfono a usuarios
    await addColumn('usuarios', 'telefono', 'TEXT');

    // Migración: Agregar username y hacer email opcional
    await addColumn('usuarios', 'username', 'TEXT');

    // Migración: Agregar notificaciones activas (por defecto true si tienen email)
    await addColumn('usuarios', 'notificaciones_activas', 'BOOLEAN', 'TRUE');

    // Hacer email nullable (remover constraint NOT NULL)
    try {
      await pool.query('ALTER TABLE usuarios ALTER COLUMN email DROP NOT NULL');
    } catch (e) {
      console.log('Email ya es nullable o error:', e.message);
    }

    // Migración de usuarios existentes: asignar username a usuarios sin él
    try {
      const usuarios = await pool.query('SELECT id, email, nombre, username FROM usuarios');

      for (const user of usuarios.rows) {
        if (!user.username) {
          let username = user.nombre?.toLowerCase().replace(/\s+/g, '_') || 'usuario';
          // Si el nombre es "Administrador", usar "admin"
          if (user.nombre === 'Administrador' || user.email === 'admin@infiniguard.com') {
            username = 'admin';
          }

          await pool.query('UPDATE usuarios SET username = $1 WHERE id = $2', [username, user.id]);
        }
      }

      console.log('✅ Usuarios migrados: usernames asignados');
    } catch (e) {
      console.log('Error en migración de usuarios:', e.message);
    }

    // Hacer username UNIQUE después de la migración
    try {
      await pool.query('ALTER TABLE usuarios ADD CONSTRAINT usuarios_username_unique UNIQUE (username)');
    } catch (e) {
      console.log('Constraint de username ya existe o error:', e.message);
    }

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
        'INSERT INTO usuarios (username, email, password, rol, nombre) VALUES ($1, $2, $3, $4, $5)',
        ['admin', 'admin@infiniguard.com', '123', 'admin', 'Administrador']
      );

      console.log('✅ Usuario administrador creado:');
      console.log('   Usuario: admin');
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

    // Tabla PNC (Reportes)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pnc_reports (
        id TEXT PRIMARY KEY,
        folio TEXT,
        cliente TEXT,
        fecha DATE,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla Usuarios DAE (Independientes)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dae_users (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'usuario'
      )
    `);

    // Tabla Catálogos DAE (Estandarización)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dae_catalogs (
        id SERIAL PRIMARY KEY,
        categoria TEXT NOT NULL, -- 'defecto', 'area', 'operador', 'supervisor'
        valor TEXT NOT NULL,
        UNIQUE(categoria, valor)
      )
    `);

    // Insertar usuario administrador por defecto para DAE si no existe
    const daeAdminCheck = await pool.query('SELECT 1 FROM dae_users WHERE email = $1', ['admin@dae.com']);
    if (daeAdminCheck.rowCount === 0) {
      await pool.query(
        'INSERT INTO dae_users (nombre, email, password, rol) VALUES ($1, $2, $3, $4)',
        ['Admin DAE', 'admin@dae.com', 'dae123', 'admin']
      );
    }

    // Pre-poblar catálogos DAE si están vacíos
    const catalogCheck = await pool.query('SELECT 1 FROM dae_catalogs LIMIT 1');
    if (catalogCheck.rowCount === 0) {
      const defaultAreas = [
        'Limpieza y Entubado', 'Rolado', 'Expansión', 'Burst Test',
        'Leak Test', 'Hydro Test', 'Lavado', 'Pintura'
      ];
      const defaultDefects = [
        'Pieza Mal Ensamblada', 'Pieza Dañada', 'Sin Identificación', 'Laminado',
        'Fuga de Helio', 'Fuga de Agua', 'Fuga de Aire', 'Falta de Roscas',
        'Enterrones con Diodo', 'Roscas Dañadas', 'Grietas', 'Mal Corte',
        'Mal Identificada', 'Planicidad', 'Tubo de Cobre Dañado', 'Mala Nivelación',
        'Inclusiones', 'Falta de Fusión', 'Falta de Penetración', 'Porosidad',
        'Garganta Insuficiente', 'Pierna Insuficiente', 'Corte Biselado',
        'Pintura Mal Aplicada', 'Oxidación', 'Poros', 'Socavados', 'Falta de Limpieza',
        'Falta de Soldadura', 'Falta de Remates', 'Medida Fuera de Especificación',
        'Falta de Componentes', 'Solape', 'Mala Expansión', 'Dobles Invertido'
      ];
      const defaultAuditors = [
        'Auditor de Calidad 1', 'Auditor de Calidad 2'
      ];

      for (const area of defaultAreas) {
        await pool.query('INSERT INTO dae_catalogs (categoria, valor) VALUES ($1, $2)', ['area', area]);
      }
      for (const defect of defaultDefects) {
        await pool.query('INSERT INTO dae_catalogs (categoria, valor) VALUES ($1, $2)', ['defecto', defect]);
      }
      for (const auditor of defaultAuditors) {
        await pool.query('INSERT INTO dae_catalogs (categoria, valor) VALUES ($1, $2)', ['auditor', auditor]);
      }
      console.log('✅ Catálogos DAE pre-poblados correctamente');
    }





  } catch (err) {
    console.error('❌ Error inicializando DB:', err.message);
  }
};

initDB();

// --- CONFIGURACIÓN DE ARCHIVOS ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Carpeta específica para documentos (cotizaciones, órdenes, reportes)
const DOCUMENTOS_DIR = path.join(UPLOADS_DIR, 'documentos');
if (!fs.existsSync(DOCUMENTOS_DIR)) fs.mkdirSync(DOCUMENTOS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, Date.now() + '-' + cleanName);
  }
});
const upload = multer({ storage });

// Configuración específica para PDFs de documentos
const storageDocumentos = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DOCUMENTOS_DIR),
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, Date.now() + '-' + cleanName);
  }
});
const uploadDocumentos = multer({ 
  storage: storageDocumentos,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Registrar rutas de documentos
app.use('/api', crearRutasDocumentos(pool));
app.use('/api/pnc', crearRutasPNC(pool));
app.use('/api/dae', crearRutasDAE(pool));



// --- RUTAS ---

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1 AND password = $2', [username, password]);
    const user = result.rows[0];
    if (user) res.json({ success: true, user });
    else res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
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

    // 📧 Notificar a TODOS los admins con notificaciones activas
    const cotizacion = {
      id: result.rows[0].id,
      titulo: data.titulo,
      cliente: data.cliente,
      usuario: data.usuario,
      tipoServicio: data.tipo,
      descripcion: data.descripcion,
      fecha: new Date().toISOString()
    };
    notificarNuevaCotizacion(cotizacion, pool).catch(err => console.error('❌ Error enviando email:', err));

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/servicios/:id', uploadDocumentos.single('archivo'), async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  let estadoCambiado = false;

  try {
    if (req.file) {
      const pdfPath = `uploads/documentos/${req.file.filename}`;
      await pool.query('UPDATE servicios SET pdfCotizacion = $1 WHERE id = $2', [pdfPath, id]);
    }

    if (update.estado) {
      await pool.query('UPDATE servicios SET estado = $1 WHERE id = $2', [update.estado, id]);
      estadoCambiado = true;
      
      // 📧 Si es finalizado, notificar a TODOS los admins
      if (update.estado === 'finalizado') {
        const servicioResult = await pool.query('SELECT * FROM servicios WHERE id = $1', [id]);
        notificarAdminServicioCompletado(
          servicioResult.rows[0],
          servicioResult.rows[0].tecnicoAsignado || servicioResult.rows[0].tecnico,
          pool
        ).catch(err => console.error('❌ Error enviando email:', err));
      }
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
      
      // 📧 Notificar al técnico sobre nueva tarea
      const tecnicoResult = await pool.query('SELECT email FROM usuarios WHERE nombre = $1', [update.tecnicoAsignado]);
      if (tecnicoResult.rows[0]?.email) {
        const servicioResult = await pool.query('SELECT * FROM servicios WHERE id = $1', [id]);
        notificarTecnicoNuevaTarea(tecnicoResult.rows[0].email, servicioResult.rows[0], pool).catch(err => console.error('❌ Error enviando email:', err));
      }
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

    if (update.folio) {
      await pool.query('UPDATE servicios SET folio = $1 WHERE id = $2', [update.folio, id]);
    }

    // Si cambió el estado, notificar al cliente
    if (estadoCambiado) {
      const servicio = await pool.query('SELECT * FROM servicios WHERE id = $1', [id]);
      if (servicio.rows[0]) {
        const usuario = await pool.query('SELECT email FROM usuarios WHERE nombre = $1', [servicio.rows[0].usuario || servicio.rows[0].cliente]);
        if (usuario.rows[0]?.email) {
          notificarCambioEstado(usuario.rows[0].email, servicio.rows[0], pool).catch(err => console.error('❌ Error enviando email:', err));
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error en PUT:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, email, password, nombre, telefono } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos' });

  try {
    const exists = await pool.query('SELECT 1 FROM usuarios WHERE username = $1', [username]);
    if (exists.rowCount > 0) return res.status(409).json({ success: false, message: 'El nombre de usuario ya está en uso' });

    const result = await pool.query(
      'INSERT INTO usuarios (username, email, password, rol, nombre, telefono) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [username, email || null, password, 'usuario', nombre || username, telefono || null]
    );

    // Enviar email de bienvenida solo si tiene email (no bloqueante)
    if (email) {
      enviarEmailBienvenida(result.rows[0]).catch(err => console.error('Error enviando email:', err));
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const { username, nombre, email, password, rol, telefono } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (username, nombre, email, password, rol, telefono) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [username, nombre, email || null, password, rol, telefono || null]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, rol, telefono, notificaciones_activas } = req.body;
  try {
    if (password) {
      await pool.query(
        'UPDATE usuarios SET nombre = $1, email = $2, password = $3, rol = $4, telefono = $5, notificaciones_activas = $6 WHERE id = $7',
        [nombre, email || null, password, rol, telefono || null, notificaciones_activas !== undefined ? notificaciones_activas : true, id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET nombre = $1, email = $2, rol = $3, telefono = $4, notificaciones_activas = $5 WHERE id = $6',
        [nombre, email || null, rol, telefono || null, notificaciones_activas !== undefined ? notificaciones_activas : true, id]
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

// Obtener el próximo número de cotización
app.get('/api/standalone-cotizaciones/next-number', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT numero FROM cotizaciones 
      WHERE numero LIKE 'COT-%' 
      ORDER BY numero DESC 
      LIMIT 1
    `);
    
    let nextNumber = 13000; // número inicial
    if (rows.length > 0) {
      const lastNumber = parseInt(rows[0].numero.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    
    const formattedNumber = `COT-${nextNumber.toString().padStart(6, '0')}`;
    res.json({ success: true, numero: formattedNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/standalone-cotizaciones', async (req, res) => {
  const { numero, fecha, cliente_nombre, titulo, datos, pdf_url, total, isUpdate, oldNumero } = req.body;
  try {
    if (isUpdate) {
      // Si hay oldNumero, significa que se está cambiando el número
      const numeroActualizar = oldNumero || numero;
      
      await pool.query(`
        UPDATE cotizaciones SET
          numero = $1,
          fecha = $2,
          cliente_nombre = $3,
          titulo = $4,
          datos = $5,
          pdf_url = $6,
          total = $7
        WHERE numero = $8
      `, [numero, fecha, cliente_nombre, titulo, JSON.stringify(datos), pdf_url, total, numeroActualizar]);
    } else {
      // Crear nueva cotización
      await pool.query(`
        INSERT INTO cotizaciones (numero, fecha, cliente_nombre, titulo, datos, pdf_url, total)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [numero, fecha, cliente_nombre, titulo, JSON.stringify(datos), pdf_url, total]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/standalone-cotizaciones/upload', uploadDocumentos.single('pdf'), (req, res) => {
  if (req.file) {
    res.json({ success: true, url: `uploads/documentos/${req.file.filename}` });
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
