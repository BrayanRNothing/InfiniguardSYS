import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// CONSTANTE PARA LA URL DEL BACKEND
const API_URL = 'https://infiniguardsys-production.up.railway.app'; 

function Cotizaciones() {
  const [vistaActual, setVistaActual] = useState('menu');
  const [cotizaciones, setCotizaciones] = useState([]);
  const [detalleCot, setDetalleCot] = useState(null);
  
  // Formulario
  const [respuesta, setRespuesta] = useState({ texto: '', precio: '' });
  const [archivo, setArchivo] = useState(null);
  const [imagenZoom, setImagenZoom] = useState(null);

  useEffect(() => {
    cargarCotizaciones();
    const interval = setInterval(() => cargarCotizaciones(), 10000);
    return () => clearInterval(interval);
  }, []);

  const cargarCotizaciones = async () => {
    try {
      const res = await fetch(`${API_URL}/api/servicios`);
      const data = await res.json();
      setCotizaciones(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEnviarCotizacion = async (id) => {
    if (!respuesta.texto || !respuesta.precio) {
      toast.error('Ingresa precio y respuesta');
      return;
    }
    const formData = new FormData();
    formData.append('estado', 'cotizado');
    formData.append('respuestaAdmin', respuesta.texto);
    formData.append('precio', respuesta.precio);
    if (archivo) formData.append('archivo', archivo);

    const loadingToast = toast.loading('Enviando...');

    try {
      const res = await fetch(`${API_URL}/api/servicios/${id}`, {
        method: 'PUT',
        body: formData 
      });

      if (res.ok) {
        toast.dismiss(loadingToast);
        toast.success('Enviado correctamente');
        setRespuesta({ texto: '', precio: '' });
        setArchivo(null);
        setDetalleCot(null);
        cargarCotizaciones();
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

  const handleRechazarCotizacionTecnico = async (id) => {
    if (!confirm('¿Rechazar solicitud?')) return;
    try {
      const res = await fetch(`${API_URL}/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'rechazado' })
      });
      if (res.ok) {
        alert('Rechazada');
        setDetalleCot(null);
        cargarCotizaciones();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // --- FUNCIÓN DE DESCARGA SEGURA ---
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
      toast.error('❌ Error: Archivo no encontrado (posiblemente borrado)');
    }
  };

  // --- FUNCIÓN PARA CONSTRUIR URLS SIN ERRORES ---
  const getSafeUrl = (ruta) => {
    if (!ruta) return '';
    // Si viene en array, sacar el primero
    let path = Array.isArray(ruta) ? ruta[0] : ruta;
    if (typeof path !== 'string') return '';

    // Si ya es absoluta, devolverla
    if (path.startsWith('http')) return path;

    // Limpiar slashes duplicados
    const baseUrl = API_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    return `${baseUrl}/${cleanPath}`;
  };

  // Filtros
  const pendientes = cotizaciones.filter(c => c.estado === 'pendiente');
  const cotizadas = cotizaciones.filter(c => c.estado === 'cotizado');
  const aprobadas = cotizaciones.filter(c => c.estado === 'aprobado' || c.estadoCliente === 'aprobado');
  const rechazadas = cotizaciones.filter(c => c.estado === 'rechazado' || c.estadoCliente === 'rechazado');

  // --- VISTA DETALLE MEJORADA ---
  const renderDetalle = () => {
    if (!detalleCot) return null;

    const fotoUrl = getSafeUrl(detalleCot.foto);

    return (
      <div className="h-[calc(100vh-2rem)] flex flex-col animate-fadeIn bg-gray-50/50">
        {/* Barra Superior */}
        <div className="flex items-center justify-between mb-4 shrink-0 px-1">
            <button onClick={() => { setDetalleCot(null); setArchivo(null); }} className="group flex items-center text-gray-500 hover:text-blue-600 transition font-medium text-sm">
                <div className="bg-white border border-gray-200 group-hover:border-blue-200 h-8 w-8 flex items-center justify-center rounded-full mr-2 shadow-sm transition">←</div> 
                Volver al listado
            </button>
            <div className="bg-white px-3 py-1 rounded-full border border-gray-200 text-xs font-mono text-gray-400 shadow-sm">
                Ticket ID: <span className="text-gray-600 font-bold">#{detalleCot.id}</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-10">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
                
                {/* --- IZQUIERDA: FICHA TÉCNICA --- */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        
                        {/* Encabezado */}
                        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                                            detalleCot.tipo === 'garantia' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {detalleCot.tipo}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                            📅 {detalleCot.fecha}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                                        {detalleCot.titulo}
                                    </h1>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="font-medium text-gray-900">{detalleCot.usuario || detalleCot.cliente}</span>
                                        <span>•</span>
                                        <span>Solicitante</span>
                                    </div>
                                </div>
                                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 text-center min-w-[100px]">
                                    <div className="text-[10px] text-gray-400 uppercase font-bold">Estado</div>
                                    <div className={`font-bold capitalize ${detalleCot.estado === 'pendiente' ? 'text-orange-500' : 'text-green-500'}`}>
                                        {detalleCot.estado}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grid de Datos Completos */}
                        <div className="p-6 sm:p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6 mb-8">
                                <InfoItem label="Dirección" value={detalleCot.direccion} icon="📍" />
                                <InfoItem label="Teléfono / Contacto" value={detalleCot.telefono} icon="📞" />
                                <InfoItem label="Cantidad Solicitada" value={detalleCot.cantidad} icon="📦" />
                                <InfoItem label="Modelo / Referencia" value={detalleCot.modelo} icon="🔖" />
                                <InfoItem label="Tipo de Servicio" value={detalleCot.tipo} icon="🔧" />
                                <InfoItem label="ID Sistema" value={detalleCot.id} icon="🆔" />
                            </div>

                            <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100 mb-8">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Descripción del problema / Solicitud</h4>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {detalleCot.descripcion || "Sin descripción proporcionada."}
                                </p>
                            </div>

                            {/* Sección Archivos */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Archivos Adjuntos</h3>
                                <div className="flex flex-wrap gap-4">
                                    
                                    {/* 1. FOTO PREVIEW */}
                                    {detalleCot.foto ? (
                                        <div 
                                            onClick={() => setImagenZoom(fotoUrl)}
                                            className="group relative h-32 w-48 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 cursor-zoom-in hover:shadow-md transition-all"
                                        >
                                            <img src={fotoUrl} alt="Evidencia" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" onError={(e) => e.target.style.display='none'} />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">Ver Foto</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-32 w-32 bg-gray-50 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-xs">
                                            Sin Foto
                                        </div>
                                    )}

                                    {/* 2. PDF DESCARGABLE (Botón Funcional) */}
                                    {detalleCot.pdf ? (
                                        <button 
                                            onClick={() => handleDescargarArchivo(detalleCot.pdf, `Evidencia_${detalleCot.id}.pdf`)}
                                            className="h-32 w-48 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-2xl flex flex-col items-center justify-center text-gray-600 hover:text-red-600 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                        >
                                            <div className="bg-red-100 p-3 rounded-full mb-2 group-hover:scale-110 transition">
                                                <span className="text-xl">📄</span>
                                            </div>
                                            <span className="text-xs font-bold">Descargar PDF</span>
                                            <span className="text-[10px] text-gray-400 mt-1">Click para guardar</span>
                                        </button>
                                    ) : (
                                        <div className="h-32 w-32 bg-gray-50 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-xs">
                                            Sin PDF
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- DERECHA: FORMULARIO DE RESPUESTA --- */}
                <div className="xl:col-span-4">
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 h-fit sticky top-4 overflow-hidden">
                        <div className="bg-gray-900 px-8 py-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold text-lg">Panel de Respuesta</h3>
                                <p className="text-gray-400 text-xs mt-0.5">Enviar cotización al cliente</p>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg text-xl">💬</div>
                        </div>
                        
                        <div className="p-6 space-y-5">
                            {/* Precio */}
                            <div>
                                <label className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-2">
                                    Precio Total <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-gray-400 font-bold text-lg group-focus-within:text-blue-500 transition">$</span>
                                    </div>
                                    <input 
                                        type="number" 
                                        className="w-full pl-9 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-bold text-2xl text-gray-900 placeholder-gray-300"
                                        placeholder="0.00"
                                        value={respuesta.precio}
                                        onChange={(e) => setRespuesta({...respuesta, precio: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Mensaje */}
                            <div>
                                <label className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-2">
                                    Notas / Diagnóstico <span className="text-red-500">*</span>
                                </label>
                                <textarea 
                                    rows="5"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700 resize-none placeholder-gray-400"
                                    placeholder="Describe los detalles de la cotización..."
                                    value={respuesta.texto}
                                    onChange={(e) => setRespuesta({...respuesta, texto: e.target.value})}
                                ></textarea>
                            </div>

                            {/* Adjuntar */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adjuntar PDF (Opcional)</label>
                                <label className="flex flex-col items-center justify-center w-full h-24 px-4 transition bg-white border-2 border-gray-200 border-dashed rounded-xl appearance-none cursor-pointer hover:border-blue-400 hover:bg-blue-50 focus:outline-none group">
                                    <span className="flex flex-col items-center space-y-1">
                                        <span className="text-2xl group-hover:-translate-y-1 transition">{archivo ? '📎' : '☁️'}</span>
                                        <span className="font-medium text-gray-600 text-xs truncate max-w-[200px]">
                                            {archivo ? archivo.name : 'Click para subir archivo'}
                                        </span>
                                    </span>
                                    <input type="file" className="hidden" accept="application/pdf" onChange={(e) => setArchivo(e.target.files[0])} />
                                </label>
                            </div>

                            <hr className="border-gray-100" />

                            <div className="pt-2 flex flex-col gap-3">
                                <button 
                                    onClick={() => handleEnviarCotizacion(detalleCot.id)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition active:scale-[0.98] flex justify-center items-center gap-2"
                                >
                                    <span>🚀</span> Enviar Respuesta
                                </button>
                                <button 
                                    onClick={() => handleRechazarCotizacionTecnico(detalleCot.id)}
                                    className="w-full bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 font-bold py-3 rounded-xl transition text-sm"
                                >
                                    Rechazar Solicitud
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {detalleCot ? renderDetalle() : (
        <div className="h-[calc(100vh-6rem)] w-full flex flex-col overflow-hidden animate-fadeIn">
            
            {/* --- SECCIÓN DEL MENÚ PRINCIPAL --- */}
            {vistaActual === 'menu' && (
                <div className="flex flex-col h-full">
                    <div className="mb-4 shrink-0">
                        <h1 className="text-2xl font-bold text-gray-800">Cotizaciones</h1>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                        <BotonMenu gradient="from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" icon="📄" titulo="Pendientes" sub="Por cotizar" count={pendientes.length} onClick={() => setVistaActual('pendientes')} />
                        <BotonMenu gradient="from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" icon="💬" titulo="Cotizadas" sub="Esperando respuesta" count={cotizadas.length} onClick={() => setVistaActual('cotizadas')} />
                        <BotonMenu gradient="from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" icon="✅" titulo="Aprobadas" sub="Listas para asignar" count={aprobadas.length} onClick={() => setVistaActual('aprobadas')} />
                        <BotonMenu gradient="from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" icon="❌" titulo="Rechazadas" sub="Historial" count={rechazadas.length} onClick={() => setVistaActual('rechazadas')} />
                    </div>
                </div>
            )}

            {vistaActual !== 'menu' && (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="shrink-0 mb-4">
                        <button onClick={() => setVistaActual('menu')} className="mb-4 text-blue-600 font-semibold flex items-center gap-2">← Volver al menú</button>
                        {vistaActual === 'pendientes' && <h1 className="text-2xl font-bold text-orange-600">⏳ Pendientes ({pendientes.length})</h1>}
                        {vistaActual === 'cotizadas' && <h1 className="text-2xl font-bold text-blue-600">💬 Cotizadas ({cotizadas.length})</h1>}
                        {vistaActual === 'aprobadas' && <h1 className="text-2xl font-bold text-green-600">✅ Aprobadas ({aprobadas.length})</h1>}
                        {vistaActual === 'rechazadas' && <h1 className="text-2xl font-bold text-red-600">❌ Rechazadas ({rechazadas.length})</h1>}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(vistaActual === 'pendientes' ? pendientes : vistaActual === 'aprobadas' ? aprobadas : vistaActual === 'cotizadas' ? cotizadas : rechazadas).map(cot => (
                                <div key={cot.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden flex flex-col h-full group">
                                    <div className="h-40 w-full bg-gray-100 relative overflow-hidden">
                                        {cot.foto ? (
                                            <>
                                                <img 
                                                  src={getSafeUrl(cot.foto)} 
                                                  alt="Evidencia" 
                                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                                  onError={(e) => e.target.style.display='none'}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                                                    <button onClick={(e) => { e.stopPropagation(); setImagenZoom(getSafeUrl(cot.foto)); }} className="bg-white text-gray-800 p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition">🔍</button>
                                                </div>
                                            </>
                                        ) : <div className="h-full flex flex-col items-center justify-center text-gray-400"><span className="text-4xl">📄</span></div>}
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="mb-2"><span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">{cot.usuario || cot.cliente}</span></div>
                                        <h3 className="font-bold text-md text-gray-800 mb-1 line-clamp-1">{cot.titulo}</h3>
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{cot.descripcion}</p>
                                        {vistaActual === 'pendientes' && (
                                            <button onClick={() => { setDetalleCot(cot); setRespuesta({texto: '', precio: ''}); setArchivo(null); }} className="w-full bg-gray-900 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 text-sm">Responder</button>
                                        )}
                                        {vistaActual === 'aprobadas' && <div className="text-green-600 font-bold text-lg">${cot.precio}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {(vistaActual === 'pendientes' ? pendientes : vistaActual === 'aprobadas' ? aprobadas : vistaActual === 'cotizadas' ? cotizadas : rechazadas).length === 0 && (
                            <div className="text-center py-12 text-gray-400">No hay datos en esta sección</div>
                        )}
                    </div>
                </div>
            )}
        </div>
      )}

      {imagenZoom && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setImagenZoom(null)}>
          <img src={imagenZoom} alt="Zoom" className="max-w-full max-h-full object-contain rounded shadow-2xl" />
          <button className="absolute top-5 right-5 text-white text-4xl hover:text-red-500 transition" onClick={() => setImagenZoom(null)}>&times;</button>
        </div>
      )}
      <style>{`.animate-fadeIn { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`}</style>
    </>
  );
}

// Subcomponentes para limpieza del código
const BotonMenu = ({ gradient, icon, titulo, sub, count, onClick }) => (
    <button onClick={onClick} className={`bg-gradient-to-br ${gradient} p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center w-full h-full transform hover:scale-[1.02] text-white relative overflow-hidden group border border-white/10`}>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative z-10 flex flex-col items-center">
            <div className="text-5xl lg:text-7xl mb-4 drop-shadow-md transition-transform group-hover:scale-110">{icon}</div>
            <h2 className="text-2xl lg:text-4xl font-bold mb-2 tracking-tight">{titulo}</h2>
            <p className="text-white/80 text-sm lg:text-lg font-medium">{sub}</p>
            {count > 0 && <span className="mt-6 bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2 rounded-full font-bold shadow-sm text-sm lg:text-base animate-pulse">{count} Solicitudes</span>}
        </div>
    </button>
);

const InfoItem = ({ label, value, icon }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition">
        <div className="text-2xl bg-white p-2 rounded-lg shadow-sm border border-gray-100">{icon}</div>
        <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="font-bold text-gray-800 text-sm">{value || "No registrado"}</div>
        </div>
    </div>
);

export default Cotizaciones;