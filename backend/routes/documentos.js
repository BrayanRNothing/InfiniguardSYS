import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DocumentoHelpers } from '../migrations/documentos.js';
import {
    Cotizacion,
    OrdenTrabajo,
    ReporteTrabajo,
    EventoHistorial,
    TipoDocumento,
    validarDocumento,
    DocumentoConverter
} from '../models/documento.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuración de multer para PDFs
const DOCUMENTOS_DIR = path.join(__dirname, '..', 'uploads', 'documentos');
if (!fs.existsSync(DOCUMENTOS_DIR)) {
    fs.mkdirSync(DOCUMENTOS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, DOCUMENTOS_DIR),
    filename: (req, file, cb) => {
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${Date.now()}-${cleanName}`);
    }
});

const uploadPDF = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'));
        }
    }
});

/**
 * Crear rutas de documentos
 */
export function crearRutasDocumentos(pool) {

    // ==========================================
    // OBTENER DOCUMENTOS DE UN SERVICIO
    // ==========================================
    router.get('/servicios/:id/documentos', async (req, res) => {
        const { id } = req.params;

        try {
            const documentos = await DocumentoHelpers.obtenerDocumentos(pool, id);
            res.json({ success: true, documentos });
        } catch (error) {
            console.error('Error obteniendo documentos:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==========================================
    // OBTENER TODAS LAS COTIZACIONES (Global)
    // ==========================================
    router.get('/documentos/cotizaciones', async (req, res) => {
        try {
            const cotizaciones = await DocumentoHelpers.obtenerTodasLasCotizaciones(pool);
            res.json({ success: true, cotizaciones });
        } catch (error) {
            console.error('CRITICAL ERROR obteniendo todas las cotizaciones:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                detail: error.detail,
                hint: error.hint,
                code: error.code
            });
        }
    });

    // ==========================================
    // OBTENER HISTORIAL DE UN SERVICIO
    // ==========================================
    router.get('/servicios/:id/historial', async (req, res) => {
        const { id } = req.params;

        try {
            const historial = await DocumentoHelpers.obtenerHistorial(pool, id);
            res.json({ success: true, historial });
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==========================================
    // GUARDAR COTIZACIÓN
    // ==========================================
    router.post('/servicios/:id/cotizacion', uploadPDF.single('pdf'), async (req, res) => {
        const { id } = req.params;
        const data = JSON.parse(req.body.data || '{}');

        try {
            // Crear cotización
            const cotizacion = new Cotizacion(data);

            // Agregar URL del PDF si se subió
            if (req.file) {
                cotizacion.pdfUrl = `uploads/documentos/${req.file.filename}`;
            }

            // Validar
            validarDocumento(cotizacion, TipoDocumento.COTIZACION);

            // Guardar en base de datos
            await DocumentoHelpers.agregarDocumento(pool, id, cotizacion.toJSON());

            // Agregar evento al historial
            const evento = new EventoHistorial(
                'cotizacion_creada',
                `Cotización #${cotizacion.numero} creada`,
                data.creadoPor,
                { numero: cotizacion.numero, total: cotizacion.total }
            );
            await DocumentoHelpers.agregarEvento(pool, id, evento.toJSON());

            res.json({ success: true, cotizacion });
        } catch (error) {
            console.error('Error guardando cotización:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==========================================
    // ELIMINAR DOCUMENTO
    // ==========================================
    router.delete('/servicios/:id/documentos/:numero', async (req, res) => {
        const { id, numero } = req.params;

        try {
            await DocumentoHelpers.eliminarDocumento(pool, id, numero);

            // Agregar evento al historial
            const evento = new EventoHistorial(
                'documento_eliminado',
                `Documento #${numero} eliminado`,
                req.query.usuario || 'Sistema',
                { numero }
            );
            await DocumentoHelpers.agregarEvento(pool, id, evento.toJSON());

            res.json({ success: true, message: 'Documento eliminado' });
        } catch (error) {
            console.error('Error eliminando documento:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==========================================
    // ACTUALIZAR DOCUMENTO
    // ==========================================
    router.put('/servicios/:id/documentos/:numero', uploadPDF.single('pdf'), async (req, res) => {
        const { id, numero } = req.params;
        const data = JSON.parse(req.body.data || '{}');

        try {
            // Si hay un nuevo PDF, actualizar la URL
            if (req.file) {
                data.pdfUrl = `uploads/documentos/${req.file.filename}`;
            }

            const documento = await DocumentoHelpers.actualizarDocumento(pool, id, numero, data);

            // Evento al historial
            const evento = new EventoHistorial(
                'documento_actualizado',
                `Documento #${numero} actualizado`,
                data.actualizadoPor || 'Sistema',
                { numero }
            );
            await DocumentoHelpers.agregarEvento(pool, id, evento.toJSON());

            res.json({ success: true, documento });
        } catch (error) {
            console.error('Error actualizando documento:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==========================================
    // CREAR ORDEN DE TRABAJO (desde cotización o independiente)
    // ==========================================
    router.post('/servicios/:id/orden-trabajo', uploadPDF.single('pdf'), async (req, res) => {
        const { id } = req.params;
        const data = JSON.parse(req.body.data || '{}');

        try {
            // Si viene de una cotización, obtener datos base
            let datosBase = data;
            if (data.desdeCotizacion && data.cotizacionNumero) {
                const documentos = await DocumentoHelpers.obtenerDocumentos(pool, id);
                const cotizacion = documentos.find(
                    doc => doc.tipo === TipoDocumento.COTIZACION && doc.numero === data.cotizacionNumero
                );

                if (cotizacion) {
                    datosBase = {
                        ...DocumentoConverter.cotizacionAOrden(cotizacion),
                        ...data // Permitir override de datos
                    };
                }
            }

            // Crear orden de trabajo
            const orden = new OrdenTrabajo(datosBase);

            // Agregar URL del PDF
            if (req.file) {
                orden.pdfUrl = `uploads/documentos/${req.file.filename}`;
            }

            // Validar
            validarDocumento(orden, TipoDocumento.ORDEN_TRABAJO);

            // Guardar
            await DocumentoHelpers.agregarDocumento(pool, id, orden.toJSON());

            // Evento al historial
            const evento = new EventoHistorial(
                'orden_trabajo_creada',
                `Orden de Trabajo #${orden.numero} creada${orden.cotizacionRef ? ` desde cotización #${orden.cotizacionRef}` : ''}`,
                data.creadoPor,
                { numero: orden.numero, cotizacionRef: orden.cotizacionRef }
            );
            await DocumentoHelpers.agregarEvento(pool, id, evento.toJSON());

            res.json({ success: true, orden });
        } catch (error) {
            console.error('Error creando orden de trabajo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==========================================
    // CREAR REPORTE DE TRABAJO (desde orden o independiente)
    // ==========================================
    router.post('/servicios/:id/reporte', uploadPDF.single('pdf'), async (req, res) => {
        const { id } = req.params;
        const data = JSON.parse(req.body.data || '{}');

        try {
            // Si viene de una orden, obtener datos base
            let datosBase = data;
            if (data.desdeOrden && data.ordenNumero) {
                const documentos = await DocumentoHelpers.obtenerDocumentos(pool, id);
                const orden = documentos.find(
                    doc => doc.tipo === TipoDocumento.ORDEN_TRABAJO && doc.numero === data.ordenNumero
                );

                if (orden) {
                    datosBase = {
                        ...DocumentoConverter.ordenAReporte(orden),
                        ...data
                    };
                }
            }

            // Crear reporte
            const reporte = new ReporteTrabajo(datosBase);

            // Agregar URL del PDF
            if (req.file) {
                reporte.pdfUrl = `uploads/documentos/${req.file.filename}`;
            }

            // Validar
            validarDocumento(reporte, TipoDocumento.REPORTE_TRABAJO);

            // Guardar
            await DocumentoHelpers.agregarDocumento(pool, id, reporte.toJSON());

            // Evento al historial
            const evento = new EventoHistorial(
                'reporte_trabajo_creado',
                `Reporte de Trabajo #${reporte.numero} creado${reporte.ordenTrabajoRef ? ` desde orden #${reporte.ordenTrabajoRef}` : ''}`,
                data.creadoPor,
                { numero: reporte.numero, ordenRef: reporte.ordenTrabajoRef }
            );
            await DocumentoHelpers.agregarEvento(pool, id, evento.toJSON());

            res.json({ success: true, reporte });
        } catch (error) {
            console.error('Error creando reporte:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==========================================
    // OBTENER DATOS PARA CONVERSIÓN
    // ==========================================
    router.get('/servicios/:id/convertir/:tipo/:numero', async (req, res) => {
        const { id, tipo, numero } = req.params;

        try {
            const documentos = await DocumentoHelpers.obtenerDocumentos(pool, id);
            const documento = documentos.find(doc => doc.tipo === tipo && doc.numero === numero);

            if (!documento) {
                return res.status(404).json({
                    success: false,
                    message: 'Documento no encontrado'
                });
            }

            let datosConvertidos = {};

            if (tipo === TipoDocumento.COTIZACION) {
                datosConvertidos = DocumentoConverter.cotizacionAOrden(documento);
            } else if (tipo === TipoDocumento.ORDEN_TRABAJO) {
                datosConvertidos = DocumentoConverter.ordenAReporte(documento);
            }

            res.json({ success: true, datos: datosConvertidos, documentoOriginal: documento });
        } catch (error) {
            console.error('Error convirtiendo documento:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
}


export default crearRutasDocumentos;
