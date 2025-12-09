import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function Servicios() {
  const [vistaActual, setVistaActual] = useState('menu'); // menu | asignar | en-curso | finalizados | crear
  const [tecnicos, setTecnicos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [imagenZoom, setImagenZoom] = useState(null);
  const [formAsignar, setFormAsignar] = useState({
    cotizacionId: '',
    tecnicoId: '',
    fechaServicio: '',
    horaServicio: '',
    notas: ''
  });
  const [formCrear, setFormCrear] = useState({
    titulo: '',
    tipo: 'servicio_general',
    cliente: '',
    direccion: '',
    telefono: '',
    tecnicoId: '',
    notas: ''
  });

  useEffect(() => {
    cargarDatos();
    
    // Auto-refresh cada 10 segundos
    const interval = setInterval(() => {
      cargarDatos();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      const resTec = await fetch('https://infiniguardsys-production.up.railway.app/api/tecnicos');
      const dataTec = await resTec.json();
      setTecnicos(dataTec);

      const resServ = await fetch('https://infiniguardsys-production.up.railway.app/api/servicios');
      const dataServ = await resServ.json();
      setServicios(dataServ);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!formAsignar.cotizacionId || !formAsignar.tecnicoId) {
      toast.error('Selecciona una cotización y un técnico');
      return;
    }

    setLoading(true);
    try {
      const tecnicoSeleccionado = tecnicos.find(t => t.id == formAsignar.tecnicoId);
      const res = await fetch(`https://infiniguardsys-production.up.railway.app/api/servicios/${formAsignar.cotizacionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tecnico: tecnicoSeleccionado.nombre,
          estado: 'en-proceso',
          fechaServicio: formAsignar.fechaServicio,
          horaServicio: formAsignar.horaServicio,
          notas: formAsignar.notas
        })
      });

      if (res.ok) {
        toast.success('✅ Servicio asignado al técnico');
        setFormAsignar({ cotizacionId: '', tecnicoId: '', fechaServicio: '', horaServicio: '', notas: '' });
        cargarDatos();
        setVistaActual('menu');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al asignar servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!formCrear.titulo || !formCrear.cliente || !formCrear.tecnicoId) {
      alert('Completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const tecnicoSeleccionado = tecnicos.find(t => t.id == formCrear.tecnicoId);
      const res = await fetch('https://infiniguardsys-production.up.railway.app/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formCrear,
          tecnico: tecnicoSeleccionado.nombre,
          estado: 'en-proceso'
        })
      });

      if (res.ok) {
        alert('✅ Solicitud creada y asignada');
        setFormCrear({ titulo: '', tipo: 'servicio_general', cliente: '', direccion: '', telefono: '', tecnicoId: '', notas: '' });
        cargarDatos();
        setVistaActual('menu');
      }
    } catch (error) {
      console.error(error);
      alert('Error al crear solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar servicios
  // Cotizaciones aprobadas: incluye aprobadas por clientes (estadoCliente: 'aprobado') Y aprobadas por técnicos (estado: 'aprobado')
  const cotizacionesAprobadas = servicios.filter(s => 
    (s.estadoCliente === 'aprobado' || s.estado === 'aprobado') && !s.tecnico
  );
  const serviciosEnCurso = servicios.filter(s => s.estado === 'en-proceso' && s.tecnico);
  const serviciosFinalizados = servicios.filter(s => s.estado === 'finalizado');

  if (vistaActual === 'menu') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🔧 Gestión de Servicios</h1>
          <p className="text-gray-500 text-sm">Selecciona una opción</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Opción 1: Asignar Técnico */}
          <button
            onClick={() => setVistaActual('asignar')}
            className="bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4 animate-bounce">⏳</div>
            <h2 className="text-2xl font-bold mb-2">Servicios Pendientes</h2>
            <p className="text-pink-100 text-sm">Cotizaciones aprobadas sin asignar</p>
            {cotizacionesAprobadas.length > 0 && (
              <div className="mt-4 bg-pink-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{cotizacionesAprobadas.length}</span>
                <span className="text-sm ml-1">pendientes</span>
              </div>
            )}
          </button>

          {/* Opción 2: Servicios en Curso */}
          <button
            onClick={() => setVistaActual('en-curso')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">⚙️</div>
            <h2 className="text-2xl font-bold mb-2">Servicios en Curso</h2>
            <p className="text-purple-100 text-sm">Ver trabajos activos</p>
            {serviciosEnCurso.length > 0 && (
              <div className="mt-4 bg-purple-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{serviciosEnCurso.length}</span>
                <span className="text-sm ml-1">activos</span>
              </div>
            )}
          </button>

          {/* Opción 3: Servicios Finalizados */}
          <button
            onClick={() => setVistaActual('finalizados')}
            className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Servicios Finalizados</h2>
            <p className="text-green-100 text-sm">Historial completado</p>
            {serviciosFinalizados.length > 0 && (
              <div className="mt-4 bg-green-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{serviciosFinalizados.length}</span>
                <span className="text-sm ml-1">completados</span>
              </div>
            )}
          </button>

          {/* Opción 4: Crear Solicitud Directa */}
          <button
            onClick={() => setVistaActual('crear')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">➕</div>
            <h2 className="text-2xl font-bold mb-2">Crear Solicitud</h2>
            <p className="text-orange-100 text-sm">Directa a técnico</p>
            <p className="text-xs text-orange-200 mt-2 bg-orange-700/50 px-3 py-1 rounded-full">(Sin cotización)</p>
          </button>
        </div>
      </div>
    );
  }

  if (vistaActual === 'asignar') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">⏳ Servicios Pendientes</h1>
          <p className="text-gray-500 text-sm">Selecciona una cotización para asignar técnico</p>
        </div>

        {cotizacionesAprobadas.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No hay cotizaciones aprobadas pendientes de asignar</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
              <h2 className="text-lg font-bold">📋 Lista de Cotizaciones Aprobadas</h2>
              <p className="text-blue-100 text-sm">Click en una para ver detalles y asignar técnico</p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {cotizacionesAprobadas.map(cot => (
                <button
                  key={cot.id}
                  onClick={() => {
                    setCotizacionSeleccionada(cot);
                    setFormAsignar({ ...formAsignar, cotizacionId: cot.id });
                    setVistaActual('form-asignar');
                  }}
                  className="w-full px-6 py-4 hover:bg-blue-50 transition text-left flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">{cot.titulo}</h3>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        cot.cliente ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {cot.cliente ? '👤 CLIENTE' : '🔧 TÉCNICO'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="capitalize">📋 {cot.tipo}</span>
                      <span>👤 {cot.cliente || cot.usuario}</span>
                      {cot.direccion && <span className="truncate max-w-xs">📍 {cot.direccion}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">${cot.precio || cot.precioEstimado || 'N/A'}</p>
                      <p className="text-xs text-gray-500">Precio</p>
                    </div>
                    <div className="text-blue-600 group-hover:text-blue-700">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (vistaActual === 'form-asignar') {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => { setVistaActual('asignar'); setCotizacionSeleccionada(null); }} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver a la lista
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👤 Asignar Técnico</h1>
          <p className="text-gray-500 text-sm">Servicio: {cotizacionSeleccionada?.titulo}</p>
        </div>

        {/* DETALLES COMPLETOS DE LA COTIZACIÓN */}
        {cotizacionSeleccionada && (
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-200 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{cotizacionSeleccionada.titulo}</h3>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    cotizacionSeleccionada.cliente ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {cotizacionSeleccionada.cliente ? '👤 CLIENTE' : '🔧 TÉCNICO'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 capitalize">📋 Tipo: {cotizacionSeleccionada.tipo}</p>
                <p className="text-sm text-gray-600">
                  {cotizacionSeleccionada.cliente ? `👤 Cliente: ${cotizacionSeleccionada.cliente}` : `🔧 Técnico: ${cotizacionSeleccionada.usuario}`}
                </p>
                {cotizacionSeleccionada.modelo && <p className="text-sm text-gray-600">📦 Modelo: {cotizacionSeleccionada.modelo}</p>}
                {cotizacionSeleccionada.cantidad && <p className="text-sm text-gray-600">🔢 Cantidad: {cotizacionSeleccionada.cantidad}</p>}
                {cotizacionSeleccionada.direccion && <p className="text-sm text-gray-600">📍 {cotizacionSeleccionada.direccion}</p>}
                {cotizacionSeleccionada.telefono && <p className="text-sm text-gray-600">📞 {cotizacionSeleccionada.telefono}</p>}
                {cotizacionSeleccionada.foto && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-gray-700 mb-1">📸 Foto adjunta (click para ampliar):</p>
                    <img 
                      src={cotizacionSeleccionada.foto} 
                      alt="Evidencia" 
                      onClick={() => setImagenZoom(cotizacionSeleccionada.foto)}
                      className="w-full max-w-xs h-48 object-cover rounded-lg border border-gray-300 shadow-sm cursor-pointer hover:opacity-80 transition" 
                    />
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">${cotizacionSeleccionada.precio || cotizacionSeleccionada.precioEstimado || 'N/A'}</p>
                <p className="text-xs text-gray-500">Precio aprobado</p>
              </div>
            </div>

            {cotizacionSeleccionada.respuestaAdmin && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                <p className="text-xs font-bold text-blue-800 mb-1">💬 Detalles de la cotización:</p>
                <p className="text-sm text-gray-700">{cotizacionSeleccionada.respuestaAdmin}</p>
              </div>
            )}

            {cotizacionSeleccionada.notas && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-bold text-gray-700 mb-1">📝 Notas:</p>
                <p className="text-sm text-gray-600">{cotizacionSeleccionada.notas}</p>
              </div>
            )}
          </div>
        )}

        {/* FORMULARIO DE ASIGNACIÓN */}
        <form onSubmit={handleAsignar} className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Técnico *</label>
              <select value={formAsignar.tecnicoId} onChange={(e) => setFormAsignar({...formAsignar, tecnicoId: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                <option value="">Selecciona un técnico</option>
                {tecnicos.map(tec => (
                  <option key={tec.id} value={tec.id}>{tec.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Fecha del Servicio *</label>
                <input 
                  type="date" 
                  value={formAsignar.fechaServicio} 
                  onChange={(e) => setFormAsignar({...formAsignar, fechaServicio: e.target.value})} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🕐 Hora del Servicio *</label>
                <input 
                  type="time" 
                  value={formAsignar.horaServicio} 
                  onChange={(e) => setFormAsignar({...formAsignar, horaServicio: e.target.value})} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notas para el Técnico</label>
              <textarea value={formAsignar.notas} onChange={(e) => setFormAsignar({...formAsignar, notas: e.target.value})} placeholder="Instrucciones especiales..." rows="3" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg transition disabled:opacity-50">
              {loading ? 'Asignando...' : '✅ Asignar Servicio'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (vistaActual === 'en-curso') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">⚙️ Servicios en Curso</h1>
          <p className="text-gray-500 text-sm">{serviciosEnCurso.length} trabajos activos</p>
        </div>

        {serviciosEnCurso.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow-md">
            <p className="text-lg">No hay servicios en curso</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviciosEnCurso.map(serv => (
              <div key={serv.id} className="bg-purple-50 border border-purple-300 rounded-lg p-4">
                <h3 className="font-bold text-gray-800">{serv.titulo}</h3>
                <p className="text-sm text-gray-600">Cliente: {serv.cliente}</p>
                <p className="text-sm text-purple-700 font-semibold">🔧 {serv.tecnico}</p>
                <p className="text-sm text-gray-500">📍 {serv.direccion}</p>
                <p className="text-sm text-gray-500">📞 {serv.telefono}</p>
                {serv.notas && <p className="text-xs text-gray-500 mt-2">📝 {serv.notas}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (vistaActual === 'finalizados') {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">✅ Servicios Finalizados</h1>
          <p className="text-gray-500 text-sm">{serviciosFinalizados.length} servicios completados</p>
        </div>

        {serviciosFinalizados.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow-md">
            <p className="text-lg">No hay servicios finalizados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviciosFinalizados.map(serv => (
              <div key={serv.id} className="bg-green-50 border border-green-300 rounded-lg p-4 opacity-90">
                <h3 className="font-bold text-gray-700">{serv.titulo}</h3>
                <p className="text-sm text-gray-600">Cliente: {serv.cliente}</p>
                <p className="text-sm text-green-700 font-semibold">✅ {serv.tecnico}</p>
                <p className="text-xs text-gray-500">Completado: {serv.fecha}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (vistaActual === 'crear') {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">➕ Crear Solicitud Directa</h1>
          <p className="text-gray-500 text-sm">Crear y asignar servicio sin cotización previa</p>
        </div>

        <form onSubmit={handleCrear} className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Servicio *</label>
              <select value={formCrear.tipo} onChange={(e) => setFormCrear({...formCrear, tipo: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="servicio_general">⚙️ Servicio General</option>
                <option value="instalacion">🔧 Instalación</option>
                <option value="mantenimiento">🛠️ Mantenimiento</option>
                <option value="reparacion">🔨 Reparación</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Título del Servicio *</label>
              <input type="text" value={formCrear.titulo} onChange={(e) => setFormCrear({...formCrear, titulo: e.target.value})} placeholder="Ej: Instalación de equipo urgente" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
              <input type="text" value={formCrear.cliente} onChange={(e) => setFormCrear({...formCrear, cliente: e.target.value})} placeholder="Nombre del cliente" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
              <input type="text" value={formCrear.direccion} onChange={(e) => setFormCrear({...formCrear, direccion: e.target.value})} placeholder="Dirección del servicio" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
              <input type="tel" value={formCrear.telefono} onChange={(e) => setFormCrear({...formCrear, telefono: e.target.value})} placeholder="Teléfono de contacto" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Asignar a Técnico *</label>
              <select value={formCrear.tecnicoId} onChange={(e) => setFormCrear({...formCrear, tecnicoId: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                <option value="">Selecciona un técnico</option>
                {tecnicos.map(tec => (
                  <option key={tec.id} value={tec.id}>{tec.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
              <textarea value={formCrear.notas} onChange={(e) => setFormCrear({...formCrear, notas: e.target.value})} placeholder="Detalles del servicio..." rows="3" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-lg shadow-lg transition disabled:opacity-50">
              {loading ? 'Creando...' : '✅ Crear y Asignar Servicio'}
            </button>
          </div>
        </form>
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

export default Servicios;
