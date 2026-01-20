import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../config/api';
import BotonMenu from '../../components/ui/BotonMenu';
import { obtenerTodasLasCotizaciones, eliminarCotizacionSimple } from '../../utils/documentStorage';
import { formatearFecha } from '../../utils/documentConverter';
import toast from 'react-hot-toast';

function Documentos() {
    const navigate = useNavigate();
    const [documentos, setDocumentos] = useState([]);
    const [vistaActual, setVistaActual] = useState('menu'); // 'menu' o 'historial'
    const [loading, setLoading] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        if (vistaActual === 'historial') {
            cargarHistorial();
        }
    }, [vistaActual]);

    const cargarHistorial = async () => {
        try {
            setLoading(true);
            const data = await obtenerTodasLasCotizaciones();
            setDocumentos(data);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar historial');
        } finally {
            setLoading(false);
        }
    };

    const handleDescargar = (doc) => {
        if (doc.pdfUrl) {
            window.open(`${API_URL}/${doc.pdfUrl}`, '_blank');
        } else {
            toast.error('PDF no disponible');
        }
    };

    const handleEliminar = async (doc) => {
        if (window.confirm(`¿Seguro que deseas eliminar la cotización ${doc.numero}?`)) {
            try {
                await eliminarCotizacionSimple(doc.numero);
                toast.success('Eliminado correctamente');
                cargarHistorial();
            } catch (error) {
                toast.error('Error al eliminar');
            }
        }
    };

    const handleEditar = (doc) => {
        navigate('/admin/crear-cotizaciones', { state: { cotizacion: doc } });
    };

    const filteredDocs = documentos.filter(doc =>
        doc.numero?.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        (doc.servicioCliente && doc.servicioCliente.toLowerCase().includes(busqueda.toLowerCase()))
    );

    // VISTA MENÚ
    if (vistaActual === 'menu') {
        return (
            <div className="w-full h-full animate-fadeInUp flex flex-col min-h-0">
                <div className="mb-6 shrink-0">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-500">Gestión de Documentos</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Crear y administrar documentos</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full grow">
                    <BotonMenu
                        gradient="from-blue-500/80 to-blue-600/80 hover:from-blue-600/90 hover:to-blue-700/90"
                        icon="💰"
                        titulo="Cotizaciones"
                        badgeText="Generar"
                        onClick={() => navigate('/admin/crear-cotizaciones')}
                    />
                    <BotonMenu
                        gradient="from-purple-500/80 to-purple-600/80 hover:from-purple-600/90 hover:to-purple-700/90"
                        icon="📋"
                        titulo="Orden de Trabajo"
                        badgeText="Nueva"
                        onClick={() => navigate('/admin/crear-orden-trabajo')}
                    />
                    <BotonMenu
                        gradient="from-green-500/80 to-green-600/80 hover:from-green-600/90 hover:to-green-700/90"
                        icon="📊"
                        titulo="Reporte de Trabajo"
                        badgeText="Generar"
                        onClick={() => navigate('/admin/crear-reporte-trabajo')}
                    />
                    <BotonMenu
                        gradient="from-orange-500/80 to-orange-600/80 hover:from-orange-600/90 hover:to-orange-700/90"
                        icon="📚"
                        titulo="Historial"
                        badgeText="Consultar"
                        onClick={() => setVistaActual('historial')}
                    />
                </div>
            </div>
        );
    }

    // VISTA HISTORIAL
    return (
        <div className="max-w-7xl mx-auto animate-fadeInUp pb-12 w-full h-full flex flex-col overflow-hidden">
            <div className="shrink-0 mb-6">
                <button
                    onClick={() => setVistaActual('menu')}
                    className="text-gray-600 hover:text-gray-700 font-bold flex items-center gap-2 mb-4"
                >
                    ← Volver
                </button>
                <h1 className="text-3xl font-bold text-gray-800">📚 Historial de Cotizaciones</h1>

                {/* Buscador */}
                <div className="mt-4 relative max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por número o cliente..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-xl border border-gray-100">
                {loading ? (
                    <div className="p-20 text-center text-gray-400">Cargando...</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Número</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredDocs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">
                                        No se encontraron cotizaciones
                                    </td>
                                </tr>
                            ) : (
                                filteredDocs.map((doc) => (
                                    <tr key={`${doc.servicioId}-${doc.numero}`} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-blue-600">{doc.numero}</td>
                                        <td className="px-6 py-4 text-gray-600">{formatearFecha(doc.fecha)}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {doc.cliente?.nombre || doc.servicioCliente}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => handleDescargar(doc)} className="hover:text-blue-600 transition-colors" title="Ver PDF">📄</button>
                                                <button onClick={() => handleEditar(doc)} className="hover:text-amber-600 transition-colors" title="Editar">✏️</button>
                                                <button onClick={() => handleEliminar(doc)} className="hover:text-red-600 transition-colors" title="Eliminar">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Documentos;
