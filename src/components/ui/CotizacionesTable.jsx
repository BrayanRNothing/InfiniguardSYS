import React, { useState, useEffect } from 'react';

const CotizacionesTable = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obtener datos del backend cuando el componente se monte
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const response = await fetch('https://infiniguardsys-production.up.railway.app/api/servicios');
        if (response.ok) {
          const data = await response.json();
          setSolicitudes(data);
        }
      } catch (error) {
        console.error('Error obteniendo servicios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServicios();
    
    // Actualizar cada 5 segundos para ver nuevos datos
    const interval = setInterval(fetchServicios, 5000);
    return () => clearInterval(interval);
  }, []);

  // Función para pintar las etiquetas de estado
  const getStatusBadge = (estado) => {
    const estilos = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${estilos[estado] || 'bg-gray-100'}`}>
        {estado}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Encabezado de la tabla */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Bandeja de Entrada</h2>
        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border">
          {loading ? '...' : `${solicitudes.length} solicitudes`}
        </span>
      </div>

      {/* Tabla Responsiva */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando solicitudes...</div>
        ) : solicitudes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay solicitudes aún</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-6 py-3 font-semibold">Usuario / Rol</th>
                <th className="px-6 py-3 font-semibold">Proyecto</th>
                <th className="px-6 py-3 font-semibold">Tipo</th>
                <th className="px-6 py-3 font-semibold">Modelo</th>
                <th className="px-6 py-3 font-semibold">Cantidad</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {solicitudes.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/50 transition duration-150">
                  <td className="px-6 py-4 text-gray-500 text-sm">#{item.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{item.cliente}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{item.titulo}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{item.tipo}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{item.modelo || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{item.cantidad || '-'}</td>
                  <td className="px-6 py-4">{getStatusBadge(item.estado)}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3">
                      Ver Foto
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 text-sm">
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Paginación simple (Visual) */}
      <div className="px-6 py-4 border-t border-gray-100 text-center">
        <button className="text-sm text-blue-600 hover:underline">Ver todas las solicitudes</button>
      </div>

    </div>
  );
};

export default CotizacionesTable;
