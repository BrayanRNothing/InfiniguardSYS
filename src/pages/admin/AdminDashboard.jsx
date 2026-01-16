import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../../config/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    cotizacionesPendientes: 0,
    serviciosPendientes: 0,
    serviciosActivos: 0,
    serviciosFinalizados: 0,
    totalUsuarios: 0,
    tecnicos: 0,
    usuarios: 0,
    distribuidores: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();

    // Auto-refresh cada 10 segundos
    const interval = setInterval(() => {
      cargarDatos();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar servicios
      const resServicios = await fetch(`${API_URL}/api/servicios`);
      const servicios = await resServicios.json();

      // Cargar usuarios
      const resUsuarios = await fetch(`${API_URL}/api/usuarios`);
      const usuarios = await resUsuarios.json();

      // Calcular estadísticas
      const cotizacionesPendientes = servicios.filter(s => s.estado === 'pendiente').length;
      const serviciosPendientes = servicios.filter(s => s.estado === 'aprobado').length;
      const serviciosActivos = servicios.filter(s => s.estado === 'en-proceso').length;
      const serviciosFinalizados = servicios.filter(s => s.estado === 'finalizado').length;
      const tecnicos = usuarios.filter(u => u.rol === 'tecnico').length;
      const usuariosCount = usuarios.filter(u => u.rol === 'usuario').length;
      const distribuidores = usuarios.filter(u => u.rol === 'distribuidor').length;

      setStats({
        cotizacionesPendientes,
        serviciosPendientes,
        serviciosActivos,
        serviciosFinalizados,
        totalUsuarios: usuarios.length,
        tecnicos,
        usuarios: usuariosCount,
        distribuidores
      });

      // Obtener últimas 5 actividades
      const recientes = servicios
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);
      setRecentActivity(recientes);

      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': 'bg-orange-100 text-orange-800',
      'cotizado': 'bg-blue-100 text-blue-800',
      'aprobado': 'bg-green-100 text-green-800',
      'rechazado': 'bg-red-100 text-red-800',
      'en-proceso': 'bg-purple-100 text-purple-800',
      'finalizado': 'bg-gray-100 text-gray-800'
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="text-gray-500">Cargando estadísticas...</div>
    </div>;
  }

  return (
    <div className="space-y-8">

      {/* 1. Título y Bienvenida */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">📊 Panel de Control</h1>
        <p className="text-gray-500">Resumen general del sistema</p>
      </div>

      {/* 2. Grid de Estadísticas (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link to="/admin/cotizaciones" className="bg-linear-to-br from-orange-500/80 to-orange-600/80 backdrop-blur-md rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105 border border-white/10 min-h-[140px]">
          <div className="flex flex-col items-center justify-center text-center h-full">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-orange-100 text-xs font-medium mb-2">Cotizaciones Pendientes</p>
            <p className="text-3xl font-bold">{stats.cotizacionesPendientes}</p>
          </div>
        </Link>

        <Link to="/admin/servicios" className="bg-linear-to-br from-yellow-500/80 to-yellow-600/80 backdrop-blur-md rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105 border border-white/10 min-h-[140px]">
          <div className="flex flex-col items-center justify-center text-center h-full">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-yellow-100 text-xs font-medium mb-2">Servicios Pendientes</p>
            <p className="text-3xl font-bold">{stats.serviciosPendientes}</p>
          </div>
        </Link>

        <Link to="/admin/servicios" className="bg-linear-to-br from-purple-500/80 to-purple-600/80 backdrop-blur-md rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105 border border-white/10 min-h-[140px]">
          <div className="flex flex-col items-center justify-center text-center h-full">
            <div className="text-4xl mb-3">⚙️</div>
            <p className="text-purple-100 text-xs font-medium mb-2">Servicios Activos</p>
            <p className="text-3xl font-bold">{stats.serviciosActivos}</p>
          </div>
        </Link>

        <Link to="/admin/servicios" className="bg-linear-to-br from-green-500/80 to-green-600/80 backdrop-blur-md rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105 border border-white/10 min-h-[140px]">
          <div className="flex flex-col items-center justify-center text-center h-full">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-100 text-xs font-medium mb-2">Servicios Finalizados</p>
            <p className="text-3xl font-bold">{stats.serviciosFinalizados}</p>
          </div>
        </Link>

        <Link to="/admin/usuarios" className="bg-linear-to-br from-blue-500/80 to-blue-600/80 backdrop-blur-md rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105 border border-white/10 min-h-[140px]">
          <div className="flex flex-col items-center justify-center text-center h-full">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-blue-100 text-xs font-medium mb-2">Total Usuarios</p>
            <p className="text-3xl font-bold">{stats.totalUsuarios}</p>
          </div>
        </Link>
      </div>

      {/* 3. Grid de Información Adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">

          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl"></span>
            Personal
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700 font-medium">Técnicos Activos</span>
              <span className="text-2xl font-bold text-blue-600">{stats.tecnicos}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700 font-medium">Usuarios Registrados</span>
              <span className="text-2xl font-bold text-green-600">{stats.usuarios}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-gray-700 font-medium">Distribuidores</span>
              <span className="text-2xl font-bold text-orange-600">{stats.distribuidores}</span>
            </div>
          </div>

        </div>

        {/* Accesos Rápidos */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl"></span>
            Accesos Rápidos
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/admin/cotizaciones"
              className="p-4 bg-linear-to-br from-orange-50 to-orange-100 rounded-lg hover:from-orange-100 hover:to-orange-200 transition text-center"
            >
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm font-semibold text-gray-700">Cotizaciones</p>
            </Link>
            <Link
              to="/admin/servicios"
              className="p-4 bg-linear-to-br from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition text-center"
            >
              <div className="text-3xl mb-2">🔧</div>
              <p className="text-sm font-semibold text-gray-700">Servicios</p>
            </Link>
            <Link
              to="/admin/usuarios"
              className="p-4 bg-linear-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition text-center"
            >
              <div className="text-3xl mb-2">👥</div>
              <p className="text-sm font-semibold text-gray-700">Usuarios</p>
            </Link>
            <Link
              to="/admin/comisiones"
              className="p-4 bg-linear-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition text-center"
            >
              <div className="text-3xl mb-2">💰</div>
              <p className="text-sm font-semibold text-gray-700">Comisiones</p>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Actividad Reciente */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl"></span>
          Actividad Reciente
        </h2>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No hay actividad reciente</div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{item.titulo}</h4>
                  <p className="text-sm text-gray-600">
                    {item.cliente || item.usuario} • {item.tipo}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{item.fecha}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(item.estado)}`}>
                    {item.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;