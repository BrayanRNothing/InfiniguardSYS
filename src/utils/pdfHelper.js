/**
 * Helper para guardar PDFs generados en el backend
 * Usa este helper después de generar un PDF con jsPDF
 */

import { guardarDocumento } from './documentStorage';

/**
 * Convierte un PDF de jsPDF a Blob
 * @param {jsPDF} doc - Documento jsPDF
 * @returns {Blob} Blob del PDF
 */
export function pdfToBlob(doc) {
    const pdfData = doc.output('blob');
    return pdfData;
}

/**
 * Convierte un Blob a File
 * @param {Blob} blob - Blob del PDF
 * @param {string} filename - Nombre del archivo
 * @returns {File} Archivo PDF
 */
export function blobToFile(blob, filename) {
    return new File([blob], filename, { type: 'application/pdf' });
}

/**
 * Guarda un PDF generado con jsPDF en el backend
 * @param {jsPDF} doc - Documento jsPDF generado
 * @param {number} servicioId - ID del servicio
 * @param {string} tipoDocumento - Tipo: 'cotizacion', 'orden-trabajo', 'reporte'
 * @param {Object} datosDocumento - Datos del documento (número, cliente, productos, etc.)
 * @param {string} filename - Nombre del archivo PDF
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function guardarPDFEnBackend(doc, servicioId, tipoDocumento, datosDocumento, filename) {
    try {
        // Convertir PDF a File
        const pdfBlob = pdfToBlob(doc);
        const pdfFile = blobToFile(pdfBlob, filename);

        // Guardar en backend
        const response = await guardarDocumento(servicioId, tipoDocumento, datosDocumento, pdfFile);

        return response;
    } catch (error) {
        console.error('Error guardando PDF en backend:', error);
        throw error;
    }
}

/**
 * Ejemplo de uso en CrearOrdenTrabajo.jsx:
 * 
 * import { guardarPDFEnBackend } from '../../utils/pdfHelper';
 * 
 * const generarPDF = async () => {
 *   // ... código existente de generación de PDF ...
 *   
 *   const doc = new jsPDF();
 *   // ... generar contenido del PDF ...
 *   
 *   // Guardar localmente (como antes)
 *   const fileName = `Orden_Trabajo_${formData.cliente}_${formData.fecha}.pdf`;
 *   doc.save(fileName);
 *   
 *   // NUEVO: Guardar en backend también
 *   try {
 *     const datosDocumento = {
 *       numero: currentOrderNumber,
 *       fecha: formData.fecha,
 *       cliente: {
 *         nombre: formData.cliente,
 *         direccion: formData.direccion,
 *         contacto: formData.contacto
 *       },
 *       productos: items,
 *       tecnicoAsignado: formData.vendedor,
 *       observaciones: formData.observaciones,
 *       creadoPor: usuario?.nombre || 'Admin'
 *     };
 *     
 *     // Asumiendo que tienes un servicioId disponible
 *     const servicioId = 1; // O el ID real del servicio
 *     
 *     await guardarPDFEnBackend(
 *       doc, 
 *       servicioId, 
 *       'orden-trabajo', 
 *       datosDocumento, 
 *       fileName
 *     );
 *     
 *     toast.success('PDF guardado en historial');
 *   } catch (error) {
 *     console.error('Error guardando en backend:', error);
 *     // No mostrar error al usuario, el PDF local ya se descargó
 *   }
 * };
 */
