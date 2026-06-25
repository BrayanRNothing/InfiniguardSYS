import React, { useState } from 'react';
import toast from 'react-hot-toast';
import API_URL from '../../config/api';
import { getSafeUrl } from '../../utils/helpers';
import InfoItem from '../../components/ui/InfoItem';

function CotizacionDetalle({ cotizacion, onClose, onUpdate }) {
    const [respuesta, setRespuesta] = useState({ texto: '', precio: '', moneda: 'MXN' });
    const [archivos, setArchivos] = useState([]);
    const [imagenZoom, setImagenZoom] = useState(null);
    const [preguntas, setPreguntas] = useState(cotizacion.preguntas_cotizacion || []);

    const handleEnviarCotizacion = async () => {
        if (!respuesta.texto || !respuesta.precio) {
            toast.error('Ingresa precio y respuesta');
            return;
        }

        // Obtener el nombre del admin logueado para asignar la comisión
        let adminNombre = 'Admin';
        try {
            const userSession = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (userSession) {
                const parsed = JSON.parse(userSession);
                adminNombre = parsed.nombre || parsed.name || parsed.username || 'Admin';
            }
        } catch (e) {
            console.warn('No se pudo leer el usuario del localStorage');
        }

        const formData = new FormData();
        formData.append('estado', 'cotizado');
        formData.append('respuestaAdmin', respuesta.texto);
        formData.append('precio', respuesta.precio);
        formData.append('moneda', respuesta.moneda);
        formData.append('adminVendedor', adminNombre);
        formData.append('preguntas_cotizacion', JSON.stringify(preguntas));
        if (archivos.length > 0) {
            archivos.forEach(a => formData.append('archivos', a));
        }

        const loadingToast = toast.loading('Enviando...');

        try {
            const res = await fetch(`${API_URL}/api/servicios/${cotizacion.id}`, {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                toast.dismiss(loadingToast);
                toast.success('Enviado correctamente');
                setRespuesta({ texto: '', precio: '', moneda: 'MXN' });
                setArchivos([]);
                if (onUpdate) onUpdate();
            } else {
                toast.dismiss(loadingToast);
                toast.error('Error al enviar');
            }
        } catch (error) {
            console.error(error);
            toast.dismiss(loadingToast);
            toast.error('Error de conexión');
        }
    };

    const handleRechazarCotizacionTecnico = async () => {
        if (!confirm('¿Rechazar solicitud?')) return;
        try {
            const res = await fetch(`${API_URL}/api/servicios/${cotizacion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'rechazado' })
            });
            if (res.ok) {
                toast.success('Rechazada');
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al rechazar');
        }
    };

    const handleDescargarArchivo = async (rutaRelativa, nombreArchivo) => {
        if (!rutaRelativa) return;

        const urlCompleta = getSafeUrl(rutaRelativa);
        const toastId = toast.loading('Iniciando descarga...');

        try {
            const response = await fetch(urlCompleta);
            if (!response.ok) throw new Error('El archivo no está disponible en el servidor');

            const blob = await response.blob();
            const urlBlob = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = urlBlob;
            a.download = nombreArchivo || 'archivo_descarga';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(urlBlob);

            toast.dismiss(toastId);
            toast.success('Descarga completada');
        } catch (error) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error('❌ Error: Archivo no encontrado');
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setArchivos(prev => [...prev, ...filesArray]);
        }
    };
    
    const removeFile = (index) => {
        setArchivos(prev => prev.filter((_, i) => i !== index));
    };

    const fotoUrl = getSafeUrl(cotizacion.foto);

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col animate-fadeIn bg-gray-50/50">
            {/* Barra Superior */}
            <div className="flex items-center justify-between mb-4 shrink-0 px-1 gap-4">
                <button onClick={onClose} className="group flex items-center text-gray-500 hover:text-blue-600 transition font-medium text-sm">
                    <div className=" group-hover:border-blue-200 h-8 w-8 flex items-center justify-center mr-2 transition">←</div>
                    Volver al listado
                </button>
            </div>

            <div className="flex-1 overflow-hidden pr-2 pb-2">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-full">

                    {/* --- IZQUIERDA: FICHA TÉCNICA --- */}
                    <div className="xl:col-span-8 h-full">
                        <div className="bg-white rounded-3xl overflow-hidden h-full flex flex-col shadow-sm border border-gray-200">

                            {/* Encabezado */}
                            <div className="p-6 sm:p-8 bg-white border-b border-gray-100 shrink-0">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg ${cotizacion.tipo === 'garantia' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                {cotizacion.tipo}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                                📅 {cotizacion.fecha}
                                            </span>
                                        </div>
                                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
                                            {cotizacion.titulo}
                                        </h1>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] border border-gray-200">👤</div>
                                                {cotizacion.usuario || cotizacion.cliente}
                                            </div>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-gray-500 font-medium">Solicitante</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 text-center min-w-[120px] shadow-sm">
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5">Estado</div>
                                        <div className={`text-sm font-black uppercase tracking-wider ${cotizacion.estado === 'pendiente' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                            {cotizacion.estado}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Grid de Datos Completas */}
                            <div className="p-6 sm:p-8 flex-1 overflow-auto bg-gray-50/50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                    <InfoItem label="Dirección" value={cotizacion.direccion} icon="📍" />
                                    <InfoItem label="Teléfono / Contacto" value={cotizacion.telefono} icon="📞" />
                                    <InfoItem label="ID Sistema" value={cotizacion.id} icon="🆔" />
                                </div>

                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span>📝</span> Descripción del problema
                                    </h4>
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line pl-1">
                                        {cotizacion.descripcion || "Sin descripción proporcionada."}
                                    </p>
                                </div>

                                {/* Sección Archivos */}
                                <div>
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span>📎</span> Archivos Adjuntos
                                    </h3>
                                    <div className="flex flex-wrap gap-4">

                                        {/* 1. FOTOS PREVIEW */}
                                        {(cotizacion.fotos && cotizacion.fotos.length > 0) ? (
                                            cotizacion.fotos.map((f, idx) => {
                                                const url = getSafeUrl(f);
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setImagenZoom(url)}
                                                        className="group relative h-28 w-40 bg-white rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in hover:shadow-md transition-all shrink-0 p-1"
                                                    >
                                                        <img src={url} alt={`Evidencia ${idx}`} className="h-full w-full object-contain rounded-lg transition duration-500 group-hover:scale-105" onError={(e) => e.target.style.display = 'none'} />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center rounded-xl">
                                                            <span className="bg-white/95 text-gray-800 text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">🔍 Ampliar</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : cotizacion.foto ? (
                                            <div
                                                onClick={() => setImagenZoom(fotoUrl)}
                                                className="group relative h-28 w-40 bg-white rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in hover:shadow-md transition-all shrink-0 p-1"
                                            >
                                                <img src={fotoUrl} alt="Evidencia" className="h-full w-full object-contain rounded-lg transition duration-500 group-hover:scale-105" onError={(e) => e.target.style.display = 'none'} />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center rounded-xl">
                                                    <span className="bg-white/95 text-gray-800 text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">🔍 Ampliar</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-24 w-24 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-[10px]">
                                                Sin Foto
                                            </div>
                                        )}

                                        {/* 2. PDF DESCARGABLE */}
                                        {cotizacion.pdf ? (
                                            <div
                                                onClick={() => handleDescargarArchivo(cotizacion.pdf, cotizacion.pdf.split('/').pop().includes('-') ? cotizacion.pdf.split('/').pop().split('-').slice(1).join('-') : cotizacion.pdf.split('/').pop())}
                                                className="w-full sm:w-72 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-3 flex items-center gap-4 cursor-pointer group shadow-sm hover:shadow-md transition-all"
                                                title="Descargar documento PDF"
                                            >
                                                <div className="h-12 w-12 bg-red-100 group-hover:bg-red-500 text-red-600 group-hover:text-white rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300">
                                                    <span className="text-2xl">📄</span>
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-800 transition-colors">
                                                        {cotizacion.pdf.split('/').pop().includes('-') ? cotizacion.pdf.split('/').pop().split('-').slice(1).join('-') : cotizacion.pdf.split('/').pop() || 'Documento Adjunto'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                                                        Haz clic para descargar
                                                    </span>
                                                </div>
                                                <div className="shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 font-bold">
                                                    ↓
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-24 w-24 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-[10px]">
                                                Sin PDF
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- DERECHA: FORMULARIO DE RESPUESTA --- */}
                    <div className="xl:col-span-4 h-full">
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm h-full overflow-hidden flex flex-col">
                            <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-gray-100 shrink-0">
                                <div>
                                    <h3 className="text-gray-900 font-extrabold text-lg tracking-tight">Panel de Respuesta</h3>
                                    <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wider mt-1">Enviar cotización al cliente</p>
                                </div>
                                <div className="bg-blue-50 p-2.5 rounded-xl text-xl text-blue-500 shadow-sm">💬</div>
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-auto bg-gray-50/50">
                                {/* Fila: Precio + PDF */}
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                            Precio Total <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative group flex gap-2">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <span className="text-gray-400 font-bold text-lg group-focus-within:text-blue-500 transition">$</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    className="w-full pl-10 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-xl text-gray-900 placeholder-gray-300 shadow-sm"
                                                    placeholder="0.00"
                                                    value={respuesta.precio}
                                                    onChange={(e) => setRespuesta({ ...respuesta, precio: e.target.value })}
                                                />
                                            </div>
                                            <select
                                                value={respuesta.moneda}
                                                onChange={(e) => setRespuesta({ ...respuesta, moneda: e.target.value })}
                                                className="w-24 bg-white border border-gray-200 rounded-2xl px-2 py-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-700 shadow-sm"
                                            >
                                                <option value="MXN">MXN</option>
                                                <option value="USD">USD</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Adjuntar PDF Compacto */}
                                    <div className="w-20 shrink-0">
                                        <label className="block text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">PDFs</label>
                                        <label className={`flex flex-col items-center justify-center w-full h-[66px] transition-all ${archivos.length > 0 ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white border-gray-200 text-gray-400 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-500'} border-2 border-dashed rounded-2xl cursor-pointer focus:outline-none group`}>
                                            <span className="text-2xl group-hover:scale-110 transition-transform">{archivos.length > 0 ? '📄' : '☁️'}</span>
                                            <input type="file" className="hidden" accept="application/pdf" multiple onChange={handleFileChange} />
                                        </label>
                                    </div>
                                </div>

                                {archivos.length > 0 && (
                                    <div className="space-y-2">
                                        {archivos.map((archivo, index) => (
                                            <div key={index} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-[10px] font-bold flex justify-between items-center border border-blue-100">
                                                <span className="truncate max-w-[200px]">{archivo.name}</span>
                                                <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 ml-2 text-sm">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Mensaje */}
                                <div>
                                    <label className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                        Notas / Diagnóstico <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl h-32 resize-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-700 shadow-sm"
                                        placeholder="Escribe la evaluación, diagnóstico o notas para el cliente..."
                                        value={respuesta.texto}
                                        onChange={(e) => setRespuesta({ ...respuesta, texto: e.target.value })}
                                    ></textarea>
                                </div>

                                {/* Preguntas Dinámicas */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            Preguntas para el cliente
                                        </label>
                                        <button
                                            onClick={() => setPreguntas([...preguntas, { id: Date.now().toString(), pregunta: '', respuesta: null }])}
                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full"
                                        >
                                            <span className="text-lg leading-none">+</span> Agregar Pregunta
                                        </button>
                                    </div>

                                    {preguntas.length > 0 ? (
                                        <div className="space-y-3">
                                            {preguntas.map((p, index) => (
                                                <div key={p.id} className="flex gap-2 items-start bg-white p-3 border border-gray-200 rounded-2xl shadow-sm group transition-all hover:border-blue-300">
                                                    <div className="mt-2 text-gray-400 font-bold text-xs w-6 text-center shrink-0">{index + 1}.</div>
                                                    <div className="flex-1">
                                                        <textarea
                                                            className="w-full bg-transparent border-none text-sm outline-none resize-none h-10 p-1 text-gray-700 placeholder-gray-300 focus:ring-0 font-medium"
                                                            placeholder={`Escribe la pregunta ${index + 1}...`}
                                                            value={p.pregunta}
                                                            onChange={(e) => {
                                                                const n = [...preguntas];
                                                                n[index].pregunta = e.target.value;
                                                                setPreguntas(n);
                                                            }}
                                                        />
                                                        {p.respuesta && (
                                                            <div className="bg-green-50 text-green-800 text-xs p-3 rounded-xl border border-green-200 mt-2">
                                                                <span className="font-bold block text-[10px] text-green-600 uppercase mb-1">Respuesta del cliente:</span>
                                                                {p.respuesta}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => setPreguntas(preguntas.filter(q => q.id !== p.id))}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                                        title="Eliminar pregunta"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs shadow-sm">
                                            No hay preguntas agregadas.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Controles Fijos al fondo */}
                            <div className="p-6 bg-gray-50 border-t border-gray-200 shrink-0">
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleEnviarCotizacion}
                                        className="group relative w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.97] flex justify-center items-center gap-3 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                        <span className="text-xl group-hover:scale-110 transition-transform duration-300">🚀</span>
                                        <span className="text-base relative z-10">Enviar Cotización</span>
                                    </button>
                                    <button
                                        onClick={handleRechazarCotizacionTecnico}
                                        className="group relative w-full bg-white hover:bg-red-50 text-red-500 border-2 border-red-200 hover:border-red-300 font-bold py-3 px-6 rounded-xl transition-all duration-300 active:scale-[0.97] flex justify-center items-center gap-3"
                                    >
                                        <span className="text-lg group-hover:rotate-12 transition-transform duration-300">❌</span>
                                        <span className="text-sm relative z-10">Rechazar Solicitud</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {imagenZoom && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setImagenZoom(null)}>
                    <img src={imagenZoom} alt="Zoom" className="max-w-full max-h-full object-contain rounded shadow-2xl" />
                    <button className="absolute top-5 right-5 text-white text-4xl hover:text-red-500 transition" onClick={() => setImagenZoom(null)}>&times;</button>
                </div>
            )}
        </div>
    );
}



export default CotizacionDetalle;
