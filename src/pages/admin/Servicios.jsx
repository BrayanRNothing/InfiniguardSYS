import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API_URL from '../../config/api';
import BotonMenu from '../../components/ui/BotonMenu';
import { getSafeUrl } from '../../utils/helpers';
import InfoItem from '../../components/ui/InfoItem';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

registerLocale('es', es);

function Servicios() {
  const [vistaActual, setVistaActual] = useState('menu'); // menu | asignar | en-curso | finalizados | crear | detalle-servicio
  const [tecnicos, setTecnicos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [imagenZoom, setImagenZoom] = useState(null);
  const [archivoPDF, setArchivoPDF] = useState(null);
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
    fechaServicio: '',
    horaServicio: '',
    precio: '',
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
      const resTec = await fetch(`${API_URL}/api/tecnicos`);
      const dataTec = await resTec.json();
      setTecnicos(dataTec);

      const resServ = await fetch(`${API_URL}/api/servicios`);
      const dataServ = await resServ.json();
      setServicios(dataServ);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEliminarServicio = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este servicio permanentemente? Esto no se puede deshacer.")) {
      try {
        const res = await fetch(`${API_URL}/api/servicios/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success("Servicio eliminado con éxito");
          cargarDatos();
          if (cotizacionSeleccionada?.id === id) {
             setVistaActual('menu');
             setCotizacionSeleccionada(null);
          }
        } else {
          toast.error("Error al eliminar servicio");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error de conexión");
      }
    }
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!formAsignar.cotizacionId || !formAsignar.tecnicoId) {
      toast.error('Selecciona una cotización y un técnico');
      return;
    }
    
    if (!formAsignar.fechaServicio) {
      toast.error('Selecciona la fecha del servicio');
      return;
    }

    if (!formAsignar.horaServicio) {
      toast.error('Selecciona la hora del servicio');
      return;
    }

    setLoading(true);
    try {
      const tecnicoSeleccionado = tecnicos.find(t => t.id == formAsignar.tecnicoId);

      // Combinar fecha y hora en un formato ISO para fechaProgramada
      let fechaProgramada = null;
      if (formAsignar.fechaServicio && formAsignar.horaServicio) {
        fechaProgramada = `${formAsignar.fechaServicio}T${formAsignar.horaServicio}:00`;
      }

      const res = await fetch(`${API_URL}/api/servicios/${formAsignar.cotizacionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tecnicoAsignado: tecnicoSeleccionado.nombre,
          telefonoTecnico: tecnicoSeleccionado.telefono || tecnicoSeleccionado.usuario || '',
          tecnicoId: tecnicoSeleccionado.id,
          estado: 'en-proceso',
          fechaProgramada: fechaProgramada,
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
        setVistaActual('en-curso'); // Redirigir a servicios en curso
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

      // Combinar fecha y hora en un formato ISO para fechaProgramada
      let fechaProgramada = null;
      if (formCrear.fechaServicio && formCrear.horaServicio) {
        fechaProgramada = `${formCrear.fechaServicio}T${formCrear.horaServicio}:00`;
      }

      const res = await fetch(`${API_URL}/api/servicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formCrear,
          tecnicoAsignado: tecnicoSeleccionado.nombre,
          telefonoTecnico: tecnicoSeleccionado.telefono || tecnicoSeleccionado.usuario || '',
          tecnicoId: tecnicoSeleccionado.id,
          fechaProgramada: fechaProgramada,
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
    (s.estadocliente === 'aprobado' || s.estado === 'aprobado') && !s.tecnicoasignado
  );
  const serviciosEnCurso = servicios.filter(s => s.estado === 'en-proceso' && s.tecnicoasignado);
  const serviciosFinalizados = servicios.filter(s => s.estado === 'finalizado');

  {/*################################## 4 Tarjetas ##########################################################*/ }

  if (vistaActual === 'menu') {
    return (
      <div className="w-full h-full animate-fadeInUp flex flex-col min-h-0">
        {/* Encabezado */}
        <div className="mb-6 shrink-0">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-500">Gestión de Servicios</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Panel de control de operaciones</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full grow">
          <BotonMenu
            gradient="from-orange-500/80 to-orange-600/80 hover:from-orange-600/90 hover:to-orange-700/90"
            icon="⏳"
            titulo="Servicios Pendientes"
            count={cotizacionesAprobadas.length}
            onClick={() => setVistaActual('asignar')}
          />
          <BotonMenu
            gradient="from-purple-500/80 to-purple-600/80 hover:from-purple-600/90 hover:to-purple-700/90"
            icon="⚙️"
            titulo="Servicios en Curso"
            count={serviciosEnCurso.length}
            onClick={() => setVistaActual('en-curso')}
          />
          <BotonMenu
            gradient="from-green-500/80 to-green-600/80 hover:from-green-600/90 hover:to-green-700/90"
            icon="✅"
            titulo="Finalizados"
            count={serviciosFinalizados.length}
            onClick={() => setVistaActual('finalizados')}
          />
          <BotonMenu
            gradient="from-blue-500/80 to-blue-600/80 hover:from-blue-600/90 hover:to-blue-700/90"
            icon="➕"
            titulo="Crear Solicitud"
            onClick={() => setVistaActual('crear')}
          />
        </div>
      </div>
    );
  }

  {/*################################## 4 Tarjetas ##########################################################*/ }

  if (vistaActual === 'asignar') {
    return (
      <div className="max-w-7xl mx-auto w-full">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 transition-colors">
          ← Volver al menú
        </button>

        {cotizacionesAprobadas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg font-semibold">No hay servicios pendientes</p>
            <p className="text-gray-400 text-sm mt-2">Las cotizaciones aprobadas aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Servicios Pendientes ({cotizacionesAprobadas.length})</h2>
              <p className="text-gray-500 text-sm">Selecciona un servicio aprobado para ver detalles y asignar un técnico</p>
            </div>

            {/* Lista de tarjetas en grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {cotizacionesAprobadas.map(cot => (
                <div key={cot.id} className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden transition hover:shadow-md p-5 flex flex-col justify-between">
                  <div className="flex items-start gap-4 mb-4">
                    {cot.foto && (
                      <div className="w-16 h-16 flex-shrink-0">
                        <img
                          src={getSafeUrl(cot.foto)}
                          alt="Preview"
                          onClick={(e) => { e.stopPropagation(); setImagenZoom(getSafeUrl(cot.foto)); }}
                          className="w-full h-full object-cover rounded-lg border border-gray-300 cursor-zoom-in hover:border-blue-500 transition shadow-sm"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">{cot.titulo}</h3>
                      <p className="text-xs text-gray-600 mb-1">
                        👤 <span className="font-semibold">{cot.cliente || cot.usuario}</span>
                      </p>
                      <span className="inline-block px-2 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {cot.tipo.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Precio Aprobado</p>
                      <p className="text-xl font-bold text-green-600">${cot.precio || cot.precioestimado || 'N/A'} {cot.moneda || 'MXN'}</p>
                    </div>

                    <button
                      onClick={() => {
                        setCotizacionSeleccionada(cot);
                        setFormAsignar({ ...formAsignar, cotizacionId: cot.id });
                        setVistaActual('detalle-servicio');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition shadow-sm hover:shadow-md"
                    >
                      Asignar Técnico
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista de Detalle de Servicio (Pantalla Completa)
  if (vistaActual === 'detalle-servicio' && cotizacionSeleccionada) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-100">
        {/* Header fijo */}
        <div className="bg-gray-100 shrink-0">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => {
                setVistaActual('asignar');
                setCotizacionSeleccionada(null);
                setFormAsignar({ cotizacionId: '', tecnicoId: '', fechaServicio: '', horaServicio: '', notas: '' });
              }}
              className="text-gray-600 hover:text-gray-700 font-semibold flex items-center gap-2 transition text-sm"
            >
              ← Volver a la lista
            </button>

            <button
              onClick={() => handleEliminarServicio(cotizacionSeleccionada.id)}
              className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition text-sm px-3 py-1.5 rounded-lg hover:bg-red-50"
              title="Eliminar este servicio"
            >
              🗑️ Eliminar Servicio
            </button>
          </div>
        </div>

        {/* Contenido principal en 2 columnas */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-6 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              {/* Columna izquierda: Información del servicio (2/3) */}
              <div className="lg:col-span-2 h-full overflow-auto pr-2">
                <div className="space-y-6">
                  {/* Header del servicio */}
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{cotizacionSeleccionada.titulo}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <span className="text-blue-600">👤</span> {cotizacionSeleccionada.cliente || cotizacionSeleccionada.usuario}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold capitalize">
                        {cotizacionSeleccionada.tipo.replace(/_/g, ' ')}
                      </span>
                      <span className="ml-auto text-4xl font-bold text-green-600">
                        ${cotizacionSeleccionada.precio || cotizacionSeleccionada.precioestimado || 'N/A'} {cotizacionSeleccionada.moneda || 'MXN'}
                      </span>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Grid de Datos Completos */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <InfoItem label="Dirección" value={cotizacionSeleccionada.direccion} icon="📍" />
                      <InfoItem label="Teléfono / Contacto" value={cotizacionSeleccionada.telefono} icon="📞" />
                      <InfoItem label="ID Sistema" value={cotizacionSeleccionada.id} icon="🆔" />
                    </div>

                    {/* SECCIÓN 1: Solicitud Original del Cliente */}
                    <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
                      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                          <span>1️⃣</span> Solicitud Original del Cliente
                        </h4>
                      </div>
                      <div className="p-5 space-y-4">
                        {/* Descripción */}
                        {cotizacionSeleccionada.descripcion ? (
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Descripción del problema</div>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{cotizacionSeleccionada.descripcion}</p>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm italic">Sin descripción proporcionada.</p>
                        )}

                        {/* Archivos del Cliente */}
                        {(cotizacionSeleccionada.foto || (cotizacionSeleccionada.pdfs && cotizacionSeleccionada.pdfs.length > 0)) && (
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Archivos Adjuntos</div>
                            <div className="flex flex-wrap gap-3">
                              {cotizacionSeleccionada.foto && (
                                <div
                                  onClick={() => setImagenZoom(getSafeUrl(cotizacionSeleccionada.foto))}
                                  className="group relative h-20 w-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in hover:shadow-md transition-all"
                                >
                                  <img
                                    src={getSafeUrl(cotizacionSeleccionada.foto)}
                                    alt="Evidencia"
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <span className="bg-white/90 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all">Ver Foto</span>
                                  </div>
                                </div>
                              )}
                              
                              {cotizacionSeleccionada.pdfs?.map((pdfUrl, idx) => (
                                <a 
                                  key={idx} 
                                  href={getSafeUrl(pdfUrl)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="h-20 w-32 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl flex flex-col items-center justify-center text-gray-600 hover:text-red-600 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                >
                                  <span className="text-xl group-hover:scale-110 transition">📄</span>
                                  <span className="text-[10px] font-bold mt-1 text-center truncate w-full px-2">PDF {idx + 1}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECCIÓN 2: Cotización de Infiniguard */}
                    {(cotizacionSeleccionada.respuestacotizacion || cotizacionSeleccionada.pdfcotizacion) && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl overflow-hidden">
                        <div className="bg-blue-100/50 border-b border-blue-200 px-5 py-3">
                          <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide flex items-center gap-2">
                            <span>2️⃣</span> Cotización Enviada (Infiniguard)
                          </h4>
                        </div>
                        <div className="p-5 space-y-4">
                          {cotizacionSeleccionada.respuestacotizacion && (
                            <div>
                              <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">Notas de Cotización</div>
                              <p className="text-blue-900 text-sm leading-relaxed whitespace-pre-wrap">{cotizacionSeleccionada.respuestacotizacion}</p>
                            </div>
                          )}

                          {/* PDFs de Respuesta de Cotización */}
                          {(() => {
                              let pdfsRespuesta = [];
                              if (cotizacionSeleccionada.pdfcotizacion) {
                                  try {
                                      pdfsRespuesta = JSON.parse(cotizacionSeleccionada.pdfcotizacion);
                                      if (!Array.isArray(pdfsRespuesta)) pdfsRespuesta = [cotizacionSeleccionada.pdfcotizacion];
                                  } catch (e) {
                                      pdfsRespuesta = [cotizacionSeleccionada.pdfcotizacion];
                                  }
                              }
                              if (pdfsRespuesta.length === 0) return null;

                              return (
                                <div>
                                  <div className="text-[10px] font-bold text-blue-400 uppercase mb-2">Documentos Adjuntos</div>
                                  <div className="flex flex-wrap gap-3">
                                    {pdfsRespuesta.map((pdfUrl, idx) => {
                                      const rawName = pdfUrl.split('/').pop() || `Doc_${idx+1}.pdf`;
                                      const displayName = rawName.includes('-') ? rawName.split('-').slice(1).join('-') : rawName;
                                      return (
                                        <a 
                                          key={`resp-pdf-${idx}`} 
                                          href={getSafeUrl(pdfUrl)} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="h-20 max-w-[160px] px-3 bg-white hover:bg-blue-100 border border-blue-200 rounded-xl flex flex-col items-center justify-center text-blue-600 hover:text-blue-800 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                          title={displayName}
                                        >
                                          <span className="text-xl group-hover:scale-110 transition">📑</span>
                                          <span className="text-[10px] font-bold mt-1 text-center truncate w-full">{displayName}</span>
                                        </a>
                                      )
                                    })}
                                  </div>
                                </div>
                              );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* SECCIÓN 3: Respuestas del Cliente */}
                    {(() => {
                        let preguntasArr = [];
                        if (cotizacionSeleccionada.preguntas_cotizacion) {
                            try {
                                preguntasArr = typeof cotizacionSeleccionada.preguntas_cotizacion === 'string'
                                    ? JSON.parse(cotizacionSeleccionada.preguntas_cotizacion)
                                    : cotizacionSeleccionada.preguntas_cotizacion;
                            } catch (e) {
                                console.error("Error parseando preguntas", e);
                            }
                        }

                        if (!Array.isArray(preguntasArr) || preguntasArr.length === 0) return null;

                        return (
                          <div className="bg-green-50 border-2 border-green-200 rounded-2xl overflow-hidden">
                            <div className="bg-green-100/50 border-b border-green-200 px-5 py-3">
                              <h4 className="text-sm font-bold text-green-800 uppercase tracking-wide flex items-center gap-2">
                                <span>3️⃣</span> Respuestas del Cliente
                              </h4>
                            </div>
                            <div className="p-5 space-y-4">
                              {preguntasArr.map((item, index) => (
                                <div key={index} className="bg-white border border-green-100 rounded-xl p-4 shadow-sm">
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="text-green-500 font-bold mt-0.5">Q:</span>
                                    <p className="text-sm font-semibold text-gray-800">{item.pregunta}</p>
                                  </div>
                                  <div className="flex items-start gap-2 bg-green-50/50 p-3 rounded-lg">
                                    <span className="text-blue-500 font-bold mt-0.5">A:</span>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.respuesta || <span className="text-gray-400 italic">Sin responder</span>}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                    })()}
                  </div>
                </div>
              </div>

              {/* Columna derecha: Formulario de asignación (1/3) */}
              <div className="lg:col-span-1 border-2 border-gray-400 rounded-xl p-4 h-full overflow-auto h-[calc(100vh-80px)]">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">👤 Asignar Técnico</h3>
                    <p className="text-sm text-gray-500">Completa la información del servicio</p>
                  </div>

                  <hr className="border-gray-100" />

                  <form onSubmit={handleAsignar} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Técnico Responsable *</label>
                      <select
                        value={formAsignar.tecnicoId}
                        onChange={(e) => setFormAsignar({ ...formAsignar, tecnicoId: e.target.value })}
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
                        <DatePicker
                          selected={formAsignar.fechaServicio ? new Date(`${formAsignar.fechaServicio}T00:00:00`) : null}
                          onChange={(date) => setFormAsignar({ ...formAsignar, fechaServicio: date ? format(date, 'yyyy-MM-dd') : '' })}
                          dateFormat="yyyy-MM-dd"
                          locale="es"
                          placeholderText="Selecciona la fecha..."
                          className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-300 bg-white cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Hora *</label>
                        <DatePicker
                          selected={formAsignar.horaServicio ? new Date(`1970-01-01T${formAsignar.horaServicio}:00`) : null}
                          onChange={(time) => setFormAsignar({ ...formAsignar, horaServicio: time ? format(time, 'HH:mm') : '' })}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={15}
                          timeCaption="Hora"
                          dateFormat="HH:mm"
                          placeholderText="--:--"
                          className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-300 bg-white cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Instrucciones</label>
                      <textarea
                        value={formAsignar.notas}
                        onChange={(e) => setFormAsignar({ ...formAsignar, notas: e.target.value })}
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
      </div>
    );
  }

  {/* Servicios en Curso */ }
  {/* Servicios en Curso */ }
  if (vistaActual === 'en-curso') {
    return (
      <div className="max-w-7xl mx-auto w-full h-screen overflow-hidden flex flex-col p-6">
        <button onClick={() => setVistaActual('menu')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 transition-colors">
          ← Volver al menú
        </button>

        <div className="mb-0">


        </div>

        {serviciosEnCurso.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">⚙️</div>
            <p className="text-gray-500 text-lg font-semibold">No hay servicios en curso</p>
            <p className="text-gray-400 text-sm mt-2">Los servicios asignados aparecerán aquí</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
              {serviciosEnCurso.map(serv => (
                <div key={serv.id} className="bg-white border-2 border-purple-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 pr-2">{serv.titulo}</h3>
                        <button onClick={() => handleEliminarServicio(serv.id)} className="text-gray-400 hover:text-red-500 transition text-lg mt-0.5 shrink-0" title="Eliminar servicio">🗑️</button>
                      </div>
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full uppercase">
                        {serv.tipo?.replace(/_/g, ' ') || 'Servicio'}
                      </span>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-2xl font-bold text-green-600">${serv.precio || serv.precioestimado || 'N/A'} {serv.moneda || 'MXN'}</div>
                      <div className="text-[10px] text-gray-400 uppercase">Precio</div>
                    </div>
                  </div>

                  {/* Datos principales */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-600">👤</span>
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-semibold text-gray-900 truncate">{serv.cliente || serv.usuario}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-purple-600">🔧</span>
                      <span className="text-gray-600">Técnico:</span>
                      <span className="font-semibold text-purple-700 truncate">{serv.tecnicoasignado}</span>
                    </div>

                    {serv.direccion && (
                      <div className="flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5">📍</span>
                        <span className="text-gray-600">Dirección:</span>
                        <span className="text-gray-700 text-xs line-clamp-2 flex-1">{serv.direccion}</span>
                      </div>
                    )}

                    {serv.telefono && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">📞</span>
                        <span className="text-gray-600">Teléfono:</span>
                        <span className="font-medium text-gray-900">{serv.telefono}</span>
                      </div>
                    )}

                    {(serv.fechaServicio || serv.horaServicio) && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-blue-600">📅</span>
                        <span className="text-gray-600">Programado:</span>
                        <span className="font-medium text-gray-900">
                          {serv.fechaServicio} {serv.horaServicio && `• ${serv.horaServicio}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Descripción */}
                  {serv.descripcion && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
                      <div className="text-[10px] font-bold text-gray-600 uppercase mb-1">Descripción</div>
                      <p className="text-xs text-gray-700 line-clamp-3">{serv.descripcion}</p>
                    </div>
                  )}

                  {/* Archivos del cliente */}
                  {(serv.fotos?.length > 0 || serv.pdfs?.length > 0) && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-3">
                      <div className="text-[10px] font-bold text-blue-600 uppercase mb-2">📎 Archivos del Cliente</div>
                      <div className="space-y-1 flex flex-col items-start gap-1">
                        {serv.fotos?.length > 0 && serv.fotos.map((foto, idx) => (
                          <a
                            key={`foto-${idx}`}
                            href={getSafeUrl(foto)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            🖼️ Ver imagen {serv.fotos.length > 1 ? idx + 1 : ''}
                          </a>
                        ))}
                        {serv.pdfs?.length > 0 && serv.pdfs.map((pdfUrl, idx) => (
                          <a
                            key={`pdf-${idx}`}
                            href={getSafeUrl(pdfUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            📄 Ver PDF {serv.pdfs.length > 1 ? idx + 1 : ''}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cotización del Admin */}
                  {(serv.respuestacotizacion || serv.pdfcotizacion) && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200 mb-3">
                      <div className="text-[10px] font-bold text-green-600 uppercase mb-2">💬 Cotización Admin</div>
                      {serv.respuestacotizacion && (
                        <p className="text-xs text-gray-700 mb-2 line-clamp-3">{serv.respuestacotizacion}</p>
                      )}
                      {serv.pdfcotizacion && (
                        <a
                          href={serv.pdfcotizacion}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                        >
                          📄 Ver PDF de cotización
                        </a>
                      )}
                    </div>
                  )}

                  {/* Notas de asignación */}
                  {serv.notas && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <div className="text-[10px] font-bold text-purple-600 uppercase mb-1">Notas de Asignación</div>
                      <p className="text-xs text-gray-700 line-clamp-3">{serv.notas}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  {/*Vista de servicios finalizados*/ }
  if (vistaActual === 'finalizados') {
    return (
      <div className="max-w-7xl mx-auto w-full h-screen overflow-hidden flex flex-col p-6">
        <button onClick={() => setVistaActual('menu')} className="mb-4 text-gray-600 hover:text-gray-700 font-semibold flex items-center gap-2 transition-colors">
          ← Volver al menú
        </button>

        <div className="mb-1">
          <p className="text-gray-500 text-sm">{serviciosFinalizados.length} servicio{serviciosFinalizados.length !== 1 ? 's' : ''} completado{serviciosFinalizados.length !== 1 ? 's' : ''}</p>
        </div>

        {serviciosFinalizados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-gray-500 text-lg font-semibold">No hay servicios finalizados</p>
            <p className="text-gray-400 text-sm mt-2">Los servicios completados aparecerán aquí</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
              {serviciosFinalizados.map(serv => (
                <div key={serv.id} className="bg-white border-2 border-green-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">✅</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
                            Completado
                          </span>
                        </div>
                        <button onClick={() => handleEliminarServicio(serv.id)} className="text-gray-400 hover:text-red-500 transition text-lg" title="Eliminar servicio">🗑️</button>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{serv.titulo}</h3>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full uppercase">
                        {serv.tipo?.replace(/_/g, ' ') || 'Servicio'}
                      </span>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-2xl font-bold text-green-600">${serv.precio || serv.precioestimado || 'N/A'} {serv.moneda || 'MXN'}</div>
                      <div className="text-[10px] text-gray-400 uppercase">Precio</div>
                    </div>
                  </div>

                  {/* Datos principales */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-600">👤</span>
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-semibold text-gray-900 truncate">{serv.cliente || serv.usuario}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">🔧</span>
                      <span className="text-gray-600">Completado por:</span>
                      <span className="font-semibold text-green-700 truncate">{serv.tecnicoasignado}</span>
                    </div>

                    {serv.direccion && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-orange-600 mt-0.5">📍</span>
                        <span className="text-gray-600">Dirección:</span>
                        <span className="text-gray-700 flex-1">{serv.direccion}</span>
                      </div>
                    )}

                    {serv.telefono && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">📞</span>
                        <span className="text-gray-600">Teléfono:</span>
                        <span className="font-medium text-gray-900">{serv.telefono}</span>
                      </div>
                    )}

                    {serv.fecha && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-blue-600">📅</span>
                        <span className="text-gray-600">Fecha:</span>
                        <span className="font-medium text-gray-900">{serv.fecha}</span>
                      </div>
                    )}
                  </div>

                  {/* Notas */}
                  {serv.notas && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <div className="text-[10px] font-bold text-green-600 uppercase mb-1">Notas</div>
                      <p className="text-xs text-gray-700 line-clamp-3">{serv.notas}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  {/*Vista de creacion de servicios para el tecnico*/ }
  if (vistaActual === 'crear') {
    return (
      <div className="max-w-7xl mx-auto w-full h-screen overflow-hidden flex flex-col">
        <button onClick={() => setVistaActual('menu')} className="mb-3 text-gray-600 hover:text-gray-700 font-semibold flex items-center gap-2 transition-colors">
          ← Volver al menú
        </button>

        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-800">➕ Crear Solicitud Directa</h1>
          <p className="text-gray-500 text-xs">Crear servicio sin cotización previa para el tecnico</p>
        </div>

        <div className="flex-1 overflow-auto h-screen">
          <form onSubmit={handleCrear} className="bg-gray-100 rounded-xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Tipo de Servicio */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Tipo *</label>
                <select
                  value={formCrear.tipo}
                  onChange={(e) => setFormCrear({ ...formCrear, tipo: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="servicio_general">⚙️ Servicio General</option>
                  <option value="instalacion">🔧 Instalación</option>
                  <option value="mantenimiento">🛠️ Mantenimiento</option>
                  <option value="reparacion">🔨 Reparación</option>
                </select>
              </div>

              {/* Técnico */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Técnico *</label>
                <select
                  value={formCrear.tecnicoId}
                  onChange={(e) => setFormCrear({ ...formCrear, tecnicoId: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecciona técnico</option>
                  {tecnicos.map(tec => (
                    <option key={tec.id} value={tec.id}>{tec.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Precio</label>
                <input
                  type="number"
                  value={formCrear.precio}
                  onChange={(e) => setFormCrear({ ...formCrear, precio: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Título - Ocupa 3 columnas */}
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Título del Servicio *</label>
                <input
                  type="text"
                  value={formCrear.titulo}
                  onChange={(e) => setFormCrear({ ...formCrear, titulo: e.target.value })}
                  placeholder="Ej: Instalación de equipo urgente"
                  className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Cliente *</label>
                <input
                  type="text"
                  value={formCrear.cliente}
                  onChange={(e) => setFormCrear({ ...formCrear, cliente: e.target.value })}
                  placeholder="Nombre del cliente"
                  className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Teléfono</label>
                <input
                  type="tel"
                  value={formCrear.telefono}
                  onChange={(e) => setFormCrear({ ...formCrear, telefono: e.target.value })}
                  placeholder="Teléfono"
                  className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* PDF */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">PDF Cotización</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setArchivoPDF(e.target.files[0])}
                  className="w-full px-2 py-1 text-xs border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Dirección - Ocupa 3 columnas */}
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Dirección</label>
                <input
                  type="text"
                  value={formCrear.direccion}
                  onChange={(e) => setFormCrear({ ...formCrear, direccion: e.target.value })}
                  placeholder="Dirección del servicio"
                  className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Fecha Servicio</label>
                <input
                  type="date"
                  value={formCrear.fechaServicio}
                  onChange={(e) => setFormCrear({ ...formCrear, fechaServicio: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Hora */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Hora Servicio</label>
                <input
                  type="time"
                  value={formCrear.horaServicio}
                  onChange={(e) => setFormCrear({ ...formCrear, horaServicio: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Espacio vacío para mantener el grid */}
              <div></div>

              {/* Notas - Ocupa 3 columnas */}
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Notas / Descripción</label>
                <textarea
                  value={formCrear.notas}
                  onChange={(e) => setFormCrear({ ...formCrear, notas: e.target.value })}
                  placeholder="Detalles del servicio..."
                  rows="2"
                  className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Botón de envío - Ocupa 3 columnas */}
              <div className="md:col-span-3 ">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? 'Creando...' : '✅ Crear y Asignar Servicio'}
                </button>
              </div>
            </div>
          </form>
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
              src={getSafeUrl(imagenZoom)}
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
