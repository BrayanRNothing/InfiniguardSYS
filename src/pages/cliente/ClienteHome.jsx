import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import CotizacionForm from '../../components/forms/CotizacionForm.jsx';
import ClienteCotizacionDetalle from '../../components/cliente/ClienteCotizacionDetalle.jsx';
import Avatar from '../../components/ui/Avatar';
import API_URL from '../../config/api';

const ClienteHome = () => {
  const [activeView, setActiveView] = useState('home'); // home, crear, ajustes
  const [activeStatusTab, setActiveStatusTab] = useState('pendientes'); // pendientes, en-proceso, terminadas
  const [tipoServicio, setTipoServicio] = useState('');
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [showAllPendientes, setShowAllPendientes] = useState(false);
  const [showAllEnProceso, setShowAllEnProceso] = useState(false);
  const [showAllTerminadas, setShowAllTerminadas] = useState(false);

  useEffect(() => {
    const userGuardado = JSON.parse(sessionStorage.getItem('user'));
    setUsuario(userGuardado);
    if (userGuardado) cargarSolicitudes(userGuardado);

    const interval = setInterval(() => {
      if (userGuardado) cargarSolicitudes(userGuardado);
    }, 10000);

    const handleTabChange = (e) => {
      if (e.detail === 'home') setActiveView('home');
      if (e.detail === 'solicitar') {
        setTipoServicio('');
        setActiveView('crear');
      }
      if (e.detail === 'ajustes') setActiveView('ajustes');
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
      const misData = data.filter(s => s.usuario === user?.nombre || s.cliente === user?.nombre);
      setMisSolicitudes(misData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const irACotizar = (tipo) => {
    setTipoServicio(tipo);
    setActiveView('crear');
  };

  // Filtros de estado
  const pendientes = misSolicitudes.filter(s => s.estado === 'pendiente' || s.estado === 'cotizado');
  const enProceso = misSolicitudes.filter(s => s.estado === 'aprobado' || s.estado === 'en-proceso');
  const terminadas = misSolicitudes.filter(s => s.estado === 'finalizado');

  // Mapeo de estados a badges
  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': { text: 'Pendiente', color: 'bg-orange-100 text-orange-700' },
      'cotizado': { text: 'Cotizado', color: 'bg-blue-100 text-blue-700' },
      'aprobado': { text: 'Aprobado', color: 'bg-green-100 text-green-700' },
      'en-proceso': { text: 'En Proceso', color: 'bg-purple-100 text-purple-700' },
      'finalizado': { text: 'Finalizado', color: 'bg-gray-100 text-gray-700' },
      'rechazado': { text: 'Rechazado', color: 'bg-red-100 text-red-700' }
    };
    return badges[estado] || { text: estado, color: 'bg-gray-100 text-gray-700' };
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
  };

  // Render de tarjeta de cotización en mosaico
  const CotizacionCard = ({ cotizacion }) => {
    const badge = getEstadoBadge(cotizacion.estado);
    const tieneAsignacion = (cotizacion.estado === 'aprobado' || cotizacion.estado === 'en-proceso') && cotizacion.tecnicoAsignado;

    return (
      <div
        onClick={() => setDetalleSeleccionado(cotizacion)}
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
      >
        <h3 className="font-bold text-gray-900 mb-1 text-base line-clamp-1">{cotizacion.titulo}</h3>
        <p className="text-sm text-gray-500 mb-3">{cotizacion.cliente || cotizacion.usuario || 'Usuario'}</p>

        {/* Badge de técnico asignado */}
        {tieneAsignacion && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {cotizacion.tecnicoAsignado.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-600">Técnico Asignado</div>
                <div className="font-bold text-gray-900 text-sm">{cotizacion.tecnicoAsignado}</div>
              </div>
            </div>
            {cotizacion.telefonoTecnico && (
              <div className="text-xs text-gray-700 flex items-center gap-1 mb-1">
                <span>📞</span>
                <span>{cotizacion.telefonoTecnico}</span>
              </div>
            )}
            {cotizacion.fechaProgramada && (
              <div className="text-xs text-gray-700 flex items-center gap-1">
                <span>📅</span>
                <span>{new Date(cotizacion.fechaProgramada).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-400">📅 {formatearFecha(cotizacion.fecha)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
            {badge.text}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDetalleSeleccionado(cotizacion);
            }}
            className="text-blue-600 font-semibold text-sm hover:text-blue-700 flex items-center gap-1"
          >
            Ver detalles <span>≫</span>
          </button>
        </div>
      </div>
    );
  };

  // Render de lista de cotizaciones con "Ver más"
  const ListaCotizaciones = ({ lista, showAll, setShowAll }) => {
    const limit = 3;
    const displayList = showAll ? lista : lista.slice(0, limit);
    const hasMore = lista.length > limit;

    return (
      <div className="space-y-3">
        {displayList.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No hay cotizaciones aquí</p>
          </div>
        ) : (
          <>
            {displayList.map(cot => (
              <CotizacionCard key={cot.id} cotizacion={cot} />
            ))}
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-3 text-blue-600 font-semibold text-sm hover:bg-blue-50 rounded-xl transition-all"
              >
                Ver más ({lista.length - limit} más)
              </button>
            )}
            {showAll && lista.length > limit && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full py-3 text-gray-600 font-semibold text-sm hover:bg-gray-50 rounded-xl transition-all"
              >
                Ver menos
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  // Vista HOME
  const renderHome = () => (
    <div className="pb-4">
      {/* Pestañas de estado */}
      <div className="flex gap-2 mb-6 overflow-x-auto px-1 pb-2 scrollbar-hide">
        <button
          onClick={() => {
            setActiveStatusTab('pendientes');
            setShowAllPendientes(false);
          }}
          className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${activeStatusTab === 'pendientes'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => {
            setActiveStatusTab('en-proceso');
            setShowAllEnProceso(false);
          }}
          className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${activeStatusTab === 'en-proceso'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          En proceso
        </button>
        <button
          onClick={() => {
            setActiveStatusTab('terminadas');
            setShowAllTerminadas(false);
          }}
          className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${activeStatusTab === 'terminadas'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          Terminadas
        </button>
      </div>

      {/* Contenido según pestaña activa */}
      {activeStatusTab === 'pendientes' && (
        <ListaCotizaciones lista={pendientes} showAll={showAllPendientes} setShowAll={setShowAllPendientes} />
      )}
      {activeStatusTab === 'en-proceso' && (
        <ListaCotizaciones lista={enProceso} showAll={showAllEnProceso} setShowAll={setShowAllEnProceso} />
      )}
      {activeStatusTab === 'terminadas' && (
        <ListaCotizaciones lista={terminadas} showAll={showAllTerminadas} setShowAll={setShowAllTerminadas} />
      )}
    </div>
  );

  // Vista CREAR
  const renderCrear = () => (
    <div className="pb-28">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nueva Solicitud</h2>
        <p className="text-gray-500">Selecciona el tipo de servicio que necesitas</p>
      </div>

      {!tipoServicio ? (
        <div className="space-y-3">
          {/* Aplicación de Recubrimiento */}
          <button
            onClick={() => setTipoServicio('Aplicación de Recubrimiento')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all group text-left active:scale-98"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">🏗️</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Aplicación de Recubrimiento</h3>
                <p className="text-blue-100 text-sm">Instalación de sistemas de protección y recubrimiento</p>
              </div>
              <svg className="w-6 h-6 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Mantenimiento */}
          <button
            onClick={() => setTipoServicio('Mantenimiento')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all group text-left active:scale-98"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">🔧</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Mantenimiento</h3>
                <p className="text-orange-100 text-sm">Mantenimiento preventivo y correctivo de sistemas</p>
              </div>
              <svg className="w-6 h-6 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Garantía Extendida */}
          <button
            onClick={() => setTipoServicio('Garantía Extendida')}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all group text-left active:scale-98"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">🛡️</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Garantía Extendida</h3>
                <p className="text-purple-100 text-sm">Extensión de cobertura y protección adicional</p>
              </div>
              <svg className="w-6 h-6 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setTipoServicio('')}
            className="mb-4 text-gray-500 hover:text-blue-600 text-sm flex items-center gap-1"
          >
            ← Cambiar tipo de servicio
          </button>
          <CotizacionForm
            titulo={`Solicitud de ${tipoServicio}`}
            tipoServicio={tipoServicio}
            onSuccess={() => {
              setActiveView('home');
              setTipoServicio('');
              toast.success('Solicitud enviada correctamente');
            }}
          />
        </div>
      )}
    </div>
  );

  // Vista AJUSTES
  const renderAjustes = () => (
    <div className="pb-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Ajustes</h2>
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">Información del Perfil</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Nombre:</span>
              <span className="font-semibold text-gray-900">{usuario?.nombre}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Usuario:</span>
              <span className="font-semibold text-gray-900">{usuario?.usuario}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Rol:</span>
              <span className="font-semibold text-gray-900 capitalize">{usuario?.rol}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sessionStorage.clear();
            window.location.href = '/';
          }}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-all shadow-md active:scale-95"
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </div>
  );


  // Si hay detalle seleccionado, mostrar solo el detalle
  if (detalleSeleccionado) {
    return (
      <ClienteCotizacionDetalle
        cotizacion={detalleSeleccionado}
        onClose={() => setDetalleSeleccionado(null)}
        onUpdate={() => {
          cargarSolicitudes(usuario);
          setDetalleSeleccionado(null);
        }}
      />
    );
  }

  return (
    <>
      {activeView === 'home' && renderHome()}
      {activeView === 'crear' && renderCrear()}
      {activeView === 'ajustes' && renderAjustes()}
    </>
  );
};

export default ClienteHome;