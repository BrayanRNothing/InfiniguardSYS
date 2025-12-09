import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [vistaActual, setVistaActual] = useState('menu');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'cliente'
  });

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

  const abrirModal = (rol) => {
    setFormData({ nombre: '', email: '', password: '', rol });
    setModoEdicion(false);
    setUsuarioEditando(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (usuario) => {
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol
    });
    setModoEdicion(true);
    setUsuarioEditando(usuario);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setFormData({ nombre: '', email: '', password: '', rol: 'cliente' });
    setModoEdicion(false);
    setUsuarioEditando(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.email || (!modoEdicion && !formData.password)) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    try {
      if (modoEdicion) {
        const res = await fetch(`https://infiniguardsys-production.up.railway.app/api/usuarios/${usuarioEditando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          toast.success('✅ Usuario actualizado');
          cargarUsuarios();
          cerrarModal();
        } else {
          toast.error('Error al actualizar');
        }
      } else {
        const res = await fetch('https://infiniguardsys-production.up.railway.app/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          toast.success('✅ Usuario creado');
          cargarUsuarios();
          cerrarModal();
        } else {
          toast.error('Error al crear');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de conexión');
    }
  };

  const handleEliminar = async (id, nombre) => {
    try {
      const res = await fetch(`https://infiniguardsys-production.up.railway.app/api/usuarios/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('🗑️ Usuario eliminado');
        cargarUsuarios();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de conexión');
    }
  };

  const admins = usuarios.filter(u => u.rol === 'admin');
  const tecnicos = usuarios.filter(u => u.rol === 'tecnico');
  const distribuidores = usuarios.filter(u => u.rol === 'distribuidor');
  const clientes = usuarios.filter(u => u.rol === 'cliente');

  const renderTarjetaUsuario = (user, color) => (
    <div key={user.id} className={`bg-${color}-50 border-2 border-${color}-300 rounded-lg p-6`}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={user.nombre} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 truncate">{user.nombre}</h3>
          <p className="text-sm text-gray-600 truncate">{user.email}</p>
        </div>
      </div>
      <div className={`bg-${color}-200 text-${color}-800 px-3 py-1 rounded-full text-xs font-bold inline-block mb-3 uppercase`}>
        {user.rol}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => abrirModalEditar(user)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 px-3 rounded transition"
        >
          ✏️ Editar
        </button>
        <button
          onClick={() => handleEliminar(user.id, user.nombre)}
          className={`flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded transition`}
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );

  if (vistaActual === 'menu') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👥 Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm">Administra usuarios por rol</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <button onClick={() => setVistaActual('admin')} className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 h-72 flex flex-col items-center justify-center">
            <div className="text-7xl mb-4">👑</div>
            <h2 className="text-2xl font-bold mb-2">Administradores</h2>
            {admins.length > 0 && <div className="mt-4 bg-red-700/80 rounded-full px-6 py-2"><span className="text-2xl font-bold">{admins.length}</span></div>}
          </button>

          <button onClick={() => setVistaActual('tecnico')} className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 h-72 flex flex-col items-center justify-center">
            <div className="text-7xl mb-4">🔧</div>
            <h2 className="text-2xl font-bold mb-2">Técnicos</h2>
            {tecnicos.length > 0 && <div className="mt-4 bg-blue-700/80 rounded-full px-6 py-2"><span className="text-2xl font-bold">{tecnicos.length}</span></div>}
          </button>

          <button onClick={() => setVistaActual('distribuidor')} className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 h-72 flex flex-col items-center justify-center">
            <div className="text-7xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">Distribuidores</h2>
            {distribuidores.length > 0 && <div className="mt-4 bg-purple-700/80 rounded-full px-6 py-2"><span className="text-2xl font-bold">{distribuidores.length}</span></div>}
          </button>

          <button onClick={() => setVistaActual('cliente')} className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 h-72 flex flex-col items-center justify-center">
            <div className="text-7xl mb-4">👤</div>
            <h2 className="text-2xl font-bold mb-2">Clientes</h2>
            {clientes.length > 0 && <div className="mt-4 bg-green-700/80 rounded-full px-6 py-2"><span className="text-2xl font-bold">{clientes.length}</span></div>}
          </button>
        </div>
      </div>
    );
  }

  if (vistaActual === 'admin') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold">← Volver</button>
        <div className="mb-8 flex justify-between items-center">
          <div><h1 className="text-3xl font-bold text-gray-800">👑 Administradores</h1><p className="text-gray-500 text-sm">{admins.length} usuarios</p></div>
          <button onClick={() => abrirModal('admin')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold">+ Crear Admin</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{admins.map(user => renderTarjetaUsuario(user, 'red'))}</div>
      </div>
    );
  }

  if (vistaActual === 'tecnico') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold">← Volver</button>
        <div className="mb-8 flex justify-between items-center">
          <div><h1 className="text-3xl font-bold text-gray-800">🔧 Técnicos</h1><p className="text-gray-500 text-sm">{tecnicos.length} usuarios</p></div>
          <button onClick={() => abrirModal('tecnico')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">+ Crear Técnico</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{tecnicos.map(user => renderTarjetaUsuario(user, 'blue'))}</div>
      </div>
    );
  }

  if (vistaActual === 'distribuidor') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold">← Volver</button>
        <div className="mb-8 flex justify-between items-center">
          <div><h1 className="text-3xl font-bold text-gray-800">📦 Distribuidores</h1><p className="text-gray-500 text-sm">{distribuidores.length} usuarios</p></div>
          <button onClick={() => abrirModal('distribuidor')} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold">+ Crear Distribuidor</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{distribuidores.map(user => renderTarjetaUsuario(user, 'purple'))}</div>
      </div>
    );
  }

  if (vistaActual === 'cliente') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold">← Volver</button>
        <div className="mb-8 flex justify-between items-center">
          <div><h1 className="text-3xl font-bold text-gray-800">👤 Clientes</h1><p className="text-gray-500 text-sm">{clientes.length} usuarios</p></div>
          <button onClick={() => abrirModal('cliente')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">+ Crear Cliente</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{clientes.map(user => renderTarjetaUsuario(user, 'green'))}</div>
      </div>
    );
  }

  return (
    <>
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{modoEdicion ? 'Editar Usuario' : 'Crear Usuario'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Completo *</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña {modoEdicion && '(dejar vacío para no cambiar)'}</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required={!modoEdicion} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Rol *</label>
                <select value={formData.rol} onChange={(e) => setFormData({...formData, rol: e.target.value})} className="w-full px-4 py-3 border rounded-lg" required>
                  <option value="admin">Administrador</option>
                  <option value="tecnico">Técnico</option>
                  <option value="distribuidor">Distribuidor</option>
                  <option value="cliente">Cliente</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={cerrarModal} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold">{modoEdicion ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Usuarios;
