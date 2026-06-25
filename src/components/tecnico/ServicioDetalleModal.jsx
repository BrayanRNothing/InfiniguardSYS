import React, { useState } from 'react';
import { getSafeUrl } from '../../utils/helpers';
import InfoItem from '../ui/InfoItem';

function ServicioDetalleModal({ servicio, onClose }) {
    const [imagenZoom, setImagenZoom] = useState(null);

    if (!servicio) return null;

    const fotoUrl = getSafeUrl(servicio.foto);
    const pdfUrl = getSafeUrl(servicio.pdf);

    let pdfsOT = [];
    if (servicio.ordentrabajo) {
        try {
            pdfsOT = JSON.parse(servicio.ordentrabajo);
            if (!Array.isArray(pdfsOT)) pdfsOT = [servicio.ordentrabajo];
        } catch (e) {
            pdfsOT = [servicio.ordentrabajo];
        }
    }

    const handleDescargarArchivo = async (rutaRelativa, nombreArchivo) => {
        if (!rutaRelativa) return;

        const urlCompleta = getSafeUrl(rutaRelativa);

        try {
            const response = await fetch(urlCompleta);
            if (!response.ok) throw new Error('Archivo no disponible');

            const blob = await response.blob();
            const urlBlob = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = urlBlob;
            a.download = nombreArchivo || 'archivo_descarga';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(urlBlob);
        } catch (error) {
            console.error(error);
            alert('Error: Archivo no encontrado');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{servicio.titulo}</h2>
                        <p className="text-sm text-gray-500 capitalize">Tipo: {servicio.tipo}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="space-y-6">
                        {/* Estado */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-600">Estado del Servicio</span>
                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full ${servicio.estado === 'pendiente' ? 'bg-orange-100 text-orange-700' :
                                    servicio.estado === 'aprobado' ? 'bg-green-100 text-green-700' :
                                        servicio.estado === 'en-proceso' ? 'bg-blue-100 text-blue-700' :
                                            servicio.estado === 'finalizado' ? 'bg-purple-100 text-purple-700' :
                                                'bg-gray-100 text-gray-700'
                                    }`}>
                                    {servicio.estado}
                                </span>
                            </div>
                        </div>

                        {/* Información del Proyecto */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-600 uppercase mb-3">Información del Proyecto</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InfoItem label="Lugar de aplicación" value={servicio.direccion} icon="📍" />
                                <InfoItem label="Proyecto" value={servicio.titulo} icon="🏗️" />
                            </div>
                        </div>

                        {/* Información del Servicio */}
                        {servicio.modelo && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-600 uppercase mb-3">Detalles del Servicio</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <InfoItem label="Modelo" value={servicio.modelo} icon="🔖" />
                                </div>
                            </div>
                        )}

                        {/* Descripción Original */}
                        {servicio.descripcion && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">1️⃣ Solicitud Original del Cliente</h4>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                    {servicio.descripcion}
                                </p>
                            </div>
                        )}

                        {/* Propuesta a Ejecutar (Sin precios) */}
                        {servicio.respuestaAdmin && (
                            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                                <h4 className="text-xs font-bold text-yellow-700 uppercase mb-2">2️⃣ Instrucciones / Propuesta Aprobada</h4>
                                <div className="mb-3">
                                    <span className="text-xs font-bold text-yellow-800 block mb-1">Diagnóstico/Propuesta acordada con el cliente:</span>
                                    <p className="text-sm text-yellow-900 leading-relaxed whitespace-pre-line">
                                        {servicio.respuestaAdmin}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Notas */}
                        {servicio.notas && (
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">3️⃣ Notas Adicionales (Administración)</h4>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                    {servicio.notas}
                                </p>
                            </div>
                        )}

                        {/* Fecha/Hora Programada */}
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                            <h4 className="text-xs font-bold text-green-600 uppercase mb-2">4️⃣ Servicio Programado</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <InfoItem label="Fecha" value={servicio.fechaServicio || servicio.fechaservicio || 'Por definir'} icon="📅" />
                                <InfoItem label="Hora" value={servicio.horaServicio || servicio.horaservicio || 'Por definir'} icon="⏰" />
                            </div>
                        </div>

                        {/* Archivos Adjuntos */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-600 uppercase mb-3">Archivos Adjuntos</h3>
                            <div className="flex flex-wrap gap-3">
                                {/* Foto */}
                                {servicio.foto && (
                                    <div
                                        onClick={() => setImagenZoom(fotoUrl)}
                                        className="group relative h-32 w-40 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in hover:shadow-md transition-all"
                                    >
                                        <img
                                            src={fotoUrl}
                                            alt="Evidencia"
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <span className="bg-white/90 text-gray-800 text-xs font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all">
                                                Ver Foto
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Ordenes de Trabajo (OT) */}
                                {pdfsOT && pdfsOT.length > 0 && (
                                    pdfsOT.map((pdfUrl, idx) => (
                                        <button
                                            key={`ot-${idx}`}
                                            onClick={() => handleDescargarArchivo(pdfUrl, `Orden_Trabajo_${servicio.id}_${idx + 1}.pdf`)}
                                            className="h-32 w-40 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl flex flex-col items-center justify-center text-gray-600 hover:text-blue-600 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                        >
                                            <span className="text-3xl group-hover:scale-110 transition">📋</span>
                                            <span className="text-[10px] font-bold mt-2 text-center uppercase tracking-wider">Orden de Trabajo {idx + 1}</span>
                                        </button>
                                    ))
                                )}

                                {/* PDFs del Cliente (Si hay adicionales a la foto) */}
                                {servicio.pdfs && servicio.pdfs.length > 0 && (
                                    servicio.pdfs.map((pdfUrl, idx) => (
                                        <button
                                            key={`cli-${idx}`}
                                            onClick={() => handleDescargarArchivo(pdfUrl, `Adjunto_${servicio.id}_${idx + 1}.pdf`)}
                                            className="h-32 w-40 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl flex flex-col items-center justify-center text-gray-600 hover:text-red-600 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                        >
                                            <span className="text-3xl group-hover:scale-110 transition">📄</span>
                                            <span className="text-[10px] font-bold mt-2 text-center">PDF Cliente {idx + 1}</span>
                                        </button>
                                    ))
                                )}

                                {(!servicio.foto && (!servicio.pdfs || servicio.pdfs.length === 0) && (!pdfsOT || pdfsOT.length === 0)) && (
                                    <div className="w-full bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200 text-center">
                                        <span className="text-2xl mb-2 block opacity-50">📭</span>
                                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">No hay archivos ni órdenes de trabajo</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition"
                    >
                        Cerrar
                    </button>
                </div>
            </div>

            {/* Zoom de imagen */}
            {imagenZoom && (
                <div
                    className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setImagenZoom(null)}
                >
                    <img
                        src={imagenZoom}
                        alt="Zoom"
                        className="max-w-full max-h-full object-contain rounded shadow-2xl"
                    />
                    <button
                        className="absolute top-5 right-5 text-white text-4xl hover:text-red-500 transition"
                        onClick={() => setImagenZoom(null)}
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}

export default ServicioDetalleModal;
