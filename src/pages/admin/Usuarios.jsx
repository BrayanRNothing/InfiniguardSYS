import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import * as THREE from 'three';
import CELLS from 'vanta/dist/vanta.cells.min.js';

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

  // Componente Modal con efecto Vanta
  function ModalUsuario() {
    const vantaRef = useRef(null);
    const vantaInstanceRef = useRef(null);

    useEffect(() => {
      if (vantaRef.current && !vantaInstanceRef.current) {
        vantaInstanceRef.current = CELLS({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          color1: 0x101025,
          color2: 0x35b1f2,
          size: 5.00,
          speed: 0.90
        });
      }

      return () => {
        if (vantaInstanceRef.current) {
          vantaInstanceRef.current.destroy();
          vantaInstanceRef.current = null;
        }
      };
    }, []);

    return (
      <div ref={vantaRef} className="fixed inset-0 flex items-center justify-center z-50 p-4 text-white">
        <div className="relative z-10 w-full max-w-md bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl">
          <h2 className="text-3xl font-bold mb-6 text-center tracking-wider">
            {modoEdicion ? 'Editar Usuario' : 'Crear Usuario'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre Completo *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Juan Pérez"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="usuario@infiniguard.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Contraseña {modoEdicion && '(dejar vacío para no cambiar)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="••••••••"
                required={!modoEdicion}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Rol *</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({...formData, rol: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              >
                <option value="admin" className="bg-gray-800">Administrador</option>
                <option value="tecnico" className="bg-gray-800">Técnico</option>
                <option value="distribuidor" className="bg-gray-800">Distribuidor</option>
                <option value="cliente" className="bg-gray-800">Cliente</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={cerrarModal}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-lg transition shadow-[0_0_20px_rgba(59,130,246,0.5)]"
              >
                {modoEdicion ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
    <div key={user.id} className={`bg-${color}-50 border-2 border-${color}-300 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all`}>
      <div className="flex items-start gap-4 mb-4">
        <Avatar name={user.nombre} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-800 truncate">{user.nombre}</h3>
          <p className="text-sm text-gray-600 truncate flex items-center gap-1">
            <span>📧</span> {user.email}
          </p>
          <div className={`bg-${color}-200 text-${color}-800 px-3 py-1 rounded-full text-xs font-bold inline-block mt-2 uppercase`}>
            {user.rol === 'admin' && '👑 '}{user.rol === 'tecnico' && '🔧 '}{user.rol === 'distribuidor' && '📦 '}{user.rol === 'cliente' && '👤 '}
            {user.rol}
          </div>
        </div>
      </div>
      
      <div className="bg-white/50 rounded-lg p-3 mb-4 space-y-1">
        <p className="text-xs text-gray-600 flex items-center gap-2">
          <span className="font-semibold">🆔 ID:</span>
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{user.id}</span>
        </p>
        <p className="text-xs text-gray-600 flex items-center gap-2">
          <span className="font-semibold">🔑 Contraseña:</span>
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{'•'.repeat(user.password?.length || 8)}</span>
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => abrirModalEditar(user)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2.5 px-3 rounded-lg transition shadow-md hover:shadow-lg"
        >
          ✏️ Editar
        </button>
        <button
          onClick={() => handleEliminar(user.id, user.nombre)}
          className={`flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 px-3 rounded-lg transition shadow-md hover:shadow-lg`}
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );

  if (vistaActual === 'menu') {
    return (
      <>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">👥 Gestión de Usuarios</h1>
            <p className="text-gray-500 text-sm">Administra usuarios por rol</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <button onClick={() => setVistaActual('admin')} className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 h-72 flex flex-col items-center justify-center">
              <div className="text-7xl mb-4">👑</div>
              <h2 className="text-2xl font-bold mb-2">Administradores</h2>
              <p className="text-red-100 text-sm mb-2">Control total del sistema</p>
              <div className="mt-4 bg-red-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{admins.length}</span>
                <span className="text-sm ml-2">usuario{admins.length !== 1 ? 's' : ''}</span>
              </div>
            </button>

            <button onClick={() => setVistaActual('tecnico')} className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 h-72 flex flex-col items-center justify-center">
              <div className="text-7xl mb-4">🔧</div>
              <h2 className="text-2xl font-bold mb-2">Técnicos</h2>
              <p className="text-blue-100 text-sm mb-2">Personal de campo</p>
              <div className="mt-4 bg-blue-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{tecnicos.length}</span>
                <span className="text-sm ml-2">técnico{tecnicos.length !== 1 ? 's' : ''}</span>
              </div>
            </button>

            <button onClick={() => setVistaActual('distribuidor')} className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 h-72 flex flex-col items-center justify-center">
              <div className="text-7xl mb-4">📦</div>
              <h2 className="text-2xl font-bold mb-2">Distribuidores</h2>
              <p className="text-purple-100 text-sm mb-2">Gestión de inventario</p>
              <div className="mt-4 bg-purple-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{distribuidores.length}</span>
                <span className="text-sm ml-2">distribuidor{distribuidores.length !== 1 ? 'es' : ''}</span>
              </div>
            </button>

            <button onClick={() => setVistaActual('cliente')} className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 h-72 flex flex-col items-center justify-center">
              <div className="text-7xl mb-4">👤</div>
              <h2 className="text-2xl font-bold mb-2">Clientes</h2>
              <p className="text-green-100 text-sm mb-2">Base de clientes</p>
              <div className="mt-4 bg-green-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{clientes.length}</span>
                <span className="text-sm ml-2">cliente{clientes.length !== 1 ? 's' : ''}</span>
              </div>
            </button>
          </div>
        </div>

        {modalAbierto && <ModalUsuario />}
      </>
    );
  }

  if (vistaActual === 'admin') {
    return (
      <>
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold">« Volver</button>
          <div className="mb-8 flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-800">👑 Administradores</h1><p className="text-gray-500 text-sm">{admins.length} usuarios</p></div>
            <button onClick={() => abrirModal('admin')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold">+ Crear Admin</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{admins.map(user => renderTarjetaUsuario(user, 'red'))}</div>
        </div>

        {modalAbierto && <ModalUsuario />}
      </>
    );
  }

  if (vistaActual === 'tecnico') {
    return (
      <>
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold">« Volver</button>
          <div className="mb-8 flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-800">🔧 Técnicos</h1><p className="text-gray-500 text-sm">{tecnicos.length} usuarios</p></div>
            <button onClick={() => abrirModal('tecnico')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">+ Crear Técnico</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{tecnicos.map(user => renderTarjetaUsuario(user, 'blue'))}</div>
        </div>

        {modalAbierto && <ModalUsuario />}
      </>
    );
  }

  if (vistaActual === 'distribuidor') {
    return (
      <>
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold">« Volver</button>
          <div className="mb-8 flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-800">📦 Distribuidores</h1><p className="text-gray-500 text-sm">{distribuidores.length} usuarios</p></div>
            <button onClick={() => abrirModal('distribuidor')} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold">+ Crear Distribuidor</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{distribuidores.map(user => renderTarjetaUsuario(user, 'purple'))}</div>
        </div>

        {modalAbierto && <ModalUsuario />}
      </>
    );
  }

  if (vistaActual === 'cliente') {
    return (
      <>
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold">« Volver</button>
          <div className="mb-8 flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-800">👤 Clientes</h1><p className="text-gray-500 text-sm">{clientes.length} usuarios</p></div>
            <button onClick={() => abrirModal('cliente')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">+ Crear Cliente</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{clientes.map(user => renderTarjetaUsuario(user, 'green'))}</div>
        </div>

        {modalAbierto && <ModalUsuario />}
      </>
    );
  }

  return null;
}

export default Usuarios;
