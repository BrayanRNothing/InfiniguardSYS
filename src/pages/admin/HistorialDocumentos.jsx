import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerDocumentos, obtenerHistorial } from '../../utils/documentStorage';
import TimelineDocumentos from '../../components/documentos/TimelineDocumentos';
import API_URL from '../../config/api';
import toast from 'react-hot-toast';

/**
 * Vista de Historial de Documentos
 * Muestra todos los documentos generados con filtros y búsqueda
 */
function HistorialDocumentos() {
    const navigate = useNavigate();
    const [servicios, setServicios] = useState([]);
    const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
    const [documentos, setDocumentos] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);

    // Cargar servicios al montar
    useEffect(() => {
        cargarServicios();
    }, []);

    const cargarServicios = async () => {
        try {
            const response = await fetch(`${API_URL}/api/servicios`);
            const data = await response.json();
            setServicios(data);
            setCargando(false);
        } catch (error) {
            console.error('Error cargando servicios:', error);
            toast.error('Error cargando servicios');
            setCargando(false);
        }
    };

    const cargarDocumentosServicio = async (servicioId) => {
        try {
            const docs = await obtenerDocumentos(servicioId);
            const hist = await obtenerHistorial(servicioId);
            setDocumentos(docs);
            setHistorial(hist);
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
        // Navegar al formulario correspondiente con datos pre-llenados
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

    // Filtrar documentos
    const documentosFiltrados = documentos.filter(doc => {
        const cumpleTipo = filtroTipo === 'todos' || doc.tipo === filtroTipo;
        const cumpleBusqueda = !busqueda ||
            doc.numero?.toLowerCase().includes(busqueda.toLowerCase()) ||
            doc.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
        return cumpleTipo && cumpleBusqueda;
    });

    if (cargando) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">📚 Historial de Documentos</h1>
                <p className="text-gray-600">Visualiza y gestiona todos los documentos generados</p>
            </div>

            {/* Selector de Servicio */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Selecciona un Servicio
                </label>
                <select
                    value={servicioSeleccionado || ''}
                    onChange={(e) => cargarDocumentosServicio(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">-- Seleccionar Servicio --</option>
                    {servicios.map(servicio => (
                        <option key={servicio.id} value={servicio.id}>
                            #{servicio.id} - {servicio.cliente} - {servicio.tipo}
                        </option>
                    ))}
                </select>
            </div>

            {/* Contenido Principal */}
            {servicioSeleccionado && (
                <>
                    {/* Filtros y Búsqueda */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Filtro por Tipo */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Filtrar por Tipo
                                </label>
                                <select
                                    value={filtroTipo}
                                    onChange={(e) => setFiltroTipo(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="todos">Todos los Documentos</option>
                                    <option value="cotizacion">Cotizaciones</option>
                                    <option value="orden_trabajo">Órdenes de Trabajo</option>
                                    <option value="reporte_trabajo">Reportes de Trabajo</option>
                                </select>
                            </div>

                            {/* Búsqueda */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Buscar
                                </label>
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Número o cliente..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Estadísticas */}
                        <div className="mt-4 flex gap-4 text-sm">
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
                    </div>

                    {/* Timeline de Documentos */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">📄 Documentos Generados</h2>
                        <TimelineDocumentos
                            documentos={documentosFiltrados}
                            onDescargar={handleDescargar}
                            onConvertir={handleConvertir}
                        />
                    </div>

                    {/* Historial de Eventos */}
                    {historial.length > 0 && (
                        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">🕐 Historial de Eventos</h2>
                            <div className="space-y-2">
                                {historial.map((evento, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <span className="text-2xl">📌</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">{evento.descripcion}</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(evento.fecha).toLocaleString('es-MX')}
                                                {evento.usuario && ` • ${evento.usuario}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default HistorialDocumentos;
