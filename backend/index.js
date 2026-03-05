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

    // Tabla Órdenes de Trabajo
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ordenes_trabajo (
        id SERIAL PRIMARY KEY,
        numero TEXT UNIQUE,
        fecha DATE,
        cliente_nombre TEXT,
        titulo TEXT,
        datos JSONB,
        pdf_url TEXT
      )
    `);

    // Tabla Reportes de Trabajo
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reportes_trabajo (
        id SERIAL PRIMARY KEY,
        numero TEXT UNIQUE,
        fecha DATE,
        cliente_nombre TEXT,
        datos JSONB,
        pdf_url TEXT
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

// Middleware para manejar rutas de archivos antiguas (uploads/) y nuevas (uploads/documentos/)
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(UPLOADS_DIR, req.path);
  
  // Si el archivo existe en la ruta solicitada, servirlo
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  
  // Si no existe y no es una ruta de documentos, buscar en documentos/
  if (!req.path.startsWith('/documentos/')) {
    const altPath = path.join(DOCUMENTOS_DIR, req.path);
    if (fs.existsSync(altPath) && fs.statSync(altPath).isFile()) {
      return res.sendFile(altPath);
    }
  }
  
  // Fallback al static normal
  next();
});

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
    const tipo = req.query.tipo || 'COT'; // Default a COT si no se especifica
    
    // Definir tabla, patrón y número inicial según el tipo
    const config = {
      'COT': { table: 'cotizaciones', pattern: 'COT-%', inicial: 13000 },
      'OT': { table: 'ordenes_trabajo', pattern: 'OT-%', inicial: 14000 },
      'RT': { table: 'reportes_trabajo', pattern: 'RT-%', inicial: 15000 }
    };
    
    const { table, pattern, inicial } = config[tipo] || config['COT'];
    
    const { rows } = await pool.query(`
      SELECT numero FROM ${table}
      WHERE numero LIKE $1
      ORDER BY numero DESC 
      LIMIT 1
    `, [pattern]);
    
    let nextNumber = inicial;
    if (rows.length > 0) {
      const lastNumber = parseInt(rows[0].numero.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    
    const formattedNumber = `${tipo}-${nextNumber.toString().padStart(6, '0')}`;
    res.json({ success: true, numero: formattedNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/standalone-cotizaciones', async (req, res) => {
  const { numero, fecha, cliente_nombre, titulo, datos, pdf_url, total, isUpdate, oldNumero, oldPdfUrl } = req.body;
  
  // Log para debug
  console.log('📝 Guardando cotización:', { numero, cliente_nombre, titulo, isUpdate, oldNumero, hasPdfUrl: !!pdf_url, pdfUrl: pdf_url });
  
  try {
    // Asegurar que datos sea un objeto válido o string JSON
    let datosJSON;
    if (typeof datos === 'string') {
      datosJSON = datos;
    } else if (datos && typeof datos === 'object') {
      datosJSON = JSON.stringify(datos);
    } else {
      datosJSON = null;
    }
    
    // Extraer cliente_nombre de datos si no viene directamente
    const clienteNombreFinal = cliente_nombre || datos?.cliente?.nombre || datos?.clienteNombre || null;
    const tituloFinal = titulo || datos?.titulo || null;
    const fechaFinal = fecha || datos?.fecha || null;
    const totalFinal = total || datos?.total || 0;
    const pdfUrlFinal = pdf_url || datos?.pdfUrl || null;
    
    if (!numero) {
      return res.status(400).json({ success: false, message: 'El número de cotización es requerido' });
    }
    
    if (!clienteNombreFinal) {
      return res.status(400).json({ success: false, message: 'El nombre del cliente es requerido' });
    }
    
    if (isUpdate) {
      // Si hay oldNumero, significa que se está cambiando el número
      const numeroActualizar = oldNumero || numero;
      
      console.log('🔄 Actualizando cotización:', numeroActualizar, '→', numero, 'con PDF:', pdfUrlFinal);
      
      const updateResult = await pool.query(`
        UPDATE cotizaciones SET
          numero = $1,
          fecha = $2,
          cliente_nombre = $3,
          titulo = $4,
          datos = $5,
          pdf_url = $6,
          total = $7
        WHERE numero = $8
        RETURNING numero
      `, [numero, fechaFinal, clienteNombreFinal, tituloFinal, datosJSON, pdfUrlFinal, totalFinal, numeroActualizar]);

      if (updateResult.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Cotización no encontrada para actualizar' });
      }

      // 📌 NO eliminar PDFs antiguos - mantener histórico de cambios
      // Los PDFs son inmutables, cambios de estética no afectan acceso histórico
      if (oldPdfUrl && pdfUrlFinal && oldPdfUrl !== pdfUrlFinal) {
        console.log('ℹ️ PDF actualizado de:', oldPdfUrl, 'a:', pdfUrlFinal, '(PDFs antiguos se mantienen para referencia histórica)');
      }

    } else {
      console.log('➕ Creando nueva cotización:', numero, 'con PDF:', pdfUrlFinal);
      
      // Verificar si ya existe
      const exists = await pool.query('SELECT numero FROM cotizaciones WHERE numero = $1', [numero]);
      if (exists.rowCount > 0) {
        return res.status(409).json({ success: false, message: 'La cotización ya existe. Número duplicado.' });
      }
      
      // Crear nueva cotización
      const insertResult = await pool.query(`
        INSERT INTO cotizaciones (numero, fecha, cliente_nombre, titulo, datos, pdf_url, total)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING numero
      `, [numero, fechaFinal, clienteNombreFinal, tituloFinal, datosJSON, pdfUrlFinal, totalFinal]);

      if (insertResult.rowCount === 0) {
        return res.status(500).json({ success: false, message: 'Error al insertar la cotización' });
      }
    }
    
    console.log('✅ Cotización guardada exitosamente:', numero, 'PDF URL:', pdfUrlFinal);
    res.json({ success: true, message: 'Cotización guardada correctamente', numero, pdfUrl: pdfUrlFinal });
  } catch (error) {
    console.error('❌ Error guardando cotización:', error.message, error.detail);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/standalone-cotizaciones/upload', uploadDocumentos.single('pdf'), (req, res) => {
  if (req.file) {
    const pdfUrl = `uploads/documentos/${req.file.filename}`;
    console.log('✅ PDF subido exitosamente:', { filename: req.file.filename, size: req.file.size, url: pdfUrl });
    res.json({ success: true, url: pdfUrl, filename: req.file.filename });
  } else {
    console.error('❌ Error: No se recibió archivo PDF');
    res.status(400).json({ success: false, message: 'No se subió ningún archivo PDF' });
  }
});

// ============ ÓRDENES DE TRABAJO (OT) ============
app.get('/api/ordenes-trabajo', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ordenes_trabajo ORDER BY numero DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/ordenes-trabajo', async (req, res) => {
  const { numero, fecha, cliente_nombre, titulo, datos, pdf_url, isUpdate, oldNumero } = req.body;
  
  console.log('📝 Guardando OT:', { numero, cliente_nombre, isUpdate, hasPdfUrl: !!pdf_url });
  
  try {
    let datosJSON = typeof datos === 'string' ? datos : (datos && typeof datos === 'object' ? JSON.stringify(datos) : null);
    const clienteNombreFinal = cliente_nombre || datos?.cliente?.nombre || null;
    const tituloFinal = titulo || datos?.titulo || null;
    const fechaFinal = fecha || datos?.fecha || null;
    const pdfUrlFinal = pdf_url || datos?.pdfUrl || null;
    
    if (!numero) {
      return res.status(400).json({ success: false, message: 'El número de OT es requerido' });
    }
    
    if (!clienteNombreFinal) {
      return res.status(400).json({ success: false, message: 'El nombre del cliente es requerido' });
    }
    
    if (isUpdate) {
      const numeroActualizar = oldNumero || numero;
      const updateResult = await pool.query(`
        UPDATE ordenes_trabajo SET
          numero = $1,
          fecha = $2,
          cliente_nombre = $3,
          titulo = $4,
          datos = $5,
          pdf_url = $6
        WHERE numero = $7
        RETURNING numero
      `, [numero, fechaFinal, clienteNombreFinal, tituloFinal, datosJSON, pdfUrlFinal, numeroActualizar]);

      if (updateResult.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'OT no encontrada para actualizar' });
      }
    } else {
      const exists = await pool.query('SELECT numero FROM ordenes_trabajo WHERE numero = $1', [numero]);
      if (exists.rowCount > 0) {
        return res.status(409).json({ success: false, message: 'La OT ya existe. Número duplicado.' });
      }
      
      const insertResult = await pool.query(`
        INSERT INTO ordenes_trabajo (numero, fecha, cliente_nombre, titulo, datos, pdf_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING numero
      `, [numero, fechaFinal, clienteNombreFinal, tituloFinal, datosJSON, pdfUrlFinal]);

      if (insertResult.rowCount === 0) {
        return res.status(500).json({ success: false, message: 'Error al insertar la OT' });
      }
    }
    
    console.log('✅ OT guardada exitosamente:', numero);
    res.json({ success: true, message: 'OT guardada correctamente', numero, pdfUrl: pdfUrlFinal });
  } catch (error) {
    console.error('❌ Error guardando OT:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/ordenes-trabajo/:numero', async (req, res) => {
  const { numero } = req.params;
  try {
    const result = await pool.query('DELETE FROM ordenes_trabajo WHERE numero = $1', [numero]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'OT no encontrada' });
    }
    res.json({ success: true, message: 'OT eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ REPORTES DE TRABAJO (RT) ============
app.get('/api/reportes-trabajo', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM reportes_trabajo ORDER BY numero DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/reportes-trabajo', async (req, res) => {
  const { numero, fecha, cliente_nombre, datos, pdf_url, isUpdate, oldNumero } = req.body;
  
  console.log('📝 Guardando RT:', { numero, cliente_nombre, isUpdate, hasPdfUrl: !!pdf_url });
  
  try {
    let datosJSON = typeof datos === 'string' ? datos : (datos && typeof datos === 'object' ? JSON.stringify(datos) : null);
    const clienteNombreFinal = cliente_nombre || datos?.cliente?.nombre || null;
    const fechaFinal = fecha || datos?.fecha || null;
    const pdfUrlFinal = pdf_url || datos?.pdfUrl || null;
    
    if (!numero) {
      return res.status(400).json({ success: false, message: 'El número de RT es requerido' });
    }
    
    if (!clienteNombreFinal) {
      return res.status(400).json({ success: false, message: 'El nombre del cliente es requerido' });
    }
    
    if (isUpdate) {
      const numeroActualizar = oldNumero || numero;
      const updateResult = await pool.query(`
        UPDATE reportes_trabajo SET
          numero = $1,
          fecha = $2,
          cliente_nombre = $3,
          datos = $4,
          pdf_url = $5
        WHERE numero = $6
        RETURNING numero
      `, [numero, fechaFinal, clienteNombreFinal, datosJSON, pdfUrlFinal, numeroActualizar]);

      if (updateResult.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'RT no encontrada para actualizar' });
      }
    } else {
      const exists = await pool.query('SELECT numero FROM reportes_trabajo WHERE numero = $1', [numero]);
      if (exists.rowCount > 0) {
        return res.status(409).json({ success: false, message: 'El RT ya existe. Número duplicado.' });
      }
      
      const insertResult = await pool.query(`
        INSERT INTO reportes_trabajo (numero, fecha, cliente_nombre, datos, pdf_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING numero
      `, [numero, fechaFinal, clienteNombreFinal, datosJSON, pdfUrlFinal]);

      if (insertResult.rowCount === 0) {
        return res.status(500).json({ success: false, message: 'Error al insertar el RT' });
      }
    }
    
    console.log('✅ RT guardado exitosamente:', numero);
    res.json({ success: true, message: 'RT guardado correctamente', numero, pdfUrl: pdfUrlFinal });
  } catch (error) {
    console.error('❌ Error guardando RT:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/reportes-trabajo/:numero', async (req, res) => {
  const { numero } = req.params;
  try {
    const result = await pool.query('DELETE FROM reportes_trabajo WHERE numero = $1', [numero]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'RT no encontrado' });
    }
    res.json({ success: true, message: 'RT eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
