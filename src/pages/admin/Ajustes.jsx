import React, { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API_URL from '../../config/api';

function Ajustes() {
  const API_BASE = API_URL;
  const [exportandoDb, setExportandoDb] = useState(false);
  const [importandoDb, setImportandoDb] = useState(false);
  const [reiniciandoDb, setReiniciandoDb] = useState(false);
  const [encuestas, setEncuestas] = useState([]);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);
  const [cargandoEncuestas, setCargandoEncuestas] = useState(true);
  const importFileRef = useRef(null);

  // Cargar encuestas al montar el componente
  useEffect(() => {
    cargarEncuestas();
  }, []);

  const cargarEncuestas = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/encuestas`);
      const data = await res.json();
      if (data.success) {
        setEncuestas(data.encuestas);
      }
    } catch (error) {
      console.error('Error cargando encuestas:', error);
    } finally {
      setCargandoEncuestas(false);
    }
  };

  const verDetalleEncuesta = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/encuestas/${id}`);
      const data = await res.json();
      if (data.success) {
        setEncuestaSeleccionada(data.encuesta);
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
      toast.error('Error al cargar detalles de la encuesta');
    }
  };

  const cerrarDetalle = () => {
    setEncuestaSeleccionada(null);
  };

  const getNivelColor = (nivel) => {
    const colores = {
      'Inicial': 'bg-red-100 text-red-800 border-red-300',
      'Básico': 'bg-orange-100 text-orange-800 border-orange-300',
      'En Desarrollo': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Avanzado': 'bg-blue-100 text-blue-800 border-blue-300',
      'Best in Class': 'bg-green-100 text-green-800 border-green-300'
    };
    return colores[nivel] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getDiagnostico = (nivel) => {
    const diagnosticos = {
      'Inicial': 'Requiere atención urgente en múltiples áreas. Se recomienda priorizar las categorías con menor puntuación.',
      'Básico': 'Fundamentos establecidos, pero necesita desarrollo significativo. Enfocarse en áreas críticas del negocio.',
      'En Desarrollo': 'Progreso significativo alcanzado. Continuar mejorando procesos y sistemas para alcanzar excelencia.',
      'Avanzado': 'Operación sólida con buenas prácticas implementadas. Optimizar áreas específicas para llegar a best in class.',
      'Best in Class': 'Excelencia operativa alcanzada. Mantener prácticas actuales y compartir conocimiento con la industria.'
    };
    return diagnosticos[nivel] || 'Evaluación en proceso';
  };

  const handleExportarDb = async () => {
    setExportandoDb(true);
    try {
      const res = await fetch(`${API_BASE}/api/db/export?includePasswords=true`);
      if (!res.ok) throw new Error('No se pudo exportar (backend no soporta o no está actualizado)');

      const data = await res.json();
      const snapshot = data?.snapshot;
      if (!data?.success || !snapshot) throw new Error('Respuesta inválida del servidor');

      const fecha = new Date();
      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const dd = String(fecha.getDate()).padStart(2, '0');
      const filename = `infiniguard-backup-${yyyy}-${mm}-${dd}.json`;

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('✅ Backup descargado');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Error al exportar backup');
    } finally {
      setExportandoDb(false);
    }
  };

  const handleClickImportarDb = () => {
    importFileRef.current?.click();
  };

  const handleImportarDbFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportandoDb(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const snapshot = parsed?.snapshot || parsed;

      const res = await fetch(`${API_BASE}/api/db/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || 'No se pudo importar el backup');

      toast.success('✅ Backup importado');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Error al importar backup');
    } finally {
      setImportandoDb(false);
      e.target.value = '';
    }
  };

  const handleReiniciarDb = async () => {
    const confirmacion1 = confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS los servicios de la base de datos.\n\n¿Estás seguro de continuar?');
    if (!confirmacion1) return;

    const confirmacion2 = confirm('🚨 ÚLTIMA CONFIRMACIÓN:\n\nEsta acción NO se puede deshacer.\nSe eliminarán todos los servicios permanentemente.\n\n¿Confirmar reinicio de base de datos?');
    if (!confirmacion2) return;

    setReiniciandoDb(true);
    try {
      const res = await fetch(`${API_BASE}/api/db/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Error al reiniciar la base de datos');

      toast.success('✅ Base de datos reiniciada correctamente');

      // Recargar la página después de 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Error al reiniciar la base de datos');
    } finally {
      setReiniciandoDb(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full h-screen overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Ajustes</h1>
        <p className="text-gray-500 text-sm">Configuración y respaldo de datos</p>
      </div>

      {/* Sección de Estadísticas de Encuestas */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">📊 Estadísticas de Encuestas HVACR</h2>
            <p className="text-sm text-gray-500">Resultados de diagnósticos empresariales</p>
          </div>
          <button
            onClick={cargarEncuestas}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            🔄 Actualizar
          </button>
        </div>

        {cargandoEncuestas ? (
          <div className="text-center py-8 text-gray-500">Cargando encuestas...</div>
        ) : encuestas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay encuestas registradas aún
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {encuestas.map((encuesta) => (
              <div
                key={encuesta.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-sm mb-1">{encuesta.nombre}</h3>
                    <p className="text-xs text-gray-500">{encuesta.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getNivelColor(encuesta.nivel)}`}>
                    {encuesta.nivel}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Puntuación</span>
                    <span className="text-lg font-bold text-blue-600">{encuesta.puntuacionTotal}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${encuesta.puntuacionTotal}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>📅 {new Date(encuesta.fecha).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => verDetalleEncuesta(encuesta.id)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold text-sm transition"
                >
                  Ver Detalles
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {encuestaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarDetalle}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{encuestaSeleccionada.nombre}</h2>
                <p className="text-sm text-gray-500">{encuestaSeleccionada.email}</p>
              </div>
              <button
                onClick={cerrarDetalle}
                className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Resumen General */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Puntuación General</h3>
                    <p className="text-sm text-gray-600">Nivel de Madurez Empresarial</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-600">{encuestaSeleccionada.puntuacionTotal}/100</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border mt-2 ${getNivelColor(encuestaSeleccionada.nivel)}`}>
                      {encuestaSeleccionada.nivel}
                    </span>
                  </div>
                </div>
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Diagnóstico:</strong> {getDiagnostico(encuestaSeleccionada.nivel)}
                  </p>
                </div>
              </div>

              {/* Puntuaciones por Categoría */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Puntuaciones por Categoría</h3>
                <div className="space-y-3">
                  {encuestaSeleccionada.puntuacionesPorCategoria?.map((cat, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800 text-sm">{cat.categoria}</span>
                        <span className="font-bold text-blue-600">{cat.puntuacion}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${cat.puntuacion >= 80 ? 'bg-green-500' :
                              cat.puntuacion >= 60 ? 'bg-blue-500' :
                                cat.puntuacion >= 40 ? 'bg-yellow-500' :
                                  cat.puntuacion >= 20 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${cat.puntuacion}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recomendaciones */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">💡 Recomendaciones</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {encuestaSeleccionada.puntuacionesPorCategoria
                    ?.sort((a, b) => a.puntuacion - b.puntuacion)
                    .slice(0, 3)
                    .map((cat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span>
                          <strong>{cat.categoria}:</strong> Priorizar mejoras en esta área (Puntuación actual: {cat.puntuacion}/100)
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sección de Respaldo */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Respaldo de datos</h2>
            <p className="text-sm text-gray-500">Exporta/Importa usuarios y servicios en un archivo JSON</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportarDb}
              disabled={exportandoDb || importandoDb || reiniciandoDb}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold"
            >
              {exportandoDb ? 'Exportando...' : '⬇️ Exportar'}
            </button>
            <button
              onClick={handleClickImportarDb}
              disabled={exportandoDb || importandoDb || reiniciandoDb}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold"
            >
              {importandoDb ? 'Importando...' : '⬆️ Importar'}
            </button>
            <input
              ref={importFileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportarDbFile}
            />
          </div>
        </div>
      </div>

      {/* Sección de Zona Peligrosa */}
      <div className="bg-red-50 rounded-xl shadow-md p-6 border-2 border-red-200">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
              ⚠️ Zona Peligrosa
            </h2>
            <p className="text-sm text-red-600">
              Reiniciar la base de datos eliminará <strong>TODOS los servicios</strong> permanentemente
            </p>
          </div>

          <button
            onClick={handleReiniciarDb}
            disabled={exportandoDb || importandoDb || reiniciandoDb}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold shadow-lg"
          >
            {reiniciandoDb ? 'Reiniciando...' : '🗑️ Reiniciar Base de Datos'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Ajustes;
