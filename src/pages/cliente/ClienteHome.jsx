import React, { useState, useEffect } from 'react';

const ClienteHome = () => {
  const [activeTab, setActiveTab] = useState('pendientes'); // pendientes | cotizadas | aprobadas | rechazadas | home | solicitar
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'equipo',
    modelo: '',
    direccion: '',
    telefono: '',
    notas: '',
    foto: null
  });

  useEffect(() => {
    const userGuardado = JSON.parse(localStorage.getItem('user'));
    setUsuario(userGuardado);
    cargarSolicitudes(userGuardado);

    // Escuchar eventos de cambio de tab desde el layout
    const handleTabChange = (event) => {
      setActiveTab(event.detail);
    };
    window.addEventListener('changeClienteTab', handleTabChange);

    return () => {
      window.removeEventListener('changeClienteTab', handleTabChange);
    };
  }, []);

  const cargarSolicitudes = async (user) => {
    try {
      const res = await fetch('http://localhost:4000/api/servicios');
      const data = await res.json();
      const misData = data.filter(s => s.cliente === user?.nombre || s.usuario === user?.nombre);
      setMisSolicitudes(misData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, foto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.telefono) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cliente: usuario?.nombre,
          usuario: usuario?.nombre,
          estado: 'pendiente'
        })
      });

      if (res.ok) {
        alert('✅ Solicitud enviada correctamente');
        setFormData({ titulo: '', tipo: 'equipo', modelo: '', direccion: '', telefono: '', notas: '', foto: null });
        cargarSolicitudes(usuario);
        setActiveTab('pendientes');
      }
    } catch (error) {
      console.error(error);
      alert('Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleRespuestaCliente = async (id, respuesta) => {
    try {
      const res = await fetch(`http://localhost:4000/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estadoCliente: respuesta,
          estado: respuesta === 'aprobado' ? 'aprobado-cliente' : 'rechazado-cliente'
        })
      });

      if (res.ok) {
        alert(`Cotización ${respuesta === 'aprobado' ? 'aprobada' : respuesta === 'rechazado' ? 'rechazada' : 'marcada para contacto'}`);
        cargarSolicitudes(usuario);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Filtrar solicitudes
  const pendientes = misSolicitudes.filter(s => s.estado === 'pendiente');
  const cotizadas = misSolicitudes.filter(s => s.estado === 'cotizado');
  const aprobadas = misSolicitudes.filter(s => s.estadoCliente === 'aprobado' || s.estado === 'aprobado-cliente');
  const rechazadas = misSolicitudes.filter(s => s.estadoCliente === 'rechazado' || s.estado === 'rechazado-cliente');

  // Vista HOME
  const renderHome = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">👋 Bienvenido</h2>
        <p className="text-blue-100">Gestiona tus solicitudes de servicio</p>
      </div>

      {/* Resumen rápido */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Resumen</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600">{pendientes.length}</div>
            <div className="text-sm text-gray-600 mt-1">Pendientes</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{cotizadas.length}</div>
            <div className="text-sm text-gray-600 mt-1">Cotizadas</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{aprobadas.length}</div>
            <div className="text-sm text-gray-600 mt-1">Aprobadas</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{rechazadas.length}</div>
            <div className="text-sm text-gray-600 mt-1">Rechazadas</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSolicitar = () => (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 border border-gray-200 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Solicitar Cotización</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Servicio *</label>
          <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="equipo">🔧 Equipo Industrial</option>
            <option value="recubrimiento">🎨 Aplicación de Recubrimiento</option>
            <option value="instalacion">⚙️ Instalación</option>
            <option value="mantenimiento">🛠️ Mantenimiento</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Título de la Solicitud *</label>
          <input type="text" value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} placeholder="Ej: Recubrimiento para Tanque Industrial" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Modelo o Especificaciones</label>
          <input type="text" value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})} placeholder="Ej: Modelo X500" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección del Servicio</label>
          <input type="text" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} placeholder="Calle, colonia, ciudad" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono de Contacto *</label>
          <input type="tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} placeholder="10 dígitos" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">📷 Adjuntar Foto (Opcional)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          {formData.foto && <img src={formData.foto} alt="Preview" className="mt-3 max-w-xs rounded-lg border" />}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notas Adicionales</label>
          <textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} placeholder="Detalles adicionales..." rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg transition disabled:opacity-50">
          {loading ? 'Enviando...' : '📤 Enviar Solicitud'}
        </button>
      </div>
    </form>
  );

  const renderPendientes = () => (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">⏳</span> Solicitudes Pendientes
      </h3>
      {pendientes.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No hay solicitudes pendientes</div>
      ) : (
        <div className="space-y-4">
          {pendientes.map(sol => (
            <div key={sol.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-orange-900">{sol.titulo}</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-200 text-orange-800">
                  PENDIENTE
                </span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Tipo:</strong> {sol.tipo}</p>
                {sol.modelo && <p><strong>Modelo:</strong> {sol.modelo}</p>}
                <p><strong>Dirección:</strong> {sol.direccion}</p>
                <p><strong>Teléfono:</strong> {sol.telefono}</p>
                {sol.notas && <p><strong>Notas:</strong> {sol.notas}</p>}
                {sol.foto && <img src={sol.foto} alt="Foto" className="w-full max-w-xs rounded mt-2" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCotizadas = () => (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">💬</span> Cotizaciones Recibidas
      </h3>
      {cotizadas.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No hay cotizaciones disponibles</div>
      ) : (
        <div className="space-y-4">
          {cotizadas.map(sol => (
            <div key={sol.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-blue-900">{sol.titulo}</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-200 text-blue-800">
                  COTIZADO
                </span>
              </div>
              <div className="text-sm text-gray-700 space-y-1 mb-3">
                <p><strong>Tipo:</strong> {sol.tipo}</p>
                {sol.modelo && <p><strong>Modelo:</strong> {sol.modelo}</p>}
                <p><strong>Dirección:</strong> {sol.direccion}</p>
                <p><strong>Teléfono:</strong> {sol.telefono}</p>
              </div>
              {!sol.estadoCliente && (sol.respuestaAdmin || sol.respuestaCotizacion) && (
                <div className="bg-white border border-blue-300 rounded p-3">
                  <p className="text-sm font-semibold text-blue-800 mb-1">💬 Respuesta del Admin:</p>
                  <p className="text-sm text-blue-900 mb-1">{sol.respuestaAdmin || sol.respuestaCotizacion}</p>
                  {(sol.precio || sol.precioEstimado) && <p className="text-sm font-bold text-blue-900 mb-3">Precio: ${sol.precio || sol.precioEstimado}</p>}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleRespuestaCliente(sol.id, 'aprobado')}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700 text-sm font-semibold"
                    >
                      ✅ Aprobar
                    </button>
                    <button
                      onClick={() => handleRespuestaCliente(sol.id, 'rechazado')}
                      className="flex-1 bg-red-600 text-white py-2 px-3 rounded hover:bg-red-700 text-sm font-semibold"
                    >
                      ❌ Rechazar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAprobadas = () => (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">✅</span> Solicitudes Aprobadas
      </h3>
      {aprobadas.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No hay solicitudes aprobadas</div>
      ) : (
        <div className="space-y-4">
          {aprobadas.map(sol => (
            <div key={sol.id} className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-green-900">{sol.titulo}</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800">
                  APROBADA
                </span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Tipo:</strong> {sol.tipo}</p>
                {(sol.precio || sol.precioEstimado) && <p><strong>Precio:</strong> ${sol.precio || sol.precioEstimado}</p>}
                <p><strong>Dirección:</strong> {sol.direccion}</p>
                <p><strong>Teléfono:</strong> {sol.telefono}</p>
                {(sol.respuestaAdmin || sol.respuestaCotizacion) && <p><strong>Nota Admin:</strong> {sol.respuestaAdmin || sol.respuestaCotizacion}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRechazadas = () => (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">❌</span> Solicitudes Rechazadas
      </h3>
      {rechazadas.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No hay solicitudes rechazadas</div>
      ) : (
        <div className="space-y-4">
          {rechazadas.map(sol => (
            <div key={sol.id} className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-red-900">{sol.titulo}</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800">
                  RECHAZADA
                </span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Tipo:</strong> {sol.tipo}</p>
                <p><strong>Dirección:</strong> {sol.direccion}</p>
                {(sol.respuestaAdmin || sol.respuestaCotizacion) && <p><strong>Motivo:</strong> {sol.respuestaAdmin || sol.respuestaCotizacion}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hola, {usuario?.nombre || 'Cliente'} 👋</h1>
        <p className="text-gray-500 text-sm">Panel de Solicitudes</p>
      </div>

      {/* --- MENU DE PESTAÑAS (TABS) --- */}
      <div className="flex p-1 bg-gray-200 rounded-xl mb-6">
        <button 
          onClick={() => setActiveTab('pendientes')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'pendientes' ? 'bg-white text-orange-600 shadow' : 'text-gray-500'}`}
        >
          Pendientes
        </button>
        <button 
          onClick={() => setActiveTab('cotizadas')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'cotizadas' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}
        >
          Cotizadas
        </button>
        <button 
          onClick={() => setActiveTab('aprobadas')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'aprobadas' ? 'bg-white text-green-600 shadow' : 'text-gray-500'}`}
        >
          Aprobadas
        </button>
        <button 
          onClick={() => setActiveTab('rechazadas')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'rechazadas' ? 'bg-white text-red-600 shadow' : 'text-gray-500'}`}
        >
          Rechazadas
        </button>
      </div>

      {/* --- CONTENIDO DINÁMICO --- */}
      <div className="space-y-4">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'solicitar' && renderSolicitar()}
        {activeTab === 'pendientes' && renderPendientes()}
        {activeTab === 'cotizadas' && renderCotizadas()}
        {activeTab === 'aprobadas' && renderAprobadas()}
        {activeTab === 'rechazadas' && renderRechazadas()}
      </div>
    </div>
  );
};export default ClienteHome;
