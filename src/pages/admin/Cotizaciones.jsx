import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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

    const handleDescargarArchivo = async (rutaRelativa, nombreArchivo) => {
        if (!rutaRelativa) {
            toast.error('No hay archivo disponible');
            return;
        }

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
                <div className="flex-1 w-full flex flex-col overflow-hidden animate-fadeIn">

                    {/* ############################################### 4 Tarjetas ################################################################################################ */}
                    {vistaActual === 'menu' && (
                        // CAMBIO 1: Quitamos 'max-w-6xl mx-auto' y ponemos 'w-full h-[calc(100vh-100px)]'
                        // Esto hace que el contenedor ocupe todo el ancho y casi toda la altura de la pantalla (restando un poco para el header si tienes uno)
                        <div className="w-full h-full animate-fadeInUp flex flex-col min-h-0">

                            {/* Encabezado */}
                            <div className="mb-6 shrink-0"> {/* shrink-0 evita que el título se aplaste */}
                                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-500">Gestión de Cotizaciones</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-lg">Administra presupuestos y solicitudes de usuarios</p>
                            </div>

                            {/* CAMBIO 2: El Grid ahora ocupa el espacio restante (flex-grow) y quitamos 'max-w-5xl' */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full flex-grow">
                                {/* Los botones ahora se estirarán para llenar este espacio gracias a 'h-full' dentro de BotonMenu */}
                                <BotonMenu
                                    gradient="from-orange-500/80 to-orange-600/80 hover:from-orange-600/90 hover:to-orange-700/90"
                                    icon="📄"
                                    titulo="Pendientes"
                                    count={pendientes.length}
                                    onClick={() => setVistaActual('pendientes')}
                                />
                                <BotonMenu
                                    gradient="from-blue-500/80 to-blue-600/80 hover:from-blue-600/90 hover:to-blue-700/90"
                                    icon="💬"
                                    titulo="Cotizadas"
                                    count={cotizadas.length}
                                    onClick={() => setVistaActual('cotizadas')}
                                />
                                <BotonMenu
                                    gradient="from-green-500/80 to-green-600/80 hover:from-green-600/90 hover:to-green-700/90"
                                    icon="✅"
                                    titulo="Aprobadas"
                                    count={aprobadas.length}
                                    onClick={() => setVistaActual('aprobadas')}
                                />
                                <BotonMenu
                                    gradient="from-red-500/80 to-red-600/80 hover:from-red-600/90 hover:to-red-700/90"
                                    icon="❌"
                                    titulo="Rechazadas"
                                    count={rechazadas.length}
                                    onClick={() => setVistaActual('rechazadas')}
                                />
                            </div>
                        </div>
                    )}

                    {/*################################################## 4 TARJETAS #############################################################################################*/}

                    {vistaActual !== 'menu' && (
                        <div className="max-w-7xl mx-auto animate-fadeInUp pb-12 w-full h-screen overflow-auto">
                            <div className="mb-6">
                                <button onClick={() => setVistaActual('menu')} className="mb-6 text-gray-600 hover:text-gray-700 font-semibold flex items-center gap-2 transition-colors">← Volver al menú</button>
                                <div className="mb-4">
                                    {vistaActual === 'pendientes' && (
                                        <>

                                            <p className="text-gray-500 dark:text-gray-400 text-sm">{pendientes.length} cotizaciones esperando respuesta</p>
                                        </>
                                    )}
                                    {vistaActual === 'cotizadas' && (
                                        <>

                                            <p className="text-gray-500 dark:text-gray-400 text-sm">{cotizadas.length} cotizaciones enviadas a usuarios</p>
                                        </>
                                    )}
                                    {vistaActual === 'aprobadas' && (
                                        <>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">{aprobadas.length} trabajos listos para asignar técnico</p>
                                        </>
                                    )}
                                    {vistaActual === 'rechazadas' && (
                                        <>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">{rechazadas.length} cotizaciones declinadas</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 pb-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(vistaActual === 'pendientes' ? pendientes : vistaActual === 'aprobadas' ? aprobadas : vistaActual === 'cotizadas' ? cotizadas : rechazadas).map(cot => (
                                        <div key={cot.id} className="bg-white rounded-xl border border-gray-300 hover:border-blue-400 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full group">
                                            {/* Imagen */}
                                            <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                                                {cot.foto ? (
                                                    <>
                                                        <img
                                                            src={getSafeUrl(cot.foto)}
                                                            alt="Evidencia"
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                            onError={(e) => e.target.style.display = 'none'}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setImagenZoom(getSafeUrl(cot.foto)); }} 
                                                                className="bg-white/95 hover:bg-white text-gray-800 px-4 py-2 rounded-full font-semibold text-xs shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2"
                                                            >
                                                                🔍 Ver imagen
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
                                                        <span className="text-5xl mb-2">📄</span>
                                                        <span className="text-xs font-medium">Sin imagen</span>
                                                    </div>
                                                )}
                                                {/* Badge de estado en la imagen */}
                                                <div className="absolute top-3 right-3">
                                                    <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg backdrop-blur-sm ${
                                                        cot.estado === 'pendiente' ? 'bg-orange-500/90 text-white' :
                                                        cot.estado === 'cotizado' ? 'bg-blue-500/90 text-white' :
                                                        cot.estado === 'aprobado' || cot.estadoCliente === 'aprobado' ? 'bg-green-500/90 text-white' :
                                                        'bg-red-500/90 text-white'
                                                    }`}>
                                                        {cot.estado}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Contenido */}
                                            <div className="p-5 flex-1 flex flex-col">
                                                {/* Header con usuario y fecha */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow">
                                                            {(cot.usuario || cot.cliente).charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="block text-xs font-bold text-gray-800">{cot.usuario || cot.cliente}</span>
                                                            <span className="text-[10px] text-gray-400">{cot.fecha}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-mono">#{cot.id}</span>
                                                </div>

                                                {/* Título y descripción */}
                                                <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2 leading-tight">{cot.titulo}</h3>
                                                <p className="text-xs text-gray-500 mb-3 line-clamp-3 flex-1">{cot.descripcion}</p>

                                                {/* Info adicional */}
                                                {cot.precio && (
                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                                        <span className="text-[10px] text-green-600 font-bold uppercase block mb-1">Precio cotizado</span>
                                                        <span className="text-green-700 font-bold text-xl">${parseFloat(cot.precio).toLocaleString()}</span>
                                                    </div>
                                                )}

                                                {/* Botones de acción */}
                                                <div className="flex gap-2 mt-auto">
                                                    <button 
                                                        onClick={() => setDetalleCot(cot)} 
                                                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                                    >
                                                        👁️ Ver detalles
                                                    </button>
                                                    {cot.pdf && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDescargarArchivo(cot.pdf, `Cotizacion_${cot.id}.pdf`); }} 
                                                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                                            title="Descargar PDF"
                                                        >
                                                            📥
                                                        </button>
                                                    )}
                                                </div>
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