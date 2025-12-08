import React, { useState, useEffect } from 'react';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [vistaActual, setVistaActual] = useState('menu'); // menu | admin | tecnico | distribuidor | cliente

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await fetch('https://infiniguardsys-production.up.railway.app/api/usuarios');
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Filtrar usuarios por rol
  const admins = usuarios.filter(u => u.rol === 'admin');
  const tecnicos = usuarios.filter(u => u.rol === 'tecnico');
  const distribuidores = usuarios.filter(u => u.rol === 'distribuidor');
  const clientes = usuarios.filter(u => u.rol === 'cliente');

  if (vistaActual === 'menu') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👥 Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm">Administra usuarios por rol</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Opción 1: Administradores */}
          <button
            onClick={() => setVistaActual('admin')}
            className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">👑</div>
            <h2 className="text-2xl font-bold mb-2">Administradores</h2>
            <p className="text-red-100 text-sm">Gestión del sistema</p>
            {admins.length > 0 && (
              <div className="mt-4 bg-red-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{admins.length}</span>
                <span className="text-sm ml-1">usuarios</span>
              </div>
            )}
          </button>

          {/* Opción 2: Técnicos */}
          <button
            onClick={() => setVistaActual('tecnico')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">🔧</div>
            <h2 className="text-2xl font-bold mb-2">Técnicos</h2>
            <p className="text-blue-100 text-sm">Personal operativo</p>
            {tecnicos.length > 0 && (
              <div className="mt-4 bg-blue-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{tecnicos.length}</span>
                <span className="text-sm ml-1">usuarios</span>
              </div>
            )}
          </button>

          {/* Opción 3: Distribuidores */}
          <button
            onClick={() => setVistaActual('distribuidor')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">Distribuidores</h2>
            <p className="text-purple-100 text-sm">Socios comerciales</p>
            {distribuidores.length > 0 && (
              <div className="mt-4 bg-purple-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{distribuidores.length}</span>
                <span className="text-sm ml-1">usuarios</span>
              </div>
            )}
          </button>

          {/* Opción 4: Clientes */}
          <button
            onClick={() => setVistaActual('cliente')}
            className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">👤</div>
            <h2 className="text-2xl font-bold mb-2">Clientes</h2>
            <p className="text-green-100 text-sm">Base de clientes</p>
            {clientes.length > 0 && (
              <div className="mt-4 bg-green-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{clientes.length}</span>
                <span className="text-sm ml-1">usuarios</span>
              </div>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Vista de Administradores
  if (vistaActual === 'admin') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👑 Administradores</h1>
          <p className="text-gray-500 text-sm">{admins.length} usuarios con permisos completos</p>
        </div>

        {admins.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No hay administradores registrados</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {admins.map(user => (
              <div key={user.id} className="bg-red-50 border border-red-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user.nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{user.nombre}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-xs font-bold inline-block">
                  ADMINISTRADOR
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista de Técnicos
  if (vistaActual === 'tecnico') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🔧 Técnicos</h1>
          <p className="text-gray-500 text-sm">{tecnicos.length} técnicos operativos</p>
        </div>

        {tecnicos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No hay técnicos registrados</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tecnicos.map(user => (
              <div key={user.id} className="bg-blue-50 border border-blue-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user.nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{user.nombre}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-bold inline-block">
                  TÉCNICO
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista de Distribuidores
  if (vistaActual === 'distribuidor') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">📦 Distribuidores</h1>
          <p className="text-gray-500 text-sm">{distribuidores.length} socios comerciales</p>
        </div>

        {distribuidores.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No hay distribuidores registrados</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {distribuidores.map(user => (
              <div key={user.id} className="bg-purple-50 border border-purple-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user.nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{user.nombre}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-bold inline-block">
                  DISTRIBUIDOR
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista de Clientes
  if (vistaActual === 'cliente') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👤 Clientes</h1>
          <p className="text-gray-500 text-sm">{clientes.length} clientes registrados</p>
        </div>

        {clientes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No hay clientes registrados</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientes.map(user => (
              <div key={user.id} className="bg-green-50 border border-green-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user.nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{user.nombre}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-bold inline-block">
                  CLIENTE
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default Usuarios;
