    /**
 * Utilidades para almacenar y recuperar documentos del backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Guarda un documento en el backend
 * @param {number} servicioId - ID del servicio
 * @param {string} tipo - Tipo de documento ('cotizacion', 'orden-trabajo', 'reporte')
 * @param {Object} datos - Datos del documento
 * @param {File} pdfFile - Archivo PDF (opcional)
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function guardarDocumento(servicioId, tipo, datos, pdfFile = null) {
    const formData = new FormData();
    formData.append('data', JSON.stringify(datos));

    if (pdfFile) {
        formData.append('pdf', pdfFile);
    }

    const response = await fetch(`${API_URL}/api/servicios/${servicioId}/${tipo}`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error guardando documento');
    }

    return await response.json();
}

/**
 * Obtiene todos los documentos de un servicio
 * @param {number} servicioId - ID del servicio
 * @returns {Promise<Array>} Lista de documentos
 */
export async function obtenerDocumentos(servicioId) {
    const response = await fetch(`${API_URL}/api/servicios/${servicioId}/documentos`);

    if (!response.ok) {
        throw new Error('Error obteniendo documentos');
    }

    const data = await response.json();
    return data.documentos || [];
}

/**
 * Obtiene el historial de un servicio
 * @param {number} servicioId - ID del servicio
 * @returns {Promise<Array>} Lista de eventos del historial
 */
export async function obtenerHistorial(servicioId) {
    const response = await fetch(`${API_URL}/api/servicios/${servicioId}/historial`);

    if (!response.ok) {
        throw new Error('Error obteniendo historial');
    }

    const data = await response.json();
    return data.historial || [];
}

/**
 * Obtiene datos para convertir un documento
 * @param {number} servicioId - ID del servicio
 * @param {string} tipo - Tipo de documento origen
 * @param {string} numero - Número del documento
 * @returns {Promise<Object>} Datos convertidos
 */
export async function obtenerDatosConversion(servicioId, tipo, numero) {
    const response = await fetch(
        `${API_URL}/api/servicios/${servicioId}/convertir/${tipo}/${numero}`
    );

    if (!response.ok) {
        throw new Error('Error obteniendo datos de conversión');
    }

    const data = await response.json();
    return data.datos || {};
}

/**
 * Filtra documentos por tipo
 * @param {Array} documentos - Lista de documentos
 * @param {string} tipo - Tipo de documento a filtrar
 * @returns {Array} Documentos filtrados
 */
export function filtrarPorTipo(documentos, tipo) {
    return documentos.filter(doc => doc.tipo === tipo);
}

/**
 * Busca un documento por número
 * @param {Array} documentos - Lista de documentos
 * @param {string} numero - Número del documento
 * @returns {Object|null} Documento encontrado o null
 */
export function buscarPorNumero(documentos, numero) {
    return documentos.find(doc => doc.numero === numero) || null;
}

/**
 * Ordena documentos por fecha (más reciente primero)
 * @param {Array} documentos - Lista de documentos
 * @returns {Array} Documentos ordenados
 */
export function ordenarPorFecha(documentos) {
    return [...documentos].sort((a, b) => {
        const fechaA = new Date(a.fechaCreacion || a.fecha);
        const fechaB = new Date(b.fechaCreacion || b.fecha);
        return fechaB - fechaA;
    });
}

/**
 * Agrupa documentos por tipo
 * @param {Array} documentos - Lista de documentos
 * @returns {Object} Documentos agrupados por tipo
 */
export function agruparPorTipo(documentos) {
    return documentos.reduce((grupos, doc) => {
        const tipo = doc.tipo || 'otros';
        if (!grupos[tipo]) {
            grupos[tipo] = [];
        }
        grupos[tipo].push(doc);
        return grupos;
    }, {});
}
