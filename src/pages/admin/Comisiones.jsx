import React, { useState, useEffect } from 'react';
import API_URL from '../../config/api';
import toast from 'react-hot-toast';

const Comisiones = () => {
    const [servicios, setServicios] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [filtroTecnico, setFiltroTecnico] = useState('todos');
    const [filtroPeriodo, setFiltroPeriodo] = useState('mes');
    const [loading, setLoading] = useState(true);
    const [editandoComision, setEditandoComision] = useState(null);

    useEffect(() => {
        cargarDatos();
        const interval = setInterval(cargarDatos, 30000); // Refresh cada 30 segundos
        return () => clearInterval(interval);
    }, []);

    const cargarDatos = async () => {
        try {
            const [resServicios, resUsuarios] = await Promise.all([
                fetch(`${API_URL}/api/servicios`),
                fetch(`${API_URL}/api/usuarios`)
            ]);

            const serviciosData = await resServicios.json();
            const usuariosData = await resUsuarios.json();

            console.log('Servicios cargados:', serviciosData.length);
            console.log('Servicios finalizados:', serviciosData.filter(s => s.estado === 'finalizado').length);
            console.log('Técnicos encontrados:', usuariosData.filter(u => u.rol === 'tecnico').length);

            // Mostrar estructura de un servicio finalizado para debug
            const servicioFinalizado = serviciosData.find(s => s.estado === 'finalizado');
            if (servicioFinalizado) {
                console.log('Ejemplo de servicio finalizado:', servicioFinalizado);
            }

            setServicios(serviciosData);
            setTecnicos(usuariosData.filter(u => u.rol === 'tecnico'));
            setLoading(false);
        } catch (error) {
            console.error('Error cargando datos:', error);
            toast.error('Error al cargar datos');
            setLoading(false);
        }
    };

    // Filtrar servicios finalizados
    const serviciosFinalizados = servicios.filter(s => s.estado === 'finalizado');

    // Aplicar filtros de periodo
    const getFechaInicio = () => {
        const hoy = new Date();
        switch (filtroPeriodo) {
            case 'semana':
                return new Date(hoy.setDate(hoy.getDate() - 7));
            case 'mes':
                return new Date(hoy.setMonth(hoy.getMonth() - 1));
            case 'trimestre':
                return new Date(hoy.setMonth(hoy.getMonth() - 3));
            default:
                return new Date(2000, 0, 1); // Todos
        }
    };

    const serviciosFiltrados = serviciosFinalizados.filter(s => {
        const cumpleTecnico = filtroTecnico === 'todos' || s.tecnicoAsignado === filtroTecnico;
        const fechaServicio = new Date(s.fecha);
        const cumpleFecha = fechaServicio >= getFechaInicio();
        return cumpleTecnico && cumpleFecha;
    });

    // Calcular estadísticas por técnico
    const calcularEstadisticasTecnico = (nombreTecnico) => {
        const serviciosTecnico = serviciosFiltrados.filter(s => s.tecnicoAsignado === nombreTecnico);

        const totalServicios = serviciosTecnico.length;
        const totalGanado = serviciosTecnico.reduce((sum, s) => {
            const precio = parseFloat(s.precio || s.precioEstimado) || 0;
            const porcentaje = parseFloat(s.porcentajeComision) || 0;
            return sum + (precio * porcentaje / 100);
        }, 0);

        const promedioServicio = totalServicios > 0 ? totalGanado / totalServicios : 0;

        return {
            nombre: nombreTecnico,
            servicios: totalServicios,
            ganado: totalGanado,
            promedio: promedioServicio,
            detalles: serviciosTecnico
        };
    };

    // Obtener estadísticas de todos los técnicos
    const estadisticasTecnicos = tecnicos
        .map(t => calcularEstadisticasTecnico(t.nombre))
        .filter(e => e.servicios > 0)
        .sort((a, b) => b.ganado - a.ganado);

    // Calcular totales generales
    const totales = {
        servicios: serviciosFiltrados.length,
        ganado: estadisticasTecnicos.reduce((sum, e) => sum + e.ganado, 0),
        promedio: estadisticasTecnicos.length > 0
            ? estadisticasTecnicos.reduce((sum, e) => sum + e.ganado, 0) / estadisticasTecnicos.length
            : 0
    };

    // Actualizar porcentaje de comisión
    const actualizarComision = async (servicioId, nuevoPorcentaje) => {
        const porcentajeNumero = parseFloat(nuevoPorcentaje);

        console.log('Actualizando comisión:', { servicioId, nuevoPorcentaje, porcentajeNumero });

        try {
            const res = await fetch(`${API_URL}/api/servicios/${servicioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ porcentajeComision: porcentajeNumero })
            });

            const data = await res.json();
            console.log('Respuesta del servidor:', data);

            if (res.ok) {
                toast.success('Comisión actualizada');
                setEditandoComision(null);
                cargarDatos();
            } else {
                console.error('Error en respuesta:', data);
                toast.error('Error al actualizar');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error de conexión');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Cargando comisiones...</div>
        </div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">💰 Comisiones de Técnicos</h1>
                <p className="text-gray-500">Sistema de recompensas y seguimiento de desempeño</p>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Técnico</label>
                        <select
                            value={filtroTecnico}
                            onChange={(e) => setFiltroTecnico(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="todos">Todos los técnicos</option>
                            {tecnicos.map(t => (
                                <option key={t.id} value={t.nombre}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Periodo</label>
                        <select
                            value={filtroPeriodo}
                            onChange={(e) => setFiltroPeriodo(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="semana">Última semana</option>
                            <option value="mes">Último mes</option>
                            <option value="trimestre">Últimos 3 meses</option>
                            <option value="todos">Todo el tiempo</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-green-100 text-sm font-medium">Total Comisiones</span>
                        <span className="text-3xl">💵</span>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(totales.ganado)}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-100 text-sm font-medium">Servicios Completados</span>
                        <span className="text-3xl">✅</span>
                    </div>
                    <p className="text-3xl font-bold">{totales.servicios}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-100 text-sm font-medium">Promedio por Técnico</span>
                        <span className="text-3xl">📊</span>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(totales.promedio)}</p>
                </div>
            </div>

            {/* Technician Performance Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Desempeño por Técnico</h2>
                </div>

                {estadisticasTecnicos.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No hay servicios completados en el periodo seleccionado
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Técnico
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Servicios
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Total Ganado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Promedio/Servicio
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {estadisticasTecnicos.map((tecnico, index) => (
                                    <tr key={tecnico.nombre} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {index === 0 && <span className="text-2xl">🏆</span>}
                                                <span className="font-semibold text-gray-800">{tecnico.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                                {tecnico.servicios}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-green-600 font-bold text-lg">
                                                {formatCurrency(tecnico.ganado)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-gray-700 font-semibold">
                                                {formatCurrency(tecnico.promedio)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detailed Service History */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Historial Detallado de Servicios</h2>
                </div>

                {serviciosFiltrados.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No hay servicios para mostrar
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Servicio</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Técnico</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Precio</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Comisión %</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ganado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {serviciosFiltrados.map(servicio => {
                                    const precio = parseFloat(servicio.precio || servicio.precioEstimado) || 0;
                                    const porcentaje = parseFloat(servicio.porcentajeComision) || 0;
                                    const comision = precio * porcentaje / 100;

                                    return (
                                        <tr key={servicio.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                                {servicio.titulo}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {servicio.cliente || servicio.usuario || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {servicio.tecnicoAsignado || 'Sin asignar'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                                {servicio.fecha}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-800 text-right font-semibold">
                                                {formatCurrency(precio)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {editandoComision === servicio.id ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <input
                                                            type="number"
                                                            defaultValue={porcentaje}
                                                            min="0"
                                                            max="100"
                                                            step="0.1"
                                                            className="w-16 px-2 py-1 text-sm border-2 border-blue-500 rounded text-center"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    actualizarComision(servicio.id, e.target.value);
                                                                } else if (e.key === 'Escape') {
                                                                    setEditandoComision(null);
                                                                }
                                                            }}
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => setEditandoComision(null)}
                                                            className="text-gray-400 hover:text-gray-600"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditandoComision(servicio.id)}
                                                        className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-sm font-bold transition"
                                                    >
                                                        {porcentaje}%
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-green-600 text-right font-bold">
                                                {formatCurrency(comision)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Comisiones;
