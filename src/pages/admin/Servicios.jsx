import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function Servicios() {
  const [vistaActual, setVistaActual] = useState('menu'); // menu | asignar | en-curso | finalizados | crear
  const [tecnicos, setTecnicos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
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
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-10 shadow-xl transition transform hover:scale-105 hover:shadow-2xl h-72 flex flex-col items-center justify-center"
          >
            <div className="text-7xl mb-4 animate-bounce">👤</div>
            <h2 className="text-2xl font-bold mb-2">Asignar Técnico</h2>
            <p className="text-blue-100 text-sm">Servicios aprobados (clientes y técnicos)</p>
            {cotizacionesAprobadas.length > 0 && (
              <div className="mt-4 bg-blue-700/80 rounded-full px-6 py-2">
                <span className="text-2xl font-bold">{cotizacionesAprobadas.length}</span>
                <span className="text-sm ml-1">disponibles</span>
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
          <h1 className="text-3xl font-bold text-gray-800">✅ Cotizaciones Aprobadas</h1>
          <p className="text-gray-500 text-sm">Revisa y asigna técnico a cada servicio</p>
        </div>

        {cotizacionesAprobadas.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No hay cotizaciones aprobadas pendientes de asignar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cotizacionesAprobadas.map(cot => (
              <div key={cot.id} className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200 hover:border-blue-400 transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{cot.titulo}</h3>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        cot.cliente ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {cot.cliente ? '👤 CLIENTE' : '🔧 TÉCNICO'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 capitalize">📋 Tipo: {cot.tipo}</p>
                    <p className="text-sm text-gray-600">
                      {cot.cliente ? `👤 Cliente: ${cot.cliente}` : `🔧 Técnico: ${cot.usuario}`}
                    </p>
                    {cot.modelo && <p className="text-sm text-gray-600">📦 Modelo: {cot.modelo}</p>}
                    {cot.cantidad && <p className="text-sm text-gray-600">🔢 Cantidad: {cot.cantidad}</p>}
                    {cot.direccion && <p className="text-sm text-gray-600">📍 {cot.direccion}</p>}
                    {cot.telefono && <p className="text-sm text-gray-600">📞 {cot.telefono}</p>}
                    {cot.foto && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-gray-700 mb-1">📸 Foto adjunta:</p>
                        <img src={cot.foto} alt="Evidencia" className="w-full max-w-xs h-48 object-cover rounded-lg border border-gray-300 shadow-sm" />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">${cot.precio || cot.precioEstimado || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Precio aprobado</p>
                  </div>
                </div>

                {cot.respuestaAdmin && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                    <p className="text-xs font-bold text-blue-800 mb-1">💬 Detalles de la cotización:</p>
                    <p className="text-sm text-gray-700">{cot.respuestaAdmin}</p>
                  </div>
                )}

                {cot.notas && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-xs font-bold text-gray-700 mb-1">📝 Notas:</p>
                    <p className="text-sm text-gray-600">{cot.notas}</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setFormAsignar({
                      ...formAsignar,
                      cotizacionId: cot.id
                    });
                    setVistaActual('form-asignar');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <span>👤</span>
                  <span>Asignar Técnico a Este Servicio</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (vistaActual === 'form-asignar') {
    const cotizacionSeleccionada = servicios.find(s => s.id == formAsignar.cotizacionId);
    
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setVistaActual('asignar')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
          ← Volver a la lista
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👤 Asignar Técnico</h1>
          <p className="text-gray-500 text-sm">Servicio: {cotizacionSeleccionada?.titulo}</p>
        </div>

        <form onSubmit={handleAsignar} className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
          {/* INFO DE LA COTIZACIÓN SELECCIONADA */}
          {cotizacionSeleccionada && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">📋 Servicio Seleccionado:</h3>
              <p className="text-sm text-gray-700"><strong>Título:</strong> {cotizacionSeleccionada.titulo}</p>
              <p className="text-sm text-gray-700">
                <strong>{cotizacionSeleccionada.cliente ? 'Cliente' : 'Técnico'}:</strong> {cotizacionSeleccionada.cliente || cotizacionSeleccionada.usuario}
              </p>
              <p className="text-sm text-gray-700"><strong>Precio:</strong> ${cotizacionSeleccionada.precio || cotizacionSeleccionada.precioEstimado}</p>
            </div>
          )}

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
}

export default Servicios;
