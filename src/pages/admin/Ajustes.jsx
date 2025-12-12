import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';

function Ajustes() {
  const API_BASE = 'https://infiniguardsys-production.up.railway.app';
  const [exportandoDb, setExportandoDb] = useState(false);
  const [importandoDb, setImportandoDb] = useState(false);
  const importFileRef = useRef(null);

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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">⚙️ Ajustes</h1>
        <p className="text-gray-500 text-sm">Configuración y respaldo de datos</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-gray-800">🗄️ Respaldo de datos</h2>
            <p className="text-sm text-gray-500">Exporta/Importa usuarios y servicios en un archivo JSON</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportarDb}
              disabled={exportandoDb || importandoDb}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold"
            >
              {exportandoDb ? 'Exportando...' : '⬇️ Exportar'}
            </button>
            <button
              onClick={handleClickImportarDb}
              disabled={exportandoDb || importandoDb}
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
    </div>
  );
}

export default Ajustes;
