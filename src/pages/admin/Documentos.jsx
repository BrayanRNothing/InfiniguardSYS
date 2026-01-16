import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../config/api';
import BotonMenu from '../../components/ui/BotonMenu';
import { obtenerDocumentos } from '../../utils/documentStorage';
import TimelineDocumentos from '../../components/documentos/TimelineDocumentos';
import toast from 'react-hot-toast';

function Documentos() {
    const navigate = useNavigate();
    const [servicios, setServicios] = useState([]);
    const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
    const [documentos, setDocumentos] = useState([]);
    const [vistaActual, setVistaActual] = useState('menu'); // 'menu' o 'historial'

    useEffect(() => {
        cargarServicios();
    }, []);

    const cargarServicios = async () => {
        try {
            const response = await fetch(`${API_URL}/api/servicios`);
            const data = await response.json();
            setServicios(data);
        } catch (error) {
            console.error('Error cargando servicios:', error);
        }
    };

    const cargarDocumentosServicio = async (servicioId) => {
        try {
            const docs = await obtenerDocumentos(servicioId);
            setDocumentos(docs);
            setServicioSeleccionado(servicioId);
        } catch (error) {
            console.error('Error cargando documentos:', error);
            toast.error('Error cargando documentos');
        }
    };

    const handleDescargar = (documento) => {
        if (documento.pdfUrl) {
            window.open(`${API_URL}/${documento.pdfUrl}`, '_blank');
        } else {
            toast.error('PDF no disponible');
        }
    };

    const handleConvertir = (documento, tipoDestino) => {
        if (tipoDestino === 'orden_trabajo') {
            navigate('/admin/crear-orden-trabajo', {
                state: { desdeCotizacion: true, cotizacion: documento }
            });
        } else if (tipoDestino === 'reporte_trabajo') {
            navigate('/admin/crear-reporte-trabajo', {
                state: { desdeOrden: true, orden: documento }
            });
        }
    };

    // Vista de menú principal (4 tarjetas)
    if (vistaActual === 'menu') {
        return (
            <div className="w-full h-full animate-fadeInUp flex flex-col min-h-0">
                {/* Encabezado */}
                <div className="mb-6 shrink-0">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-500">Gestión de Documentos</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg hidden md:block">Crear y administrar documentos del sistema</p>
                </div>

                {/* Grid de 4 botones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full grow">
                    <BotonMenu
                        gradient="from-blue-500/80 to-blue-600/80 hover:from-blue-600/90 hover:to-blue-700/90"
                        icon="📄"
                        titulo="Cotizaciones"
                        badgeText="Generar Cotización"
                        onClick={() => navigate('/admin/crear-cotizaciones')}
                    />
                    <BotonMenu
                        gradient="from-purple-500/80 to-purple-600/80 hover:from-purple-600/90 hover:to-purple-700/90"
                        icon="📋"
                        titulo="Orden de Trabajo"
                        badgeText="Nueva Orden"
                        onClick={() => navigate('/admin/crear-orden-trabajo')}
                    />
                    <BotonMenu
                        gradient="from-green-500/80 to-green-600/80 hover:from-green-600/90 hover:to-green-700/90"
                        icon="📊"
                        titulo="Reporte de Trabajo"
                        badgeText="Generar Reporte"
                        onClick={() => navigate('/admin/crear-reporte-trabajo')}
                    />
                    <BotonMenu
                        gradient="from-orange-500/80 to-orange-600/80 hover:from-orange-600/90 hover:to-orange-700/90"
                        icon="📚"
                        titulo="Historial"
                        badgeText="Ver Documentos"
                        onClick={() => setVistaActual('historial')}
                    />
                </div>
            </div>
        );
    }

    // Vista de Historial (pantalla completa)
    if (vistaActual === 'historial') {
        return (
            <div className="max-w-7xl mx-auto animate-fadeInUp pb-12 w-full h-screen overflow-auto">
                <button
                    onClick={() => setVistaActual('menu')}
                    className="mb-6 text-gray-600 hover:text-gray-700 font-semibold flex items-center gap-2 transition-colors"
                >
                    ← Volver al menú
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📚 Historial de Documentos</h2>
                    <p className="text-gray-600">Visualiza todos los documentos generados por servicio</p>
                </div>

                {/* Selector de Servicio */}
                <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Selecciona un Servicio
                    </label>
                    <select
                        value={servicioSeleccionado || ''}
                        onChange={(e) => cargarDocumentosServicio(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                        <option value="">-- Seleccionar Servicio --</option>
                        {servicios.map(servicio => (
                            <option key={servicio.id} value={servicio.id}>
                                #{servicio.id} - {servicio.cliente} - {servicio.tipo}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Timeline de Documentos */}
                {servicioSeleccionado && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="mb-4 flex gap-4 text-sm flex-wrap">
                            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold">
                                💰 {documentos.filter(d => d.tipo === 'cotizacion').length} Cotizaciones
                            </div>
                            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-semibold">
                                📋 {documentos.filter(d => d.tipo === 'orden_trabajo').length} Órdenes
                            </div>
                            <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-semibold">
                                ✅ {documentos.filter(d => d.tipo === 'reporte_trabajo').length} Reportes
                            </div>
                        </div>

                        <TimelineDocumentos
                            documentos={documentos}
                            onDescargar={handleDescargar}
                            onConvertir={handleConvertir}
                        />
                    </div>
                )}
            </div>
        );
    }

    return null;
}

export default Documentos;
