import React, { useState, useEffect } from 'react';
import ServiceCard from '../../components/ui/ServiceCard';

const TecnicoHome = () => {
  const [activeTab, setActiveTab] = useState('pendientes'); // pendientes | completadas | solicitudes
  const [tareas, setTareas] = useState([]);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Cargar datos al iniciar
  const cargarDatos = async () => {
    setLoading(true);
    const userGuardado = JSON.parse(localStorage.getItem('user'));
    setUsuario(userGuardado);

    try {
      const res = await fetch('http://localhost:4000/api/servicios');
      const data = await res.json();

      // FILTRO A: TRABAJO (Lo que el admin me asignó)
      // Filtramos servicios donde el técnico asignado sea yo, o servicios de tipo servicio_general aprobados
      const trabajoTodo = data.filter(item => 
        item.tecnico === userGuardado?.nombre || // El admin me lo asignó directamente
        ((item.estado === 'aprobado' || item.estado === 'en-proceso' || item.estado === 'finalizado') 
        && item.tipo === 'servicio_general' && !item.tecnico) // Servicios generales sin asignar específicamente
      );
      setTareas(trabajoTodo);

      // FILTRO B: MIS SOLICITUDES (Lo que yo pedí: equipos, garantias, cotizaciones)
      // Incluimos TODAS las solicitudes creadas por el técnico
      const misPedidos = data.filter(item => {
        // Verificar si el técnico lo creó (campo usuario o cliente)
        const creadoPorMi = item.usuario === userGuardado?.nombre || 
                           (item.cliente === userGuardado?.nombre && !item.tecnico);
        
        // Excluir trabajos que le fueron asignados como técnico
        const noEsTrabajo = item.tecnico !== userGuardado?.nombre;
        
        return creadoPorMi && noEsTrabajo;
      });
      setMisSolicitudes(misPedidos);

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // 2. Función para marcar como FINALIZADO
  const handleFinalizar = async (id) => {
    if(!window.confirm("¿Confirmas que terminaste este servicio?")) return;

    try {
      const res = await fetch(`http://localhost:4000/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'finalizado' })
      });

      if(res.ok) {
        alert("¡Excelente trabajo! Servicio registrado como completado.");
        cargarDatos(); // Recargar para moverlo al historial
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 3. Renderizado condicional según la pestaña
  const renderContenido = () => {
    if (loading) return <div className="text-center py-10">Cargando...</div>;

    // --- PESTAÑA 1: TAREAS ACTIVAS ---
    if (activeTab === 'pendientes') {
      const pendientes = tareas.filter(t => t.estado !== 'finalizado');
      
      if (pendientes.length === 0) return <div className="text-center py-10 text-gray-400">No tienes tareas activas 🎉</div>;
      
      return pendientes.map(t => (
        <ServiceCard 
          key={t.id}
          id={t.id}
          titulo={t.titulo}
          empresa={t.cliente}
          direccion={t.direccion || 'Ubicación no especificada'}
          fecha={t.fecha}
          estado={t.estado}
          onDetalles={() => {
            const detalles = `
📝 ${t.titulo}
🏭 ${t.cliente}
📍 ${t.direccion || 'N/A'}
📞 ${t.telefono || 'N/A'}
📄 Tipo: ${t.tipo}
📝 Notas: ${t.notas || 'Sin notas'}
            `;
            alert(detalles);
          }}
          onFinalizar={handleFinalizar}
        />
      ));
    }

    // --- PESTAÑA 2: COMPLETADAS ---
    if (activeTab === 'completadas') {
      const finalizadas = tareas.filter(t => t.estado === 'finalizado');

      if (finalizadas.length === 0) return <div className="text-center py-10 text-gray-400">Aún no has completado servicios.</div>;

      return finalizadas.map(t => (
        <ServiceCard 
          key={t.id}
          id={t.id}
          titulo={t.titulo}
          empresa={t.cliente}
          direccion={t.direccion || 'Finalizado'}
          fecha={t.fecha}
          estado={t.estado}
          onDetalles={() => {
            const detalles = `
📝 ${t.titulo}
🏭 ${t.cliente}
📍 ${t.direccion || 'N/A'}
📞 ${t.telefono || 'N/A'}
✅ Servicio completado
            `;
            alert(detalles);
          }}
        />
      ));
    }

    // --- PESTAÑA 3: MIS SOLICITUDES (COTIZACIONES) ---
    if (activeTab === 'solicitudes') {
      if (misSolicitudes.length === 0) return <div className="text-center py-10 text-gray-400">No has solicitado cotizaciones.</div>;

      return (
        <div className="space-y-3">
          {misSolicitudes.map(sol => (
            <div key={sol.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800">{sol.titulo}</h4>
                <p className="text-xs text-gray-500 capitalize">Tipo: {sol.tipo} • {sol.fecha}</p>
                {/* RESPUESTA DEL ADMIN */}
                {sol.estado === 'aprobado' && <p className="text-xs text-green-600 font-bold mt-1">✅ Autorizado por Admin</p>}
                {sol.estado === 'rechazado' && <p className="text-xs text-red-600 font-bold mt-1">❌ Rechazada</p>}
              </div>
              
              <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize
                ${sol.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${sol.estado === 'aprobado' ? 'bg-green-100 text-green-800' : ''}
                ${sol.estado === 'rechazado' ? 'bg-red-100 text-red-800' : ''}
              `}>
                {sol.estado}
              </span>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="max-w-md mx-auto">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hola, {usuario?.nombre || 'Técnico'} 👋</h1>
        <p className="text-gray-500 text-sm">Panel de Operaciones</p>
      </div>

      {/* --- MENU DE PESTAÑAS (TABS) --- */}
      <div className="flex p-1 bg-gray-200 rounded-xl mb-6">
        <button 
          onClick={() => setActiveTab('pendientes')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'pendientes' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}
        >
          Activas
        </button>
        <button 
          onClick={() => setActiveTab('completadas')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'completadas' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}
        >
          Completadas
        </button>
        <button 
          onClick={() => setActiveTab('solicitudes')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'solicitudes' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}
        >
          Mis Pedidos
        </button>
      </div>

      {/* --- CONTENIDO DINÁMICO --- */}
      <div className="space-y-4">
        {renderContenido()}
      </div>

    </div>
  );
};

export default TecnicoHome;