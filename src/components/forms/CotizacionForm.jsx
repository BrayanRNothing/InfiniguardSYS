import React, { useState } from 'react';

import API_URL from '../../config/api';

function CotizacionForm({ titulo, tipoServicio, onSuccess }) {
  // Estados para archivos REALES
  const [fileImages, setFileImages] = useState([]);
  const [filePdfs, setFilePdfs] = useState([]);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const [formDatos, setFormDatos] = useState({
    nombreProyecto: '',
    modelo: '',
    cantidad: 1,
    direccion: '',
    descripcion: '',
    clienteFinal: '', // Nuevo campo para distribuidores
    telefono: JSON.parse(sessionStorage.getItem('user') || '{}')?.telefono || ''
  });

  const handleChange = (e) => setFormDatos({ ...formDatos, [e.target.name]: e.target.value });

  // Maneja la selección de múltiples imágenes
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setFileImages([...fileImages, ...newImages]);
  };

  // Eliminar imagen
  const removeImage = (index) => {
    const newImages = fileImages.filter((_, i) => i !== index);
    setFileImages(newImages);
  };

  // Maneja la selección de múltiples PDFs
  const handlePdfSelect = (e) => {
    const files = Array.from(e.target.files);
    setFilePdfs([...filePdfs, ...files]);
  };

  // Eliminar PDF
  const removePdf = (index) => {
    const newPdfs = filePdfs.filter((_, i) => i !== index);
    setFilePdfs(newPdfs);
  };

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
    formData.append('telefono', formDatos.telefono);

    // Si es distribuidor, usamos el clienteFinal. Si no, el nombre del usuario logueado.
    const esDistribuidor = usuario?.rol === 'distribuidor';
    formData.append('usuario', usuario ? usuario.nombre : 'Usuario Externo');
    formData.append('cliente', esDistribuidor ? (formDatos.clienteFinal || 'Consumidor Final') : (usuario?.nombre || 'Consumidor Final'));

    formData.append('modelo', formDatos.modelo || '');

    // Adjuntar todas las imágenes
    if (fileImages.length > 0) {
      fileImages.forEach(img => {
        formData.append('foto', img.file);
      });
    }

    if (filePdfs.length > 0) {
      filePdfs.forEach(pdf => {
        formData.append('pdf', pdf);
      });
    }

    try {
      const response = await fetch(`${API_URL}/api/servicios`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setMensaje({ texto: '¡La solicitud ha sido creada y enviada correctamente!', tipo: 'success' });
        // Resetear formulario
        setFormDatos({ nombreProyecto: '', modelo: '', cantidad: 1, direccion: '', descripcion: '', clienteFinal: '', telefono: usuario?.telefono || '' });
        setFileImages([]);
        setFilePdfs([]);
        setTimeout(() => {
          setMensaje({ texto: '', tipo: '' });
          if (onSuccess) onSuccess();
        }, 2500);
      } else {
        setMensaje({ texto: 'No se pudo enviar la solicitud. Verifica los datos.', tipo: 'error' });
      }
    } catch (error) {
      console.error(error);
      setMensaje({ texto: 'No se pudo conectar con el servidor.', tipo: 'error' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-6 relative">
      {/* Modal de Mensaje */}
      {mensaje.texto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center transform transition-all animate-scaleIn">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
              mensaje.tipo === 'success' ? 'bg-green-100 text-green-500' :
              mensaje.tipo === 'error' ? 'bg-red-100 text-red-500' :
              'bg-blue-100 text-blue-500'
            }`}>
              {mensaje.tipo === 'loading' ? (
                <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : mensaje.tipo === 'success' ? (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {mensaje.tipo === 'loading' ? 'Procesando...' : 
               mensaje.tipo === 'success' ? '¡Completado!' : '¡Oops! Algo falló'}
            </h3>
            <p className="text-gray-600 text-sm font-medium mb-2">
              {mensaje.texto}
            </p>

            {mensaje.tipo === 'error' && (
              <button 
                type="button"
                onClick={() => setMensaje({ texto: '', tipo: '' })}
                className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl transition-all active:scale-95"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre del cliente final (Solo distribuidores) */}
        {JSON.parse(sessionStorage.getItem('user'))?.rol === 'distribuidor' && (
          <div>
            <input
              required
              type="text"
              name="clienteFinal"
              value={formDatos.clienteFinal}
              onChange={handleChange}
              placeholder="Nombre del Cliente Final"
              className="w-full bg-gray-100 border-0 p-4 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        )}

        {/* Nombre del proyecto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <input
              required
              type="text"
              name="nombreProyecto"
              value={formDatos.nombreProyecto}
              onChange={handleChange}
              placeholder="Nombre proyecto"
              className="w-full bg-gray-100 border-0 p-4 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <input
              required
              type="tel"
              name="telefono"
              value={formDatos.telefono}
              onChange={handleChange}
              placeholder="Teléfono"
              className="w-full bg-gray-100 border-0 p-4 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <textarea
            required
            name="descripcion"
            value={formDatos.descripcion}
            onChange={handleChange}
            placeholder="Descripción"
            className="w-full bg-gray-100 border-0 p-4 rounded-xl text-gray-800 placeholder-gray-400 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Dirección */}
        <div>
          <input
            required
            type="text"
            name="direccion"
            value={formDatos.direccion}
            onChange={handleChange}
            placeholder="Dirección"
            className="w-full bg-gray-100 border-0 p-4 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Sección Unificada de Archivos Adjuntos */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>📎</span> Archivos Adjuntos
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Botón Imágenes */}
            <label className="flex-1 bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 font-bold py-3 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Añadir Imágenes
              <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            </label>

            {/* Botón PDFs */}
            <label className="flex-1 bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 font-bold py-3 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              Añadir PDFs
              <input type="file" accept="application/pdf" multiple onChange={handlePdfSelect} className="hidden" />
            </label>
          </div>

          {/* Mini Cuadrícula de Archivos */}
          {(fileImages.length > 0 || filePdfs.length > 0) && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              {/* Previews de Imágenes */}
              {fileImages.map((img, index) => (
                <div key={`img-${index}`} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200 bg-gray-50">
                  <img src={img.preview} alt={`preview ${index}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-transform hover:scale-110 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Previews de PDFs */}
              {filePdfs.map((pdf, index) => (
                <div key={`pdf-${index}`} className="relative aspect-square rounded-xl overflow-hidden group border border-red-100 bg-red-50 flex flex-col items-center justify-center p-2 text-center">
                  <svg className="w-8 h-8 text-red-400 mb-1 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[9px] font-bold text-red-800 line-clamp-2 w-full px-1" title={pdf.name}>
                    {pdf.name}
                  </span>
                  
                  <div className="absolute inset-0 bg-red-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() => removePdf(index)}
                      className="bg-white text-red-600 p-2 rounded-full hover:bg-gray-100 transition-transform hover:scale-110 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón Crear Proyecto */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg mt-6"
        >
          Crear Solicitud
        </button>
      </form>
    </div>
  );
}

export default CotizacionForm;