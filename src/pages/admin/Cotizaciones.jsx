import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function Cotizaciones() {
  const [vistaActual, setVistaActual] = useState('menu'); // menu | pendientes | cotizadas | aprobadas | rechazadas
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cotizando, setCotizando] = useState(null);
  const [respuesta, setRespuesta] = useState({ texto: '', precio: '' });
  const [imagenZoom, setImagenZoom] = useState(null);

  useEffect(() => {
    cargarCotizaciones();
    
    // Auto-refresh cada 10 segundos
    const interval = setInterval(() => {
      cargarCotizaciones();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const cargarCotizaciones = async () => {
    try {
      const res = await fetch('https://infiniguardsys-production.up.railway.app/api/servicios');
      const data = await res.json();
      setCotizaciones(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEnviarCotizacion = async (id) => {
    if (!respuesta.texto || !respuesta.precio) {
      toast.error('Completa la respuesta y el precio');
      return;
    }

    try {
      const res = await fetch(`https://infiniguardsys-production.up.railway.app/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'cotizado',
          respuestaAdmin: respuesta.texto,
          precio: respuesta.precio
        })
      });

      if (res.ok) {
        toast.success('✅ Cotización enviada');
        setRespuesta({ texto: '', precio: '' });
        setCotizando(null);
        cargarCotizaciones();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAprobarCotizacionTecnico = async (id) => {
    try {
      const res = await fetch(`https://infiniguardsys-production.up.railway.app/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'aprobado' })
      });

      if (res.ok) {
        alert('✅ Cotización aprobada');
        cargarCotizaciones();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRechazarCotizacionTecnico = async (id) => {
    if (!confirm('¿Rechazar esta cotización?')) return;
    
    try {
      const res = await fetch(`https://infiniguardsys-production.up.railway.app/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'rechazado' })
      });

      if (res.ok) {
        alert('Cotización rechazada');
        cargarCotizaciones();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Identificar origen de la cotización
  const esCliente = (cot) => {
    // Si tiene campo 'cliente' definido (no null), viene de un cliente
    // Si tiene campo 'usuario' definido (no null), viene de técnico/distribuidor
    if (cot.cliente && !cot.usuario) {
      return true; // Es de cliente
    }
    if (cot.usuario && !cot.cliente) {
      return false; // Es de técnico/distribuidor
    }
    // Fallback: si tiene ambos o ninguno, verificar por tipo de servicio
    const tiposDeTecnico = ['equipo-tecnico', 'herramienta', 'material', 'repuesto', 'garantia'];
    return !tiposDeTecnico.includes(cot.tipo);
  };

  const pendientes = cotizaciones.filter(c => c.estado === 'pendiente');
  const cotizadas = cotizaciones.filter(c => c.estado === 'cotizado');
  const aprobadas = cotizaciones.filter(c => c.estado === 'aprobado' || c.estadoCliente === 'aprobado');
  const rechazadas = cotizaciones.filter(c => c.estado === 'rechazado' || c.estadoCliente === 'rechazado');

  if (vistaActual === 'menu') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Cotizaciones</h1>
          <p className="text-gray-500 text-sm">Gestiona solicitudes de clientes y técnicos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Opción 1: Pendientes */}
          <button
            onClick={() => setVistaActual('pendientes')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">📄</div>
            <h2 className="text-2xl font-bold mb-2">Pendientes</h2>
            <p className="text-orange-100 text-sm">Por cotizar</p>
            {pendientes.length > 0 && (
              <div className="mt-4 bg-orange-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{pendientes.length}</span>
                <span className="text-sm ml-1">pendientes</span>
              </div>
            )}
          </button>

          {/* Opción 2: Cotizadas */}
          <button
            onClick={() => setVistaActual('cotizadas')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">💬</div>
            <h2 className="text-2xl font-bold mb-2">Cotizadas</h2>
            <p className="text-blue-100 text-sm">Esperando respuesta</p>
            {cotizadas.length > 0 && (
              <div className="mt-4 bg-blue-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{cotizadas.length}</span>
                <span className="text-sm ml-1">esperando</span>
              </div>
            )}
          </button>

          {/* Opción 3: Aprobadas */}
          <button
            onClick={() => setVistaActual('aprobadas')}
            className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Aprobadas</h2>
            <p className="text-green-100 text-sm">Listas para asignar</p>
            {aprobadas.length > 0 && (
              <div className="mt-4 bg-green-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{aprobadas.length}</span>
                <span className="text-sm ml-1">aprobadas</span>
              </div>
            )}
          </button>

          {/* Opción 4: Rechazadas */}
          <button
            onClick={() => setVistaActual('rechazadas')}
            className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2">Rechazadas</h2>
            <p className="text-red-100 text-sm">Historial</p>
            {rechazadas.length > 0 && (
              <div className="mt-4 bg-red-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{rechazadas.length}</span>
                <span className="text-sm ml-1">rechazadas</span>
              </div>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (vistaActual === 'pendientes') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">⏳ Cotizaciones Pendientes</h1>
          <p className="text-gray-500 text-sm">{pendientes.length} solicitudes por cotizar</p>
        </div>

        {pendientes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No hay cotizaciones pendientes</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendientes.map(cot => (
              <div key={cot.id} className="bg-orange-50 border border-orange-300 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        esCliente(cot) ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'
                      }`}>
                        {esCliente(cot) ? '👤 CLIENTE' : '🔧 TÉCNICO'}
                      </span>
                      <h3 className="text-lg font-bold text-gray-800 mt-2">{cot.titulo}</h3>
                      <p className="text-sm text-gray-600">De: {cot.cliente || cot.usuario}</p>
                      <p className="text-sm text-gray-500">Tipo: {cot.tipo}</p>
                      {cot.modelo && <p className="text-sm text-gray-600">Modelo: {cot.modelo}</p>}
                      {cot.cantidad && <p className="text-sm text-gray-600">Cantidad: {cot.cantidad}</p>}
                      {cot.direccion && <p className="text-sm text-gray-500">📍 {cot.direccion}</p>}
                      {cot.telefono && <p className="text-sm text-gray-500">📞 {cot.telefono}</p>}
                      {cot.notas && <p className="text-sm text-gray-500 mt-2">📝 {cot.notas}</p>}
                    </div>
                    {cot.foto && (
                      <div className="ml-3">
                        <p className="text-xs font-bold text-gray-700 mb-1">📸 Foto (click para ampliar)</p>
                        <img 
                          src={cot.foto} 
                          alt="Evidencia" 
                          onClick={() => setImagenZoom(cot.foto)}
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300 shadow-sm cursor-pointer hover:opacity-80 transition"
                        />
                      </div>
                    )}
                  </div>

                  {esCliente(cot) ? (
                    // Cotizaciones de CLIENTES: Admin responde con precio
                    <>
                      {cotizando === cot.id ? (
                        <div className="bg-white border border-gray-300 rounded-lg p-4 mt-4">
                          <h5 className="font-bold text-gray-800 mb-3">💬 Responder Cotización</h5>
                          <textarea
                            value={respuesta.texto}
                            onChange={(e) => setRespuesta({...respuesta, texto: e.target.value})}
                            placeholder="Descripción detallada del servicio..."
                            rows="3"
                            className="w-full px-3 py-2 border rounded-lg mb-2"
                          />
                          <input
                            type="number"
                            value={respuesta.precio}
                            onChange={(e) => setRespuesta({...respuesta, precio: e.target.value})}
                            placeholder="Precio (MXN)"
                            className="w-full px-3 py-2 border rounded-lg mb-3"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEnviarCotizacion(cot.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
                            >
                              ✅ Enviar
                            </button>
                            <button
                              onClick={() => {setCotizando(null); setRespuesta({texto: '', precio: ''});}}
                              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCotizando(cot.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold mt-3"
                        >
                          💬 Cotizar
                        </button>
                      )}
                    </>
                  ) : (
                    // Cotizaciones de TÉCNICOS: Admin aprueba/rechaza
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAprobarCotizacionTecnico(cot.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        ✅ Aprobar
                      </button>
                      <button
                        onClick={() => handleRechazarCotizacionTecnico(cot.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    );
  }

  if (vistaActual === 'cotizadas') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">💬 Cotizadas - Esperando Cliente</h1>
          <p className="text-gray-500 text-sm">{cotizadas.length} cotizaciones esperando respuesta</p>
        </div>

        <div>
          {cotizadas.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No hay cotizaciones esperando respuesta</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cotizadas.map(cot => (
                <div key={cot.id} className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800">{cot.titulo}</h3>
                  <p className="text-sm text-gray-600">Cliente: {cot.cliente}</p>
                  <p className="text-sm font-semibold text-green-600">Precio: ${parseFloat(cot.precioEstimado).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (vistaActual === 'aprobadas') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">✅ Cotizaciones Aprobadas</h1>
          <p className="text-gray-500 text-sm">{aprobadas.length} listas para asignar técnico</p>
        </div>

        <div>
          {aprobadas.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No hay cotizaciones aprobadas</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aprobadas.map(cot => (
                <div key={cot.id} className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    esCliente(cot) ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'
                  }`}>
                    {esCliente(cot) ? '👤 CLIENTE' : '🔧 TÉCNICO'}
                  </span>
                  <h3 className="font-bold text-gray-800 mt-2">{cot.titulo}</h3>
                  <p className="text-sm text-gray-600">{cot.cliente || cot.usuario}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (vistaActual === 'rechazadas') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">❌ Cotizaciones Rechazadas</h1>
          <p className="text-gray-500 text-sm">{rechazadas.length} rechazadas</p>
        </div>

        <div>
          {rechazadas.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No hay cotizaciones rechazadas</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rechazadas.map(cot => (
                <div key={cot.id} className="bg-red-50 border border-red-300 rounded-lg p-4 opacity-75">
                  <h3 className="font-bold text-gray-700">{cot.titulo}</h3>
                  <p className="text-sm text-gray-600">{cot.cliente || cot.usuario}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de Zoom para Imágenes */}
      {imagenZoom && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setImagenZoom(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button 
              onClick={() => setImagenZoom(null)}
              className="absolute -top-12 right-0 text-white text-4xl font-bold hover:text-gray-300 transition"
            >
              ✕
            </button>
            <img 
              src={imagenZoom} 
              alt="Imagen ampliada" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Cotizaciones;
