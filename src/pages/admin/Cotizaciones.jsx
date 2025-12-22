import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// CONSTANTE PARA LA URL DEL BACKEND (Cámbiala si usas localhost para pruebas)
const API_URL = 'https://infiniguardsys-production.up.railway.app'; 
 //const API_URL = 'http://localhost:4000'; // Descomenta esta si pruebas en local

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

  const esCliente = (cot) => {
    if (cot.cliente && !cot.usuario) return true;
    if (cot.usuario && !cot.cliente) return false;
    const tipos = ['equipo-tecnico', 'herramienta', 'material', 'repuesto', 'garantia'];
    return !tipos.includes(cot.tipo);
  };

  // Filtros
  const pendientes = cotizaciones.filter(c => c.estado === 'pendiente');
  const cotizadas = cotizaciones.filter(c => c.estado === 'cotizado');
  const aprobadas = cotizaciones.filter(c => c.estado === 'aprobado' || c.estadoCliente === 'aprobado');
  const rechazadas = cotizaciones.filter(c => c.estado === 'rechazado' || c.estadoCliente === 'rechazado');

  // --- VISTA DETALLE MINIMALISTA ---
  const renderDetalle = () => {
    if (!detalleCot) return null;

    // Helper para construir la URL de la imagen/pdf si es ruta relativa
    const getFileUrl = (path) => path.startsWith('http') ? path : `${API_URL}/${path}`;

    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
        {/* Header simple */}
        <div className="flex items-center justify-between mb-8">
            <button 
                onClick={() => { setDetalleCot(null); setArchivo(null); }} 
                className="flex items-center text-gray-500 hover:text-gray-900 transition font-medium text-sm"
            >
                <div className="bg-white border border-gray-200 h-8 w-8 flex items-center justify-center rounded-full mr-2 shadow-sm">←</div>
                Volver al listado
            </button>
            <div className="text-xs font-mono text-gray-400">ID: {detalleCot.id}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* --- IZQUIERDA: INFORMACIÓN (Ocupa 8 columnas) --- */}
            <div className="lg:col-span-8 space-y-6">
                {/* Tarjeta Principal */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-full mb-3">
                                {detalleCot.tipo}
                            </span>
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{detalleCot.titulo}</h1>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">{detalleCot.usuario || detalleCot.cliente}</div>
                            <div className="text-xs text-gray-500">{detalleCot.fecha}</div>
                        </div>
                    </div>

                    <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed mb-8">
                        <p>{detalleCot.descripcion || "Sin descripción detallada."}</p>
                    </div>

                    {/* Grid de detalles técnicos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-b border-gray-50">
                        <div>
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Cantidad</div>
                            <div className="font-semibold text-gray-800">{detalleCot.cantidad || 1}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Modelo</div>
                            <div className="font-semibold text-gray-800">{detalleCot.modelo || "N/A"}</div>
                        </div>
                        <div className="col-span-2">
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Contacto</div>
                            <div className="font-semibold text-gray-800">{detalleCot.telefono || "No registrado"}</div>
                        </div>
                    </div>

                    {/* SECCIÓN COMPACTA DE ADJUNTOS */}
                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                            Evidencia y Archivos
                        </h3>
                        
                        <div className="flex flex-wrap gap-4">
                            {/* 1. FOTO COMPACTA */}
                            {detalleCot.foto ? (
                                <div 
                                    className="h-24 w-24 relative rounded-xl overflow-hidden border border-gray-200 group cursor-pointer"
                                    onClick={() => setImagenZoom(getFileUrl(detalleCot.foto))}
                                >
                                    <img src={getFileUrl(detalleCot.foto)} alt="Evidencia" className="h-full w-full object-cover transition duration-300 group-hover:opacity-90" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition">
                                        <span className="text-white text-xs font-bold">Zoom</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-24 w-24 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-xs text-center p-2">
                                    Sin Foto
                                </div>
                            )}

                            {/* 2. PDF COMPACTO (BOTÓN) */}
                            {detalleCot.pdf ? (
                                <a 
                                    href={getFileUrl(detalleCot.pdf)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="h-24 w-40 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl flex flex-col items-center justify-center text-red-600 transition cursor-pointer px-4"
                                >
                                    <span className="text-2xl mb-1">📄</span>
                                    <span className="text-xs font-bold">Ver PDF</span>
                                    <span className="text-[10px] opacity-70">Descargar</span>
                                </a>
                            ) : (
                                <div className="h-24 w-24 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-xs text-center p-2">
                                    Sin PDF
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DERECHA: FORMULARIO (Ocupa 4 columnas y es Sticky) --- */}
            <div className="lg:col-span-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-6 overflow-hidden">
                    <div className="bg-gray-900 px-6 py-4">
                        <h3 className="text-white font-bold text-lg">Cotizar</h3>
                        <p className="text-gray-400 text-xs">Responde al cliente o técnico</p>
                    </div>
                    
                    <div className="p-6 space-y-5">
                        {/* Precio */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Final</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-bold text-xl text-gray-900 placeholder-gray-300"
                                    placeholder="0.00"
                                    value={respuesta.precio}
                                    onChange={(e) => setRespuesta({...respuesta, precio: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Texto */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Diagnóstico / Notas</label>
                            <textarea 
                                rows="4"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700 resize-none"
                                placeholder="Escribe aquí los detalles..."
                                value={respuesta.texto}
                                onChange={(e) => setRespuesta({...respuesta, texto: e.target.value})}
                            ></textarea>
                        </div>

                        {/* Archivo Admin */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adjuntar PDF (Opcional)</label>
                            <label className="flex items-center justify-center w-full h-12 px-4 transition bg-white border-2 border-gray-200 border-dashed rounded-xl appearance-none cursor-pointer hover:border-blue-400 hover:bg-blue-50 focus:outline-none">
                                <span className="flex items-center space-x-2">
                                    <span className="text-gray-400 text-lg">{archivo ? '📎' : '+'}</span>
                                    <span className="font-medium text-gray-600 text-xs truncate max-w-[150px]">
                                        {archivo ? archivo.name : 'Subir archivo...'}
                                    </span>
                                </span>
                                <input type="file" name="file_upload" className="hidden" accept="application/pdf" onChange={(e) => setArchivo(e.target.files[0])} />
                            </label>
                        </div>

                        <div className="pt-2 flex flex-col gap-3">
                            <button 
                                onClick={() => handleEnviarCotizacion(detalleCot.id)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow hover:shadow-lg transition active:scale-95 flex justify-center items-center gap-2"
                            >
                                Enviar Respuesta 🚀
                            </button>
                            <button 
                                onClick={() => handleRechazarCotizacionTecnico(detalleCot.id)}
                                className="w-full bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 font-bold py-3 rounded-xl transition text-sm"
                            >
                                Rechazar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  // --- RENDER PRINCIPAL ---
  return (
    <>
      {detalleCot ? renderDetalle() : (
        <div className="max-w-6xl mx-auto animate-fadeIn">
            {/* VISTAS DE LISTADO (MENU, PENDIENTES, ETC) */}
            {vistaActual === 'menu' && (
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">Cotizaciones</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Botones del menú... (Resumidos para no repetir todo el bloque, son iguales al anterior) */}
                        <BotonMenu color="orange" icon="📄" titulo="Pendientes" sub="Por cotizar" count={pendientes.length} onClick={() => setVistaActual('pendientes')} />
                        <BotonMenu color="blue" icon="💬" titulo="Cotizadas" sub="Esperando respuesta" count={cotizadas.length} onClick={() => setVistaActual('cotizadas')} />
                        <BotonMenu color="green" icon="✅" titulo="Aprobadas" sub="Listas para asignar" count={aprobadas.length} onClick={() => setVistaActual('aprobadas')} />
                        <BotonMenu color="red" icon="❌" titulo="Rechazadas" sub="Historial" count={rechazadas.length} onClick={() => setVistaActual('rechazadas')} />
                    </div>
                </div>
            )}

            {vistaActual !== 'menu' && (
                <div>
                    <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 font-semibold flex items-center gap-2">← Volver al menú</button>
                    
                    {/* TÍTULOS DINÁMICOS */}
                    {vistaActual === 'pendientes' && <h1 className="text-3xl font-bold text-gray-800 mb-6">⏳ Pendientes ({pendientes.length})</h1>}
                    {vistaActual === 'aprobadas' && <h1 className="text-3xl font-bold text-gray-800 mb-6">✅ Aprobadas ({aprobadas.length})</h1>}
                    {/* ... otros títulos ... */}

                    {/* GRID DE TARJETAS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Mapeo según la vista */}
                        {(vistaActual === 'pendientes' ? pendientes : vistaActual === 'aprobadas' ? aprobadas : vistaActual === 'cotizadas' ? cotizadas : rechazadas).map(cot => (
                            <div key={cot.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden flex flex-col h-full group">
                                <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                                    {cot.foto ? (
                                        <>
                                            <img src={`${API_URL}/${cot.foto}`} alt="Evidencia" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => e.target.style.display='none'}/>
                                            {/* Fix Imagen Negra: bg-black/40 y opacity control */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                                                <button onClick={(e) => { e.stopPropagation(); setImagenZoom(`${API_URL}/${cot.foto}`); }} className="bg-white text-gray-800 p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition">🔍</button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400"><span className="text-4xl">📄</span></div>
                                    )}
                                    <div className="absolute top-3 right-3"><span className="bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg shadow text-gray-700">{cot.fecha}</span></div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="mb-2"><span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">{cot.usuario || cot.cliente}</span></div>
                                    <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">{cot.titulo}</h3>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{cot.descripcion}</p>
                                    
                                    {vistaActual === 'pendientes' && (
                                        <button onClick={() => { setDetalleCot(cot); setRespuesta({texto: '', precio: ''}); setArchivo(null); }} className="w-full bg-gray-900 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2">
                                            Responder
                                        </button>
                                    )}
                                    {vistaActual === 'aprobadas' && <div className="text-green-600 font-bold text-xl">${cot.precio}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                    {(vistaActual === 'pendientes' ? pendientes : vistaActual === 'aprobadas' ? aprobadas : []).length === 0 && (
                        <div className="text-center py-12 text-gray-400">No hay datos en esta sección</div>
                    )}
                </div>
            )}
        </div>
      )}

      {/* ZOOM MODAL */}
      {imagenZoom && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setImagenZoom(null)}>
          <img src={imagenZoom} alt="Zoom" className="max-w-full max-h-full object-contain rounded shadow-2xl" />
          <button className="absolute top-5 right-5 text-white text-4xl">&times;</button>
        </div>
      )}
      <style>{`.animate-fadeIn { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`}</style>
    </>
  );
}

// Componente auxiliar para los botones del menú (para limpiar el código principal)
const BotonMenu = ({ color, icon, titulo, sub, count, onClick }) => (
    <button onClick={onClick} className={`group bg-white border border-gray-100 hover:border-${color}-200 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center h-64 relative overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500 to-${color}-600 opacity-0 group-hover:opacity-90 transition-opacity duration-500`}></div>
        <div className="relative z-10 flex flex-col items-center group-hover:text-white transition-colors">
            <div className="text-6xl mb-4 drop-shadow-sm">{icon}</div>
            <h2 className="text-2xl font-bold mb-1 text-gray-800 group-hover:text-white">{titulo}</h2>
            <p className={`text-${color}-500 text-sm group-hover:text-${color}-100`}>{sub}</p>
            {count > 0 && <span className="mt-4 bg-white text-gray-800 px-3 py-1 rounded-full font-bold shadow-md text-xs">{count}</span>}
        </div>
    </button>
);

export default Cotizaciones;