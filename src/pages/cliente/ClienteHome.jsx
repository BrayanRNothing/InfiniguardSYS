import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import CotizacionForm from '../../components/forms/CotizacionForm.jsx';
import TabButton from '../../components/ui/TabButton';
import TarjetaAccion from '../../components/ui/TarjetaAccion';
import API_URL from '../../config/api';

const ClienteHome = () => {
  const [activeTab, setActiveTab] = useState('inicio');
  const [tipoServicio, setTipoServicio] = useState('');
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const userGuardado = JSON.parse(sessionStorage.getItem('user'));
    setUsuario(userGuardado);
    if (userGuardado) cargarSolicitudes(userGuardado);

    const interval = setInterval(() => {
      if (userGuardado) cargarSolicitudes(userGuardado);
    }, 10000);

    const handleTabChange = (e) => {
      if (e.detail === 'home') setActiveTab('inicio');
      // Solicitud genérica desde el footer
      if (e.detail === 'solicitar') {
        setTipoServicio(''); // Resetear para que muestre el selector
        setActiveTab('solicitar');
      }
    };

    window.addEventListener('changeClienteTab', handleTabChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('changeClienteTab', handleTabChange);
    };
  }, []);

  const cargarSolicitudes = async (user) => {
    try {
      const res = await fetch(`${API_URL}/api/servicios`);
      const data = await res.json();
      // Filtrar solo las de este usuario
      const misData = data.filter(s => s.usuario === user?.nombre || s.cliente === user?.nombre);
      setMisSolicitudes(misData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRespuestaCliente = async (id, respuesta) => {
    try {
      const res = await fetch(`${API_URL}/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estadoCliente: respuesta,
          estado: respuesta === 'aprobado' ? 'aprobado' : 'rechazado'
        })
      });
      if (res.ok) {
        toast.success(`Cotización ${respuesta}`);
        cargarSolicitudes(usuario);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const irACotizar = (tipo) => {
    setTipoServicio(tipo);
    setActiveTab('solicitar');
  };

  // Filtros
  const pendientes = misSolicitudes.filter(s => s.estado === 'pendiente');
  const cotizadas = misSolicitudes.filter(s => s.estado === 'cotizado');
  const aprobadas = misSolicitudes.filter(s => s.estado === 'aprobado' || s.estadoCliente === 'aprobado');
  const enProceso = misSolicitudes.filter(s => s.estado === 'en-proceso');
  const finalizadas = misSolicitudes.filter(s => s.estado === 'finalizado');
  const rechazadas = misSolicitudes.filter(s => s.estado === 'rechazado');

  // --- RENDERS ---
  const renderHome = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold">Hola, {usuario?.nombre || 'Cliente'} 👋</h1>
        <p>¿Qué necesitas hoy?</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TarjetaAccion icono="🛠️" titulo="Servicio Técnico" onClick={() => irACotizar('Servicio Técnico')} color="blue" />
        <TarjetaAccion icono="📦" titulo="Material" onClick={() => irACotizar('Material')} color="orange" />
        <TarjetaAccion icono="🛡️" titulo="Garantía" onClick={() => irACotizar('Garantía')} color="purple" />
      </div>
    </div>
  );

  const renderListado = (lista, titulo, color) => (
    <div className="space-y-4">
      <h3 className={`text-xl font-bold text-${color}-800 mb-4`}>{titulo}</h3>
      {lista.length === 0 ? <div className="text-gray-500 text-center py-8">No hay solicitudes aquí.</div> : (
        lista.map(sol => (
          <div key={sol.id} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4 shadow-sm`}>
            <div className="flex justify-between">
              <h3 className={`font-bold text-lg text-${color}-900`}>{sol.titulo}</h3>
              <span className={`px-2 py-1 text-xs bg-${color}-200 text-${color}-800 rounded`}>{sol.estado}</span>
            </div>
            <p className="text-sm text-gray-700 mt-2">{sol.descripcion}</p>

            {/* Botones para cotizadas */}
            {activeTab === 'cotizadas' && sol.precioEstimado && (
              <div className="mt-4 bg-white p-3 rounded border">
                <p className="font-bold text-lg text-green-700">${sol.precioEstimado}</p>
                <p className="text-xs text-gray-500 mb-2">{sol.respuestaCotizacion}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleRespuestaCliente(sol.id, 'aprobado')} className="flex-1 bg-green-500 text-white py-1 rounded text-sm">Aceptar</button>
                  <button onClick={() => handleRespuestaCliente(sol.id, 'rechazado')} className="flex-1 bg-red-500 text-white py-1 rounded text-sm">Rechazar</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* NAVBAR TABS */}
      <div className="flex flex-wrap gap-2 bg-gray-100 p-2 rounded-xl">
        <TabButton active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')}>🏠 Inicio</TabButton>
        <TabButton active={activeTab === 'pendientes'} onClick={() => setActiveTab('pendientes')} count={pendientes.length}>⏳ Pendientes</TabButton>
        <TabButton active={activeTab === 'cotizadas'} onClick={() => setActiveTab('cotizadas')} count={cotizadas.length}>💬 Cotizadas</TabButton>
        <TabButton active={activeTab === 'aprobadas'} onClick={() => setActiveTab('aprobadas')} count={aprobadas.length}>✅ Aprobadas</TabButton>
        <TabButton active={activeTab === 'en-proceso'} onClick={() => setActiveTab('en-proceso')} count={enProceso.length}>🔧 En Proceso</TabButton>
        <TabButton active={activeTab === 'finalizadas'} onClick={() => setActiveTab('finalizadas')} count={finalizadas.length}>🏁 Historial</TabButton>
        <TabButton active={activeTab === 'rechazadas'} onClick={() => setActiveTab('rechazadas')} count={rechazadas.length}>❌ Rechazadas</TabButton>
      </div>

      {activeTab === 'inicio' && renderHome()}
      {activeTab === 'solicitar' && (
        <div>
          <button onClick={() => setActiveTab('inicio')} className="mb-4 text-blue-600 font-medium">← Volver al inicio</button>

          {!tipoServicio ? (
            <div className="animate-fadeIn">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Nueva Solicitud</h2>
                <p className="text-gray-500">Selecciona el tipo de servicio que deseas cotizar</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TarjetaAccion icono="🛠️" titulo="Servicio Técnico" onClick={() => setTipoServicio('Servicio Técnico')} color="blue" />
                <TarjetaAccion icono="📦" titulo="Material" onClick={() => setTipoServicio('Material')} color="orange" />
                <TarjetaAccion icono="🛡️" titulo="Garantía" onClick={() => setTipoServicio('Garantía')} color="purple" />
              </div>
            </div>
          ) : (
            <div>
              <button onClick={() => setTipoServicio('')} className="mb-4 text-gray-500 hover:text-blue-600 text-sm flex items-center gap-1">
                <span>↑</span> Cambiar tipo de servicio
              </button>
              <CotizacionForm titulo={`Solicitud de ${tipoServicio}`} tipoServicio={tipoServicio} onSuccess={() => setActiveTab('pendientes')} />
            </div>
          )}
        </div>
      )}
      {activeTab === 'pendientes' && renderListado(pendientes, 'Solicitudes Pendientes', 'orange')}
      {activeTab === 'cotizadas' && renderListado(cotizadas, 'Cotizaciones Recibidas', 'blue')}
      {activeTab === 'aprobadas' && renderListado(aprobadas, 'Solicitudes Aprobadas', 'green')}
      {activeTab === 'en-proceso' && renderListado(enProceso, 'Servicios en Proceso', 'purple')}
      {activeTab === 'finalizadas' && renderListado(finalizadas, 'Historial Finalizado', 'gray')}
      {activeTab === 'rechazadas' && renderListado(rechazadas, 'Solicitudes Rechazadas', 'red')}
    </div>
  );
};

export default ClienteHome;