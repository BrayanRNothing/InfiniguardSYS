import React, { useState } from 'react';

import API_URL from '../../config/api';

function CotizacionForm({ titulo, tipoServicio, onSuccess }) {
  // Estados para archivos REALES
  const [fileFoto, setFileFoto] = useState(null);
  const [filePdf, setFilePdf] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const [formDatos, setFormDatos] = useState({
    nombreProyecto: '',
    modelo: '',
    cantidad: 1,
    direccion: '',
    descripcion: ''
  });

  const handleChange = (e) => setFormDatos({ ...formDatos, [e.target.name]: e.target.value });

  // Maneja el envío del formulario: prepara datos y los envía al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: 'Enviando...', tipo: 'loading' });

    const userStorage = sessionStorage.getItem('user');
    const usuario = userStorage ? JSON.parse(userStorage) : null;

    // USAMOS FORMDATA para soportar archivos
    const formData = new FormData();
    formData.append('titulo', formDatos.nombreProyecto);
    formData.append('tipo', tipoServicio);
    formData.append('descripcion', formDatos.descripcion);
    formData.append('cantidad', formDatos.cantidad);
    formData.append('direccion', formDatos.direccion);
    formData.append('telefono', usuario ? usuario.telefono || '' : '');
    formData.append('usuario', usuario ? usuario.nombre : 'Usuario Externo');
    formData.append('modelo', formDatos.modelo || '');

    // Adjuntar archivos solo si existen
    if (fileFoto) formData.append('foto', fileFoto);
    if (filePdf) formData.append('pdf', filePdf);

    try {
      const response = await fetch(`${API_URL}/api/servicios`, {
        method: 'POST',
        body: formData // El navegador pone los headers automáticamente (multipart/form-data)
      });

      if (response.ok) {
        setMensaje({ texto: '¡Solicitud enviada con éxito! ✅', tipo: 'success' });
        // Resetear formulario
        setFormDatos({ nombreProyecto: '', modelo: '', cantidad: 1, direccion: '', descripcion: '' });
        setFileFoto(null);
        setFilePdf(null);
        setTimeout(() => {
          setMensaje({ texto: '', tipo: '' });
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setMensaje({ texto: 'Error al enviar la solicitud ❌', tipo: 'error' });
      }
    } catch (error) {
      console.error(error);
      setMensaje({ texto: 'Error de conexión con el servidor ⚠️', tipo: 'error' });
    }
  };

  return (
    <div className="bg-white rounded-xl max-w-2xl mx-auto p-4">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-gray-800">Solicitar Cotización</h2>
        <p className="text-sm text-gray-600">{titulo}</p>
      </div>

      {mensaje.texto && (
        <div className={`p-4 mb-4 rounded-lg font-bold text-center ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Nombre del Proyecto</label>
          <input required type="text" name="nombreProyecto" value={formDatos.nombreProyecto} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Cantidad</label>
            <input type="number" name="cantidad" value={formDatos.cantidad} onChange={handleChange} min="1" className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Modelo (Opcional)</label>
            <input type="text" name="modelo" value={formDatos.modelo} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Dirección</label>
          <input required type="text" name="direccion" value={formDatos.direccion} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Descripción</label>
          <textarea required name="descripcion" value={formDatos.descripcion} onChange={handleChange} className="w-full border p-2 rounded h-24" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Foto (Máx 5MB)</label>
            <input type="file" accept="image/*" onChange={(e) => setFileFoto(e.target.files[0])} className="w-full text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">PDF (Máx 10MB)</label>
            <input type="file" accept="application/pdf" onChange={(e) => setFilePdf(e.target.files[0])} className="w-full text-sm" />
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
          Enviar Solicitud
        </button>
      </form>
    </div>
  );
}

export default CotizacionForm;