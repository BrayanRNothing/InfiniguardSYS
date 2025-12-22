import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import CotizacionForms2 from '../../components/forms/CotizacionForms2.jsx';
import NuevaSolicitud from '../tecnico/NuevaSolicitud.jsx';

const ClienteHome = () => {
  const [activeTab, setActiveTab] = useState('pendientes'); // pendientes | cotizadas | aprobadas | rechazadas | home | solicitar
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: '',
    cantidad: 1,
    descripcion: '',
    direccion: '',
    telefono: '',
    foto: null,
    pdf: null
  });

  useEffect(() => {
    const userGuardado = JSON.parse(sessionStorage.getItem('user'));
    setUsuario(userGuardado);
    cargarSolicitudes(userGuardado);

    // Escuchar eventos de cambio de tab desde el layout
    const handleTabChange = (event) => {
      setActiveTab(event.detail);
    };
    window.addEventListener('changeClienteTab', handleTabChange);

    // Auto-refresh cada 10 segundos
    const interval = setInterval(() => {
      cargarSolicitudes(userGuardado);
    }, 10000);

    return () => {
      window.removeEventListener('changeClienteTab', handleTabChange);
      clearInterval(interval);
    };
  }, []);

  const cargarSolicitudes = async (user) => {
    try {
      const res = await fetch('https://infiniguardsys-production.up.railway.app/api/servicios');
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
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://infiniguardsys-production.up.railway.app/api/servicios', {
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
        toast.success('✅ Solicitud enviada correctamente');
        setFormData({ titulo: '', tipo: '', modelo: '', direccion: '', telefono: '', notas: '', foto: null });
        cargarSolicitudes(usuario);
        setActiveTab('pendientes');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleRespuestaCliente = async (id, respuesta) => {
    try {
      const res = await fetch(`https://infiniguardsys-production.up.railway.app/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estadoCliente: respuesta,
          estado: respuesta === 'aprobado' ? 'aprobado-cliente' : 'rechazado-cliente'
        })
      });

      if (res.ok) {
        const mensaje = respuesta === 'aprobado' ? '✅ Cotización aprobada' : respuesta === 'rechazado' ? '❌ Cotización rechazada' : '📞 Marcada para contacto';
        toast.success(mensaje);
        cargarSolicitudes(usuario);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Filtrar solicitudes
  const pendientes = misSolicitudes.filter(s => s.estado === 'pendiente');
  const cotizadas = misSolicitudes.filter(s => s.estado === 'cotizado');
  const enProceso = misSolicitudes.filter(s => s.estado === 'en-proceso');
  const aprobadas = misSolicitudes.filter(s => s.estadoCliente === 'aprobado' || s.estado === 'aprobado-cliente');
  const rechazadas = misSolicitudes.filter(s => s.estadoCliente === 'rechazado' || s.estado === 'rechazado-cliente');
  const finalizadas = misSolicitudes.filter(s => s.estado === 'finalizado');

  // Vista HOME 
  const renderHome = () => (
    <div className="space-y-6">
  {/* en construccion */}
      
    </div>
  );

  // Vista SOLICITAR COTIZACIÓN
  const renderSolicitar = () => (
    <div className="bg-white rounded-xl p-0 max-w-3xl mx-auto">
      <CotizacionForms2 onSuccess={() => setActiveTab('home')} />
    </div>
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

  const renderEnProceso = () => (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🔧</span> Servicios en Proceso
      </h3>
      {enProceso.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No hay servicios en proceso</div>
      ) : (
        <div className="space-y-4">
          {enProceso.map(sol => (
            <div key={sol.id} className="bg-purple-50 border-2 border-purple-300 rounded-lg p-5 shadow-md">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-purple-900">{sol.titulo}</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-200 text-purple-800 animate-pulse">
                  EN PROCESO
                </span>
              </div>
              
              {/* Información del técnico asignado */}
              {sol.tecnico && (
                <div className="bg-white rounded-lg p-4 mb-3 border border-purple-200">
                  <p className="text-sm font-bold text-purple-800 mb-2">👨‍🔧 Técnico Asignado:</p>
                  <p className="text-base font-semibold text-gray-800">{sol.tecnico}</p>
                </div>
              )}
              
              {/* Fecha y hora programada */}
              {(sol.fechaServicio || sol.horaServicio) && (
                <div className="bg-blue-50 rounded-lg p-4 mb-3 border border-blue-200">
                  <p className="text-sm font-bold text-blue-800 mb-2">📅 Servicio Programado:</p>
                  {sol.fechaServicio && <p className="text-base text-gray-800"><strong>Fecha:</strong> {sol.fechaServicio}</p>}
                  {sol.horaServicio && <p className="text-base text-gray-800"><strong>Hora:</strong> {sol.horaServicio}</p>}
                </div>
              )}
              
              {/* Detalles del servicio */}
              <div className="text-sm text-gray-700 space-y-1 mt-3">
                <p><strong>Tipo:</strong> {sol.tipo}</p>
                {sol.precio && <p><strong>Precio:</strong> ${sol.precio}</p>}
                <p><strong>Dirección:</strong> {sol.direccion}</p>
                <p><strong>Teléfono:</strong> {sol.telefono}</p>
                {sol.notas && <p><strong>Notas:</strong> {sol.notas}</p>}
              </div>
              
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                <p className="text-xs text-green-700 text-center">
                  ℹ️ El técnico llegará en la fecha y hora indicada
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFinalizadas = () => (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">✅</span> Servicios Finalizados
      </h3>
      {finalizadas.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No hay servicios finalizados</div>
      ) : (
        <div className="space-y-4">
          {finalizadas.map(sol => (
            <div key={sol.id} className="bg-gray-50 border border-gray-300 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900">{sol.titulo}</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-300 text-gray-800">
                  FINALIZADO
                </span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Tipo:</strong> {sol.tipo}</p>
                {sol.tecnico && <p><strong>Técnico:</strong> {sol.tecnico}</p>}
                {sol.precio && <p><strong>Precio:</strong> ${sol.precio}</p>}
                <p><strong>Fecha:</strong> {sol.fecha}</p>
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
      <div className="grid grid-cols-3 gap-1 p-0.5 bg-gray-100 rounded-lg mb-4 border border-gray-200">
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`relative py-1 px-0.5 rounded-md font-semibold transition text-[11px] sm:text-xs md:text-[11px] lg:text-xs ${activeTab === 'pendientes' ? 'bg-white text-orange-600' : 'text-gray-500 hover:bg-orange-50'}`}
          >
            Pendientes
            {pendientes && pendientes.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[10px] px-1.5 rounded-full font-bold min-w-[18px] text-center">
                {pendientes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('cotizadas')}
            className={`relative py-1 px-0.5 rounded-md font-semibold transition text-[11px] sm:text-xs md:text-[11px] lg:text-xs ${activeTab === 'cotizadas' ? 'bg-white text-blue-600' : 'text-gray-500 hover:bg-blue-50'}`}
          >
            Cotizadas
            {cotizadas && cotizadas.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[10px] px-1.5 rounded-full font-bold min-w-[18px] text-center">
                {cotizadas.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('aprobadas')}
            className={`py-1 px-0.5 rounded-md font-semibold transition text-[11px] sm:text-xs md:text-[11px] lg:text-xs ${activeTab === 'aprobadas' ? 'bg-white text-green-600' : 'text-gray-500 hover:bg-green-50'}`}
          >
            Aprobadas
          </button>
          <button
            onClick={() => setActiveTab('en-proceso')}
            className={`relative py-1 px-0.5 rounded-md font-semibold transition text-[11px] sm:text-xs md:text-[11px] lg:text-xs ${activeTab === 'en-proceso' ? 'bg-white text-purple-600' : 'text-gray-500 hover:bg-purple-50'}`}
          >
            En Proceso
            {enProceso && enProceso.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-purple-500 text-white text-[10px] px-1.5 rounded-full font-bold min-w-[18px] text-center">
                {enProceso.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('finalizadas')}
            className={`py-1 px-0.5 rounded-md font-semibold transition text-[11px] sm:text-xs md:text-[11px] lg:text-xs ${activeTab === 'finalizadas' ? 'bg-white text-gray-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Finalizadas
          </button>
          <button
            onClick={() => setActiveTab('rechazadas')}
            className={`py-1 px-0.5 rounded-md font-semibold transition text-[11px] sm:text-xs md:text-[11px] lg:text-xs ${activeTab === 'rechazadas' ? 'bg-white text-red-600' : 'text-gray-500 hover:bg-red-50'}`}
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
        {activeTab === 'en-proceso' && renderEnProceso()}
        {activeTab === 'aprobadas' && renderAprobadas()}
        {activeTab === 'finalizadas' && renderFinalizadas()}
        {activeTab === 'rechazadas' && renderRechazadas()}
      </div>
    </div>
  );
};export default ClienteHome;
