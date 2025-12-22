import React, { useState, useEffect } from 'react';
import API_URL from '../../config/api';
import CotizacionDetalle from '../../components/admin/CotizacionDetalle';
import BotonMenu from '../../components/ui/BotonMenu';
import { getSafeUrl } from '../../utils/helpers';

function Cotizaciones() {
    const [vistaActual, setVistaActual] = useState('menu');
    const [cotizaciones, setCotizaciones] = useState([]);
    const [detalleCot, setDetalleCot] = useState(null);
    // Imagen zoom para la vista de lista
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

    // Filtros
    const pendientes = cotizaciones.filter(c => c.estado === 'pendiente');
    const cotizadas = cotizaciones.filter(c => c.estado === 'cotizado');
    const aprobadas = cotizaciones.filter(c => c.estado === 'aprobado' || c.estadoCliente === 'aprobado');
    const rechazadas = cotizaciones.filter(c => c.estado === 'rechazado' || c.estadoCliente === 'rechazado');

    return (
        <>
            {detalleCot ? (
                <CotizacionDetalle
                    cotizacion={detalleCot}
                    onClose={() => setDetalleCot(null)}
                    onUpdate={() => {
                        cargarCotizaciones();
                        setDetalleCot(null);
                    }}
                />
            ) : (
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
                                                            onError={(e) => e.target.style.display = 'none'}
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
                                                    <button onClick={() => setDetalleCot(cot)} className="w-full bg-gray-900 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 text-sm">Responder</button>
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

export default Cotizaciones;