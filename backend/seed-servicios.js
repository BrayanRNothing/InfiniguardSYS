// Script para insertar servicios de ejemplo finalizados con comisiones
// Ejecutar con: node seed-servicios.js

import Database from 'better-sqlite3';

const db = new Database('database.db');

console.log('🔄 Iniciando población de base de datos...\n');

// ============================================
// 1. CREAR USUARIOS (TÉCNICOS Y CLIENTES)
// ============================================

const usuarios = [
    {
        email: 'carlos.mendez@updm.com',
        password: 'tecnico123',
        rol: 'tecnico',
        nombre: 'Carlos Méndez'
    },
    {
        email: 'juan.perez@updm.com',
        password: 'tecnico123',
        rol: 'tecnico',
        nombre: 'Juan Pérez'
    },
    {
        email: 'maria.gonzalez@email.com',
        password: 'cliente123',
        rol: 'usuario',
        nombre: 'María González'
    },
    {
        email: 'contacto@empresaabc.com',
        password: 'cliente123',
        rol: 'usuario',
        nombre: 'Empresa ABC S.A.'
    },
    {
        email: 'roberto.sanchez@email.com',
        password: 'cliente123',
        rol: 'usuario',
        nombre: 'Roberto Sánchez'
    }
];

console.log('👥 Creando usuarios...\n');

const stmtUsuario = db.prepare(`
  INSERT OR IGNORE INTO usuarios (email, password, rol, nombre)
  VALUES (@email, @password, @rol, @nombre)
`);

let usuariosCreados = 0;
for (const usuario of usuarios) {
    try {
        const result = stmtUsuario.run(usuario);
        if (result.changes > 0) {
            usuariosCreados++;
            console.log(`✅ ${usuario.nombre} (${usuario.rol})`);
        } else {
            console.log(`⏭️  ${usuario.nombre} ya existe`);
        }
    } catch (error) {
        console.error(`❌ Error creando ${usuario.nombre}:`, error.message);
    }
}

console.log(`\n📊 Usuarios creados: ${usuariosCreados}/${usuarios.length}\n`);

// Obtener IDs de los técnicos
const carlosMendez = db.prepare("SELECT id FROM usuarios WHERE nombre = 'Carlos Méndez'").get();
const juanPerez = db.prepare("SELECT id FROM usuarios WHERE nombre = 'Juan Pérez'").get();

if (!carlosMendez || !juanPerez) {
    console.error('❌ Error: No se encontraron los técnicos en la base de datos');
    db.close();
    process.exit(1);
}

console.log(`🔧 Técnicos encontrados:`);
console.log(`   - Carlos Méndez (ID: ${carlosMendez.id})`);
console.log(`   - Juan Pérez (ID: ${juanPerez.id})\n`);

// ============================================
// 2. CREAR SERVICIOS FINALIZADOS
// ============================================

const serviciosEjemplo = [
    {
        titulo: 'Instalación de Sistema de Alarma',
        cliente: 'María González',
        usuario: 'maria.gonzalez@email.com',
        tecnicoAsignado: 'Carlos Méndez',
        tecnicoId: carlosMendez.id,
        tipo: 'instalacion',
        direccion: 'Av. Reforma 123, Col. Centro',
        telefono: '555-1234',
        descripcion: 'Instalación completa de sistema de alarma perimetral',
        estado: 'finalizado',
        precio: 8500,
        porcentajeComision: 10,
        fecha: '2026-01-05',
        fechaServicio: '2026-01-05',
        notas: 'Servicio completado exitosamente'
    },
    {
        titulo: 'Mantenimiento Preventivo CCTV',
        cliente: 'Empresa ABC S.A.',
        usuario: 'contacto@empresaabc.com',
        tecnicoAsignado: 'Juan Pérez',
        tecnicoId: juanPerez.id,
        tipo: 'mantenimiento',
        direccion: 'Blvd. Industrial 456',
        telefono: '555-5678',
        descripcion: 'Mantenimiento de 12 cámaras de seguridad',
        estado: 'finalizado',
        precio: 3200,
        porcentajeComision: 12,
        fecha: '2026-01-04',
        fechaServicio: '2026-01-04',
        notas: 'Todas las cámaras funcionando correctamente'
    },
    {
        titulo: 'Reparación Control de Acceso',
        cliente: 'Roberto Sánchez',
        usuario: 'roberto.sanchez@email.com',
        tecnicoAsignado: 'Carlos Méndez',
        tecnicoId: carlosMendez.id,
        tipo: 'reparacion',
        direccion: 'Calle Juárez 789',
        telefono: '555-9012',
        descripcion: 'Reparación de lector biométrico',
        estado: 'finalizado',
        precio: 1500,
        porcentajeComision: 15,
        fecha: '2026-01-03',
        fechaServicio: '2026-01-03',
        notas: 'Lector reemplazado y calibrado'
    },
    {
        titulo: 'Instalación de Cámaras IP',
        cliente: 'Tienda La Esperanza',
        usuario: 'gerencia@laesperanza.com',
        tecnicoAsignado: 'Juan Pérez',
        tecnicoId: juanPerez.id,
        tipo: 'instalacion',
        direccion: 'Plaza Comercial Norte, Local 45',
        telefono: '555-3456',
        descripcion: 'Instalación de 8 cámaras IP con grabación en nube',
        estado: 'finalizado',
        precio: 12000,
        porcentajeComision: 10,
        fecha: '2026-01-02',
        fechaServicio: '2026-01-02',
        notas: 'Sistema configurado con acceso remoto'
    },
    {
        titulo: 'Servicio de Configuración de DVR',
        cliente: 'Ana Martínez',
        usuario: 'ana.martinez@email.com',
        tecnicoAsignado: 'Carlos Méndez',
        tecnicoId: carlosMendez.id,
        tipo: 'servicio_general',
        direccion: 'Residencial Los Pinos #234',
        telefono: '555-7890',
        descripcion: 'Configuración y actualización de DVR',
        estado: 'finalizado',
        precio: 800,
        porcentajeComision: 20,
        fecha: '2026-01-01',
        fechaServicio: '2026-01-01',
        notas: 'DVR actualizado a última versión'
    },
    {
        titulo: 'Instalación Cerca Eléctrica',
        cliente: 'Condominio Las Palmas',
        usuario: 'admin@laspalmas.com',
        tecnicoAsignado: 'Juan Pérez',
        tecnicoId: juanPerez.id,
        tipo: 'instalacion',
        direccion: 'Fraccionamiento Las Palmas',
        telefono: '555-2468',
        descripcion: 'Instalación de cerca eléctrica perimetral 150m',
        estado: 'finalizado',
        precio: 25000,
        porcentajeComision: 8,
        fecha: '2025-12-30',
        fechaServicio: '2025-12-30',
        notas: 'Instalación completa con garantía de 2 años'
    },
    {
        titulo: 'Mantenimiento Sistema de Alarma',
        cliente: 'Luis Hernández',
        usuario: 'luis.hernandez@email.com',
        tecnicoAsignado: 'Carlos Méndez',
        tecnicoId: carlosMendez.id,
        tipo: 'mantenimiento',
        direccion: 'Av. Universidad 567',
        telefono: '555-1357',
        descripcion: 'Revisión y mantenimiento anual',
        estado: 'finalizado',
        precio: 1200,
        porcentajeComision: 15,
        fecha: '2025-12-28',
        fechaServicio: '2025-12-28',
        notas: 'Sistema funcionando óptimamente'
    },
    {
        titulo: 'Instalación Videoportero',
        cliente: 'Familia Rodríguez',
        usuario: 'rodriguez.fam@email.com',
        tecnicoAsignado: 'Juan Pérez',
        tecnicoId: juanPerez.id,
        tipo: 'instalacion',
        direccion: 'Privada San Miguel #12',
        telefono: '555-8642',
        descripcion: 'Instalación de videoportero con monitor 7"',
        estado: 'finalizado',
        precio: 4500,
        porcentajeComision: 12,
        fecha: '2025-12-27',
        fechaServicio: '2025-12-27',
        notas: 'Cliente muy satisfecho con el servicio'
    },
    {
        titulo: 'Reparación de Sensores',
        cliente: 'Oficinas Corporativas XYZ',
        usuario: 'it@corporativoxyz.com',
        tecnicoAsignado: 'Carlos Méndez',
        tecnicoId: carlosMendez.id,
        tipo: 'reparacion',
        direccion: 'Torre Empresarial, Piso 8',
        telefono: '555-9753',
        descripcion: 'Reparación de 5 sensores de movimiento',
        estado: 'finalizado',
        precio: 2800,
        porcentajeComision: 10,
        fecha: '2025-12-26',
        fechaServicio: '2025-12-26',
        notas: 'Sensores reemplazados y probados'
    },
    {
        titulo: 'Instalación Sistema Completo',
        cliente: 'Restaurante El Buen Sabor',
        usuario: 'gerente@elbuensabor.com',
        tecnicoAsignado: 'Juan Pérez',
        tecnicoId: juanPerez.id,
        tipo: 'instalacion',
        direccion: 'Zona Gastronómica, Local 3',
        telefono: '555-1593',
        descripcion: 'Sistema completo: alarma, CCTV y control de acceso',
        estado: 'finalizado',
        precio: 18500,
        porcentajeComision: 10,
        fecha: '2025-12-25',
        fechaServicio: '2025-12-25',
        notas: 'Instalación completa en un día'
    }
];

console.log('🔧 Insertando servicios finalizados...\n');

const stmtServicio = db.prepare(`
  INSERT INTO servicios (
    titulo, cliente, usuario, tecnicoAsignado, tecnicoId, tipo,
    direccion, telefono, descripcion, estado, precioEstimado, porcentajeComision,
    fecha, fechaServicio, notas
  ) VALUES (
    @titulo, @cliente, @usuario, @tecnicoAsignado, @tecnicoId, @tipo,
    @direccion, @telefono, @descripcion, @estado, @precio, @porcentajeComision,
    @fecha, @fechaServicio, @notas
  )
`);

let serviciosInsertados = 0;
for (const servicio of serviciosEjemplo) {
    try {
        stmtServicio.run(servicio);
        serviciosInsertados++;
        console.log(`✅ ${servicio.titulo} - $${servicio.precio.toLocaleString()} (${servicio.porcentajeComision}% comisión)`);
    } catch (error) {
        console.error(`❌ Error insertando ${servicio.titulo}:`, error.message);
    }
}

console.log(`\n📊 Servicios insertados: ${serviciosInsertados}/${serviciosEjemplo.length}\n`);

// ============================================
// 3. RESUMEN DE COMISIONES
// ============================================

console.log('💰 Resumen de comisiones por técnico:\n');

const totales = {};
serviciosEjemplo.forEach(s => {
    if (!totales[s.tecnicoAsignado]) {
        totales[s.tecnicoAsignado] = { servicios: 0, total: 0, comision: 0 };
    }
    totales[s.tecnicoAsignado].servicios++;
    totales[s.tecnicoAsignado].total += s.precio;
    totales[s.tecnicoAsignado].comision += (s.precio * s.porcentajeComision / 100);
});

Object.entries(totales).forEach(([tecnico, datos]) => {
    console.log(`🔧 ${tecnico}:`);
    console.log(`   - Servicios completados: ${datos.servicios}`);
    console.log(`   - Total facturado: $${datos.total.toLocaleString()}`);
    console.log(`   - Comisión ganada: $${datos.comision.toLocaleString()}`);
    console.log(`   - Promedio por servicio: $${(datos.comision / datos.servicios).toLocaleString()}\n`);
});

const totalGeneral = Object.values(totales).reduce((sum, t) => sum + t.comision, 0);
console.log(`💵 Total comisiones: $${totalGeneral.toLocaleString()}\n`);

db.close();
console.log('✅ Base de datos cerrada. ¡Listo para probar el sistema de comisiones! 🎉');
