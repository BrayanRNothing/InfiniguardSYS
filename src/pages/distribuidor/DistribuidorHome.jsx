import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import CotizacionForm from '../../components/forms/CotizacionForm.jsx';
import ClienteCotizacionDetalle from '../../components/cliente/ClienteCotizacionDetalle.jsx';
import API_URL from '../../config/api';

const DistribuidorHome = () => {
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
      if (e.detail === 'home' || e.detail === 'inicio') setActiveView('home');
      if (e.detail === 'solicitar' || e.detail === 'recubrimiento' || e.detail === 'garantia') {
        setTipoServicio(e.detail === 'garantia' ? 'Garantía Extendida' : '');
        setActiveView('crear');
      }
      if (e.detail === 'ajustes') setActiveView('ajustes');
    };

    window.addEventListener('changeDistribuidorTab', handleTabChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('changeDistribuidorTab', handleTabChange);
    };
  }, []);

  const cargarSolicitudes = async (user) => {
    try {
      const res = await fetch(`${API_URL}/api/servicios`);
      const data = await res.json();
      // Un distribuidor ve las que él creó (usuario === nombre)
      const misData = data.filter(s => s.usuario === user?.nombre);
      setMisSolicitudes(misData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Filtros de estado (ajustados para el flujo de distribuidor)
  const pendientes = misSolicitudes.filter(s => s.estado === 'pendiente' || s.estado === 'cotizado');
  const enProceso = misSolicitudes.filter(s => s.estado === 'aprobado' || s.estado === 'en-proceso' || s.estado === 'aprobado-cliente');
  const terminadas = misSolicitudes.filter(s => s.estado === 'finalizado');

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': { text: 'Pendiente', color: 'bg-orange-100 text-orange-700' },
      'cotizado': { text: 'Cotizado', color: 'bg-blue-100 text-blue-700' },
      'aprobado': { text: 'Aprobado', color: 'bg-green-100 text-green-700' },
      'aprobado-cliente': { text: 'Aprobado', color: 'bg-green-100 text-green-700' },
      'en-proceso': { text: 'En Proceso', color: 'bg-purple-100 text-purple-700' },
      'finalizado': { text: 'Finalizado', color: 'bg-gray-100 text-gray-700' },
      'rechazado': { text: 'Rechazado', color: 'bg-red-100 text-red-700' }
    };
    return badges[estado] || { text: estado, color: 'bg-gray-100 text-gray-700' };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
  };

  const CotizacionCard = ({ cotizacion }) => {
    const badge = getEstadoBadge(cotizacion.estado);

    return (
      <div
        onClick={() => setDetalleSeleccionado(cotizacion)}
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 text-base line-clamp-1">{cotizacion.titulo}</h3>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${badge.color}`}>
            {badge.text}
          </span>
        </div>
        <p className="text-sm text-blue-600 font-semibold mb-3">Cliente: {cotizacion.cliente || 'Consumidor Final'}</p>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-400">📅 {formatearFecha(cotizacion.fecha)}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-400 capitalize">{cotizacion.tipo}</span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
          <div className="text-sm font-bold text-gray-900">
            {cotizacion.precio ? `$${cotizacion.precio.toLocaleString()}` : <span className="text-gray-400 font-normal">Por cotizar</span>}
          </div>
          <button className="text-blue-600 font-bold text-xs hover:text-blue-700 uppercase tracking-wider">
            Detalles ≫
          </button>
        </div>
      </div>
    );
  };

  const ListaCotizaciones = ({ lista, showAll, setShowAll }) => {
    const limit = 4;
    const displayList = showAll ? lista : lista.slice(0, limit);
    const hasMore = lista.length > limit;

    return (
      <div className="space-y-4">
        {displayList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-400 text-sm font-medium">No hay registros disponibles</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayList.map(cot => (
                <CotizacionCard key={cot.id} cotizacion={cot} />
              ))}
            </div>
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-4 text-blue-600 font-bold text-sm bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all"
              >
                Ver más ({lista.length - limit} adicionales)
              </button>
            )}
            {showAll && lista.length > limit && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full py-4 text-gray-600 font-bold text-sm bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"
              >
                Ver menos
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  const renderHome = () => (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Mis Ventas</h1>
        <p className="text-gray-500 text-sm">Gestiona tus cotizaciones y servicios</p>
      </div>

      <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-6 gap-1">
        {[
          { id: 'pendientes', label: 'Pendientes', count: pendientes.length },
          { id: 'en-proceso', label: 'En Proceso', count: enProceso.length },
          { id: 'terminadas', label: 'Terminadas', count: terminadas.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveStatusTab(tab.id);
              setShowAllPendientes(false);
              setShowAllEnProceso(false);
              setShowAllTerminadas(false);
            }}
            className={`flex-1 py-4 md:py-3 px-2 rounded-xl text-xs font-bold transition-all relative ${activeStatusTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${activeStatusTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

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

  const renderCrear = () => (
    <div className="animate-fadeIn pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Crear Solicitud</h2>
        <p className="text-gray-500">Registra una nueva cotización para tus clientes</p>
      </div>

      {!tipoServicio ? (
        <div className="space-y-4">
          <button
            onClick={() => setTipoServicio('Aplicación de Recubrimiento')}
            className="w-full bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-3xl shadow-lg hover:shadow-blue-200 transition-all text-left active:scale-95"
          >
            <div className="flex items-center gap-5">
              <div className="text-5xl bg-white/20 p-3 rounded-2xl">🏗️</div>
              <div className="flex-1">
                <h3 className="text-xl font-extrabold mb-1">Recubrimientos</h3>
                <p className="text-blue-100 text-sm">Sistemas industriales y protección</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setTipoServicio('Garantía Extendida')}
            className="w-full bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-3xl shadow-lg hover:shadow-purple-200 transition-all text-left active:scale-95"
          >
            <div className="flex items-center gap-5">
              <div className="text-5xl bg-white/20 p-3 rounded-2xl">🛡️</div>
              <div className="flex-1">
                <h3 className="text-xl font-extrabold mb-1">Garantía Extendida</h3>
                <p className="text-purple-100 text-sm">Cobertura adicional para equipos</p>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="animate-fadeInUp">
          <button
            onClick={() => setTipoServicio('')}
            className="mb-6 font-bold text-blue-600 flex items-center gap-2 hover:bg-blue-50 p-2 rounded-lg transition-all"
          >
            ← Volver a opciones
          </button>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
            <CotizacionForm
              titulo={`Orden: ${tipoServicio}`}
              tipoServicio={tipoServicio}
              onSuccess={() => {
                setActiveView('home');
                setTipoServicio('');
                toast.success('Solicitud enviada al administrador');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderAjustes = () => (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-black text-gray-900 mb-8">Mi Cuenta</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {usuario?.nombre?.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">{usuario?.nombre}</h3>
              <p className="text-blue-600 font-bold text-sm tracking-widest uppercase">{usuario?.rol}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <span className="text-gray-500 font-medium text-sm">Email:</span>
              <span className="font-bold text-gray-900">{usuario?.email || usuario?.usuario}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <span className="text-gray-500 font-medium text-sm">ID Socio:</span>
              <span className="font-bold text-gray-900">#{usuario?.id || '001'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sessionStorage.clear();
            window.location.href = '/';
          }}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black py-5 rounded-3xl transition-all border-2 border-red-200"
        >
          🚪 Cerrar Sesión Segura
        </button>
      </div>
    </div>
  );

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
    <div className="max-w-4xl mx-auto">
      {activeView === 'home' && renderHome()}
      {activeView === 'crear' && renderCrear()}
      {activeView === 'ajustes' && renderAjustes()}

      <style>{`
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default DistribuidorHome;
