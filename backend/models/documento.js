/**
 * Modelo de Documentos
 * Define la estructura de cotizaciones, órdenes de trabajo y reportes
 */

// Tipos de documentos
export const TipoDocumento = {
    COTIZACION: 'cotizacion',
    ORDEN_TRABAJO: 'orden_trabajo',
    REPORTE_TRABAJO: 'reporte_trabajo'
};

// Estados de documentos
export const EstadoDocumento = {
    PENDIENTE: 'pendiente',
    ACEPTADA: 'aceptada',
    RECHAZADA: 'rechazada',
    EN_PROCESO: 'en_proceso',
    COMPLETADA: 'completada'
};

/**
 * Estructura de una Cotización
 */
export class Cotizacion {
    constructor(data = {}) {
        this.tipo = TipoDocumento.COTIZACION;
        this.numero = data.numero || null;
        this.fecha = data.fecha || new Date().toISOString().split('T')[0];
        this.cliente = data.cliente || {};
        this.productos = data.productos || [];
        this.subtotal = data.subtotal || 0;
        this.iva = data.iva || 0;
        this.total = data.total || 0;
        this.moneda = data.moneda || 'MXN';
        this.vigencia = data.vigencia || 30;
        this.notas = data.notas || '';
        this.terminosCondiciones = data.terminosCondiciones || '';
        this.estado = data.estado || EstadoDocumento.PENDIENTE;
        this.pdfUrl = data.pdfUrl || null;
        this.creadoPor = data.creadoPor || null;
        this.fechaCreacion = data.fechaCreacion || new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }
}

/**
 * Estructura de una Orden de Trabajo
 */
export class OrdenTrabajo {
    constructor(data = {}) {
        this.tipo = TipoDocumento.ORDEN_TRABAJO;
        this.numero = data.numero || null;
        this.fecha = data.fecha || new Date().toISOString().split('T')[0];
        this.cliente = data.cliente || {};
        this.direccionEntrega = data.direccionEntrega || '';
        this.productos = data.productos || [];
        this.tecnicoAsignado = data.tecnicoAsignado || null;
        this.fechaProgramada = data.fechaProgramada || null;
        this.observaciones = data.observaciones || '';
        this.checklist = data.checklist || [];
        this.estado = data.estado || EstadoDocumento.PENDIENTE;
        this.pdfUrl = data.pdfUrl || null;
        this.cotizacionRef = data.cotizacionRef || null; // Referencia a cotización origen
        this.creadoPor = data.creadoPor || null;
        this.fechaCreacion = data.fechaCreacion || new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }
}

/**
 * Estructura de un Reporte de Trabajo
 */
export class ReporteTrabajo {
    constructor(data = {}) {
        this.tipo = TipoDocumento.REPORTE_TRABAJO;
        this.numero = data.numero || null;
        this.fecha = data.fecha || new Date().toISOString().split('T')[0];
        this.cliente = data.cliente || {};
        this.tecnicoQueCompleto = data.tecnicoQueCompleto || null;
        this.fechaCompletado = data.fechaCompletado || new Date().toISOString();
        this.trabajosRealizados = data.trabajosRealizados || [];
        this.materialesUtilizados = data.materialesUtilizados || [];
        this.observaciones = data.observaciones || '';
        this.fotos = data.fotos || [];
        this.firmaCliente = data.firmaCliente || null;
        this.firmaTecnico = data.firmaTecnico || null;
        this.estado = data.estado || EstadoDocumento.COMPLETADA;
        this.pdfUrl = data.pdfUrl || null;
        this.ordenTrabajoRef = data.ordenTrabajoRef || null; // Referencia a orden origen
        this.creadoPor = data.creadoPor || null;
        this.fechaCreacion = data.fechaCreacion || new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }
}

/**
 * Entrada de historial
 */
export class EventoHistorial {
    constructor(tipo, descripcion, usuario = null, metadata = {}) {
        this.tipo = tipo;
        this.descripcion = descripcion;
        this.usuario = usuario;
        this.metadata = metadata;
        this.fecha = new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }
}

/**
 * Validar estructura de documento
 */
export function validarDocumento(documento, tipo) {
    if (!documento) {
        throw new Error('Documento no puede ser nulo');
    }

    switch (tipo) {
        case TipoDocumento.COTIZACION:
            if (!documento.cliente || !documento.productos || documento.productos.length === 0) {
                throw new Error('Cotización debe tener cliente y al menos un producto');
            }
            break;

        case TipoDocumento.ORDEN_TRABAJO:
            if (!documento.cliente || !documento.productos || documento.productos.length === 0) {
                throw new Error('Orden de trabajo debe tener cliente y productos');
            }
            break;

        case TipoDocumento.REPORTE_TRABAJO:
            if (!documento.cliente || !documento.tecnicoQueCompleto) {
                throw new Error('Reporte debe tener cliente y técnico');
            }
            break;

        default:
            throw new Error(`Tipo de documento desconocido: ${tipo}`);
    }

    return true;
}

/**
 * Helpers para conversión de documentos
 */
export const DocumentoConverter = {
    /**
     * Convierte una cotización en datos base para orden de trabajo
     */
    cotizacionAOrden(cotizacion) {
        return {
            cliente: cotizacion.cliente,
            productos: cotizacion.productos.map(p => ({
                ...p,
                // Mantener estructura pero permitir edición
            })),
            direccionEntrega: cotizacion.cliente.direccion || '',
            observaciones: cotizacion.notas || '',
            cotizacionRef: cotizacion.numero
        };
    },

    /**
     * Convierte una orden de trabajo en datos base para reporte
     */
    ordenAReporte(orden) {
        return {
            cliente: orden.cliente,
            trabajosRealizados: orden.productos.map(p => ({
                descripcion: p.descripcion,
                cantidad: p.cantidad,
                completado: false
            })),
            materialesUtilizados: [],
            tecnicoQueCompleto: orden.tecnicoAsignado,
            ordenTrabajoRef: orden.numero
        };
    }
};
