import React, { useState, useEffect } from 'react';
import API_URL from '../../config/api';
import toast from 'react-hot-toast';

const Comisiones = () => {
    const [servicios, setServicios] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [filtroVendedor, setFiltroVendedor] = useState('todos');
    const [filtroPeriodo, setFiltroPeriodo] = useState('mes');
    const [loading, setLoading] = useState(true);
    const [editandoComision, setEditandoComision] = useState(null);

    useEffect(() => {
        cargarDatos();
        const interval = setInterval(cargarDatos, 30000);
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

            setServicios(serviciosData);
            // Filtrar admins (rol === 'admin')
            setAdmins(usuariosData.filter(u => u.rol === 'admin'));
            setLoading(false);
        } catch (error) {
            console.error('Error cargando datos:', error);
            toast.error('Error al cargar datos');
            setLoading(false);
        }
    };

    // Solo servicios finalizados con adminVendedor asignado
    const serviciosFinalizados = servicios.filter(s => s.estado === 'finalizado');

    // Filtrar por periodo
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
                return new Date(2000, 0, 1);
        }
    };

    const serviciosFiltrados = serviciosFinalizados.filter(s => {
        const cumpleVendedor = filtroVendedor === 'todos' || s.adminvendedor === filtroVendedor;
        const fechaServicio = new Date(s.fecha);
        const cumpleFecha = fechaServicio >= getFechaInicio();
        return cumpleVendedor && cumpleFecha;
    });

    // Calcular estadísticas por admin/vendedor
    const calcularEstadisticasVendedor = (nombreVendedor) => {
        const serviciosVendedor = serviciosFiltrados.filter(s => s.adminvendedor === nombreVendedor);

        const totalServicios = serviciosVendedor.length;
        const totalGanado = serviciosVendedor.reduce((sum, s) => {
            const precio = parseFloat(s.precio || s.precioestimado) || 0;
            const porcentaje = parseFloat(s.porcentajecomision) || 0;
            return sum + (precio * porcentaje / 100);
        }, 0);

        const promedioServicio = totalServicios > 0 ? totalGanado / totalServicios : 0;

        return {
            nombre: nombreVendedor,
            servicios: totalServicios,
            ganado: totalGanado,
            promedio: promedioServicio,
            detalles: serviciosVendedor
        };
    };

    // Obtener todos los vendedores únicos de los servicios filtrados (por si hay admins sin cuenta)
    const vendedoresUnicos = [...new Set(
        serviciosFiltrados
            .map(s => s.adminvendedor)
            .filter(Boolean)
    )];

    // También incluir admins registrados que coincidan con vendedores
    const todosLosVendedores = [...new Set([
        ...admins.map(a => a.nombre),
        ...vendedoresUnicos
    ])];

    const estadisticasVendedores = todosLosVendedores
        .map(nombre => calcularEstadisticasVendedor(nombre))
        .filter(e => e.servicios > 0)
        .sort((a, b) => b.ganado - a.ganado);

    const totales = {
        servicios: serviciosFiltrados.filter(s => s.adminvendedor).length,
        ganado: estadisticasVendedores.reduce((sum, e) => sum + e.ganado, 0),
        promedio: estadisticasVendedores.length > 0
            ? estadisticasVendedores.reduce((sum, e) => sum + e.ganado, 0) / estadisticasVendedores.length
            : 0
    };

    const actualizarComision = async (servicioId, nuevoPorcentaje) => {
        const porcentajeNumero = parseFloat(nuevoPorcentaje);
        try {
            const res = await fetch(`${API_URL}/api/servicios/${servicioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ porcentajeComision: porcentajeNumero })
            });
            if (res.ok) {
                toast.success('Comisión actualizada');
                setEditandoComision(null);
                cargarDatos();
            } else {
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
                <h1 className="text-3xl font-bold text-gray-800">💰 Comisiones por Ventas</h1>
                <p className="text-gray-500">Comisiones generadas por cotizaciones cerradas — asignadas al admin que vendió</p>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Vendedor / Admin</label>
                        <select
                            value={filtroVendedor}
                            onChange={(e) => setFiltroVendedor(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="todos">Todos los vendedores</option>
                            {todosLosVendedores.map(nombre => (
                                <option key={nombre} value={nombre}>{nombre}</option>
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
                        <span className="text-blue-100 text-sm font-medium">Ventas Cerradas</span>
                        <span className="text-3xl">✅</span>
                    </div>
                    <p className="text-3xl font-bold">{totales.servicios}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-100 text-sm font-medium">Promedio por Vendedor</span>
                        <span className="text-3xl">📊</span>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(totales.promedio)}</p>
                </div>
            </div>

            {/* Tabla por Vendedor */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">🏆 Ranking de Vendedores</h2>
                    <p className="text-sm text-gray-400 mt-1">Admins que cotizaron y cerraron ventas</p>
                </div>

                {estadisticasVendedores.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <div className="text-5xl mb-3">💼</div>
                        <p>No hay comisiones registradas en el periodo seleccionado</p>
                        <p className="text-xs mt-2 text-gray-300">Las comisiones se generan cuando un servicio es finalizado y fue cotizado por un admin</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Vendedor / Admin
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Ventas Cerradas
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Total Comisión
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Promedio/Venta
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {estadisticasVendedores.map((vendedor, index) => (
                                    <tr key={vendedor.nombre} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {index === 0 && <span className="text-2xl">🏆</span>}
                                                {index === 1 && <span className="text-2xl">🥈</span>}
                                                {index === 2 && <span className="text-2xl">🥉</span>}
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
                                                    {vendedor.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-gray-800">{vendedor.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                                {vendedor.servicios}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-green-600 font-bold text-lg">
                                                {formatCurrency(vendedor.ganado)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-gray-700 font-semibold">
                                                {formatCurrency(vendedor.promedio)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Historial Detallado */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">📋 Historial Detallado de Ventas</h2>
                </div>

                {serviciosFiltrados.filter(s => s.adminvendedor).length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No hay servicios con vendedor asignado para mostrar
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Servicio</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Vendedor</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Precio</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Comisión %</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ganado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {serviciosFiltrados.filter(s => s.adminvendedor).map(servicio => {
                                    const precio = parseFloat(servicio.precio || servicio.precioestimado) || 0;
                                    const porcentaje = parseFloat(servicio.porcentajecomision) || 0;
                                    const comision = precio * porcentaje / 100;

                                    return (
                                        <tr key={servicio.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                                {servicio.titulo}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {servicio.cliente || servicio.usuario || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                                                    👤 {servicio.adminvendedor}
                                                </span>
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
