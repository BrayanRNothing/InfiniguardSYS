import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function Servicios() {
  const [vistaActual, setVistaActual] = useState('menu'); // menu | asignar | en-curso | finalizados | crear | detalle-servicio
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
          tecnicoId: tecnicoSeleccionado.id,
          estado: 'en-proceso',
          fechaServicio: formAsignar.fechaServicio,
          horaServicio: formAsignar.horaServicio,
          notas: formAsignar.notas
        })
      });

      if (res.ok) {
        toast.success('✅ Servicio asignado al técnico');
        setFormAsignar({ cotizacionId: '', tecnicoId: '', fechaServicio: '', horaServicio: '', notas: '' });
        setCotizacionSeleccionada(null);
        cargarDatos();
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
          tecnicoId: tecnicoSeleccionado.id,
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
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Servicios</h1>
          <p className="text-gray-500 text-sm">Selecciona una opción</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Opción 1: Asignar Técnico */}
          <button
            onClick={() => setVistaActual('asignar')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold mb-2">Servicios Pendientes</h2>
            <p className="text-orange-100 text-sm">Asignar técnico a servicios</p>
            {cotizacionesAprobadas.length > 0 && (
              <div className="mt-4 bg-orange-700/80 rounded-full px-6 py-2">
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
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4">➕</div>
            <h2 className="text-2xl font-bold mb-2">Crear Solicitud</h2>
            <p className="text-blue-100 text-sm">Directa a técnico</p>
            <p className="text-xs text-blue-200 mt-2 bg-blue-700/50 px-3 py-1 rounded-full">(Sin cotización)</p>
          </button>
        </div>
      </div>
    );
  }

  if (vistaActual === 'asignar') {
    return (
      <div className="max-w-7xl mx-auto">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver al menú
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">⏳ Servicios Pendientes</h1>
          <p className="text-gray-500 text-sm">Cotizaciones aprobadas esperando asignación de técnico</p>
        </div>

        {cotizacionesAprobadas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg font-semibold">No hay servicios pendientes</p>
            <p className="text-gray-400 text-sm mt-2">Las cotizaciones aprobadas aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold">📋 {cotizacionesAprobadas.length} Servicio{cotizacionesAprobadas.length !== 1 ? 's' : ''} Pendiente{cotizacionesAprobadas.length !== 1 ? 's' : ''}</h2>
              <p className="text-orange-100 text-sm">Haz clic en "Ver Detalles" para expandir y asignar técnico</p>
            </div>

            {/* Lista de tarjetas expandibles */}
            {cotizacionesAprobadas.map(cot => (
              <div key={cot.id} className="bg-white rounded-xl border-2 border-gray-200 shadow-md overflow-hidden transition hover:shadow-lg">
                {/* Resumen siempre visible */}
                <div className="flex items-center gap-4 p-6 hover:bg-gray-50 transition">
                  {cot.foto && (
                    <div className="w-20 h-20 flex-shrink-0">
                      <img 
                        src={cot.foto} 
                        alt="Preview" 
                        onClick={() => setImagenZoom(cot.foto)}
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition shadow-md"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{cot.titulo}</h3>
                    <p className="text-sm text-gray-600">
                      👤 {cot.cliente || cot.usuario}
                      {cot.telefono && <span className="ml-3">📞 {cot.telefono}</span>}
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                      {cot.tipo.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">${cot.precio || cot.precioEstimado || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-1">Precio aprobado</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setCotizacionSeleccionada(cot);
                      setFormAsignar({ ...formAsignar, cotizacionId: cot.id });
                      setVistaActual('detalle-servicio');
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    📋 Abrir Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista de Detalle de Servicio (Pantalla Completa)
  if (vistaActual === 'detalle-servicio' && cotizacionSeleccionada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header fijo */}
        <div className="bg-white border-b-2 border-gray-200 shadow-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <button 
              onClick={() => {
                setVistaActual('asignar');
                setCotizacionSeleccionada(null);
                setFormAsignar({ cotizacionId: '', tecnicoId: '', fechaServicio: '', horaServicio: '', notas: '' });
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 transition text-sm"
            >
              ← Volver a la lista
            </button>
            <h1 className="text-xl font-bold text-gray-800">📋 Detalles del Servicio</h1>
            <div className="w-32"></div> {/* Spacer para centrar título */}
          </div>
        </div>

        {/* Contenido principal en 2 columnas */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna izquierda: Información del servicio (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header del servicio */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{cotizacionSeleccionada.titulo}</h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="text-blue-600">👤</span> {cotizacionSeleccionada.cliente || cotizacionSeleccionada.usuario}
                  </span>
                  {cotizacionSeleccionada.telefono && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-green-600">📞</span> {cotizacionSeleccionada.telefono}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold capitalize">
                    {cotizacionSeleccionada.tipo.replace(/_/g, ' ')}
                  </span>
                  <span className="ml-auto text-4xl font-bold text-green-600">
                    ${cotizacionSeleccionada.precio || cotizacionSeleccionada.precioEstimado || 'N/A'}
                  </span>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Detalles del producto */}
              {(cotizacionSeleccionada.modelo || cotizacionSeleccionada.cantidad) && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Detalles del Producto</h3>
                  <div className="space-y-2 ml-4">
                    {cotizacionSeleccionada.modelo && (
                      <div className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">Modelo:</span>
                        <span className="text-sm font-semibold text-gray-900">{cotizacionSeleccionada.modelo}</span>
                      </div>
                    )}
                    {cotizacionSeleccionada.cantidad && (
                      <div className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">Cantidad:</span>
                        <span className="text-sm font-semibold text-gray-900">{cotizacionSeleccionada.cantidad}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ubicación */}
              {cotizacionSeleccionada.direccion && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ubicación del Servicio</h3>
                  <div className="flex items-start gap-3 ml-4">
                    <span className="text-orange-500 text-lg">📍</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{cotizacionSeleccionada.direccion}</p>
                  </div>
                </div>
              )}

              {/* Imagen */}
              {cotizacionSeleccionada.foto && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Evidencia Fotográfica</h3>
                  <img 
                    src={cotizacionSeleccionada.foto} 
                    alt="Evidencia del servicio" 
                    onClick={() => setImagenZoom(cotizacionSeleccionada.foto)}
                    className="w-64 h-48 object-cover rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-300"
                  />
                  <p className="text-xs text-gray-400 mt-2">Click para ver en tamaño completo</p>
                </div>
              )}

              {/* Cotización */}
              {cotizacionSeleccionada.respuestaAdmin && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Detalles de la Cotización</h3>
                  <p className="text-sm text-gray-700 leading-relaxed ml-4 pl-4 border-l-2 border-blue-500">
                    {cotizacionSeleccionada.respuestaAdmin}
                  </p>
                </div>
              )}

              {/* Notas */}
              {cotizacionSeleccionada.notas && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Notas Adicionales</h3>
                  <p className="text-sm text-gray-600 leading-relaxed ml-4 pl-4 border-l-2 border-gray-300">
                    {cotizacionSeleccionada.notas}
                  </p>
                </div>
              )}
            </div>

            {/* Columna derecha: Formulario de asignación (1/3) */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">👤 Asignar Técnico</h3>
                  <p className="text-sm text-gray-500">Completa la información del servicio</p>
                </div>

                <hr className="border-gray-200" />
                
                <form onSubmit={handleAsignar} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Técnico Responsable *</label>
                    <select 
                      value={formAsignar.tecnicoId} 
                      onChange={(e) => setFormAsignar({...formAsignar, tecnicoId: e.target.value})} 
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white shadow-sm hover:border-gray-300" 
                      required
                    >
                      <option value="">Seleccionar técnico...</option>
                      {tecnicos.map(tec => (
                        <option key={tec.id} value={tec.id}>{tec.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Fecha *</label>
                      <input 
                        type="date" 
                        value={formAsignar.fechaServicio} 
                        onChange={(e) => setFormAsignar({...formAsignar, fechaServicio: e.target.value})} 
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-300" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Hora *</label>
                      <input 
                        type="time" 
                        value={formAsignar.horaServicio} 
                        onChange={(e) => setFormAsignar({...formAsignar, horaServicio: e.target.value})} 
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-300" 
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Instrucciones</label>
                    <textarea 
                      value={formAsignar.notas} 
                      onChange={(e) => setFormAsignar({...formAsignar, notas: e.target.value})} 
                      placeholder="Detalles adicionales para el técnico..." 
                      rows="4" 
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none shadow-sm hover:border-gray-300" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Asignando...' : '✅ Asignar Servicio'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
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
