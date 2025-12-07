import React, { useState, useEffect } from 'react';

const DistribuidorHome = () => {
  const [activeTab, setActiveTab] = useState('pendientes'); // pendientes | cotizadas | aprobadas
  const [cotizaciones, setCotizaciones] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'recubrimiento',
    cliente: '',
    telefono: '',
    direccion: '',
    notas: '',
    cantidad: 1
  });

  useEffect(() => {
    const userGuardado = JSON.parse(localStorage.getItem('user'));
    setUsuario(userGuardado);
    cargarCotizaciones(userGuardado);

    // Escuchar eventos de cambio de tab desde el layout
    const handleTabChange = (event) => {
      const tab = event.detail;
      if (tab === 'inicio') setActiveTab('pendientes');
      else if (tab === 'recubrimiento') setActiveTab('recubrimiento-form');
      else if (tab === 'garantia') setActiveTab('garantia-form');
    };
    window.addEventListener('changeDistribuidorTab', handleTabChange);

    return () => {
      window.removeEventListener('changeDistribuidorTab', handleTabChange);
    };
  }, []);

  const cargarCotizaciones = async (user) => {
    try {
      const res = await fetch('http://localhost:4000/api/servicios');
      const data = await res.json();
      // Filtrar solo las cotizaciones creadas por este distribuidor
      const misCotizaciones = data.filter(s => s.usuario === user?.nombre);
      setCotizaciones(misCotizaciones);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.cliente || !formData.telefono) {
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
          usuario: usuario?.nombre,
          cliente: formData.cliente,
          estado: 'pendiente'
        })
      });

      if (res.ok) {
        alert('✅ Cotización enviada correctamente');
        setFormData({ titulo: '', tipo: 'recubrimiento', cliente: '', telefono: '', direccion: '', notas: '', cantidad: 1 });
        cargarCotizaciones(usuario);
        setActiveTab('pendientes');
      }
    } catch (error) {
      console.error(error);
      alert('Error al enviar cotización');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar cotizaciones
  const pendientes = cotizaciones.filter(c => c.estado === 'pendiente');
  const cotizadas = cotizaciones.filter(c => c.estado === 'cotizado');
  const aprobadas = cotizaciones.filter(c => c.estadoCliente === 'aprobado' || c.estado === 'aprobado-cliente');

  const renderPendientes = () => (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">⏳</span> Cotizaciones Pendientes
      </h3>
      {pendientes.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No hay cotizaciones pendientes</div>
      ) : (
        <div className="space-y-4">
          {pendientes.map(cot => (
            <div key={cot.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-orange-900">{cot.titulo}</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-200 text-orange-800">
                  PENDIENTE
                </span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Tipo:</strong> {cot.tipo}</p>
                <p><strong>Cliente:</strong> {cot.cliente}</p>
                <p><strong>Teléfono:</strong> {cot.telefono}</p>
                <p><strong>Dirección:</strong> {cot.direccion}</p>
                {cot.notas && <p><strong>Notas:</strong> {cot.notas}</p>}
                <p><strong>Cantidad:</strong> {cot.cantidad}</p>
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
        <span className="text-2xl">💬</span> Cotizaciones Respondidas
      </h3>
      {cotizadas.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No hay cotizaciones respondidas</div>
      ) : (
        <div className="space-y-4">
          {cotizadas.map(cot => (
            <div key={cot.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-blue-900">{cot.titulo}</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-200 text-blue-800">
                  COTIZADO
                </span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Cliente:</strong> {cot.cliente}</p>
                {(cot.respuestaAdmin || cot.respuestaCotizacion) && (
                  <div className="bg-white border border-blue-300 rounded p-3 mt-2">
                    <p className="text-sm font-semibold text-blue-800 mb-1">💬 Respuesta Admin:</p>
                    <p className="text-sm text-blue-900">{cot.respuestaAdmin || cot.respuestaCotizacion}</p>
                    {(cot.precio || cot.precioEstimado) && (
                      <p className="text-sm font-bold text-blue-900 mt-1">Precio: ${cot.precio || cot.precioEstimado}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAprobadas = () => (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">✅</span> Cotizaciones Aprobadas
      </h3>
      {aprobadas.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No hay cotizaciones aprobadas</div>
      ) : (
        <div className="space-y-4">
          {aprobadas.map(cot => (
            <div key={cot.id} className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-green-900">{cot.titulo}</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800">
                  APROBADA
                </span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Cliente:</strong> {cot.cliente}</p>
                {(cot.precio || cot.precioEstimado) && <p><strong>Precio:</strong> ${cot.precio || cot.precioEstimado}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFormRecubrimiento = () => (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🎨 Cotizar Recubrimiento</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Título de la Cotización *</label>
          <input type="text" value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value, tipo: 'recubrimiento'})} placeholder="Ej: Recubrimiento Industrial" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Cliente *</label>
          <input type="text" value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} placeholder="Nombre completo" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono *</label>
          <input type="tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} placeholder="10 dígitos" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
          <input type="text" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} placeholder="Dirección completa" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad (m²)</label>
          <input type="number" value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: e.target.value})} min="1" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notas Adicionales</label>
          <textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} placeholder="Detalles del proyecto..." rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg transition disabled:opacity-50">
          {loading ? 'Enviando...' : '📤 Enviar Cotización'}
        </button>
      </div>
    </form>
  );

  const renderFormGarantia = () => (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🛡️ Cotizar Garantía Extendida</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Título de la Cotización *</label>
          <input type="text" value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value, tipo: 'garantia'})} placeholder="Ej: Garantía Extendida 3 años" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Cliente *</label>
          <input type="text" value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} placeholder="Nombre completo" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono *</label>
          <input type="tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} placeholder="10 dígitos" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
          <input type="text" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} placeholder="Dirección completa" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notas Adicionales</label>
          <textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} placeholder="Detalles de la garantía..." rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg transition disabled:opacity-50">
          {loading ? 'Enviando...' : '📤 Enviar Cotización'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hola, {usuario?.nombre || 'Distribuidor'} 👋</h1>
        <p className="text-gray-500 text-sm">Panel de Cotizaciones</p>
      </div>

      {/* --- MENU DE PESTAÑAS (TABS) --- */}
      {(activeTab !== 'recubrimiento-form' && activeTab !== 'garantia-form') && (
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
        </div>
      )}

      {/* --- CONTENIDO DINÁMICO --- */}
      <div className="space-y-4">
        {activeTab === 'pendientes' && renderPendientes()}
        {activeTab === 'cotizadas' && renderCotizadas()}
        {activeTab === 'aprobadas' && renderAprobadas()}
        {activeTab === 'recubrimiento-form' && renderFormRecubrimiento()}
        {activeTab === 'garantia-form' && renderFormGarantia()}
      </div>
    </div>
  );
};

export default DistribuidorHome;
