import React, { useState } from 'react';

// Modal animado para mensajes
function ModalMensaje({ show, tipo, mensaje, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40">
      <div className={`animate-bounceInDown bg-white rounded-xl shadow-lg px-8 py-6 flex flex-col items-center border-2 ${tipo === 'success' ? 'border-green-400' : 'border-red-400'}`}
        style={{ minWidth: 280 }}>
        <div className="text-4xl mb-2">
          {tipo === 'success' ? '✅' : '❌'}
        </div>
        <div className={`text-lg font-bold mb-2 ${tipo === 'success' ? 'text-green-700' : 'text-red-700'}`}>{mensaje}</div>
        <button onClick={onClose} className="mt-2 px-4 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm">Cerrar</button>
      </div>
      <style>{`
        @keyframes bounceInDown {
          0% { opacity: 0; transform: translateY(-200px); }
          60% { opacity: 1; transform: translateY(30px); }
          80% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }
        .animate-bounceInDown { animation: bounceInDown 0.7s cubic-bezier(.68,-0.55,.27,1.55); }
      `}</style>
    </div>
  );
}


// Componente principal del formulario de cotización
// Recibe como props el título y el tipo de servicio a cotizar
function CotizacionForms2({ titulo, tipoServicio, onSuccess }) {
  const [modal, setModal] = useState({ show: false, tipo: 'success', mensaje: '' });
  // Estado para la vista previa y base64 de la imagen
  const [previewImg, setPreviewImg] = useState(null);
  const [fotoBase64, setFotoBase64] = useState(null);
  // Estado para la vista previa y base64 del PDF
  const [previewPdf, setPreviewPdf] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  // Estado para los datos del formulario (nombre del proyecto, modelo y cantidad)
  const [formDatos, setFormDatos] = useState({
    nombreProyecto: '', // Nombre del proyecto o servicio solicitado
    modelo: '',         // Modelo o especificación (opcional)
    cantidad: 1         // Cantidad solicitada (por defecto 1)
  });



  // Esta función se ejecuta cuando el usuario selecciona una imagen
  // Valida el tamaño, genera una vista previa y la convierte a base64 para enviar
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es muy grande. Máximo 5MB.');
        return;
      }
      setPreviewImg(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImg(null);
    setFotoBase64(null);
  };

  // Esta función se ejecuta cuando el usuario selecciona un archivo PDF
  // Valida el tamaño y muestra una vista previa del archivo
  const handlepdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es muy grande. Máximo 10MB.');
        return;
      }
      setPreviewPdf(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePdf = () => {
    setPreviewPdf(null);
    setPdfBase64(null);
  };

  // Esta función se ejecuta cuando el usuario escribe en los campos del formulario
  // Actualiza el estado formDatos con el nuevo valor
  const handleChange = (e) => {
    setFormDatos({
      ...formDatos,
      [e.target.name]: e.target.value
    });
  };



  // Esta función se ejecuta cuando el usuario envía el formulario
  // Prepara los datos y los envía al backend usando fetch
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    // Obtiene el usuario actual desde sessionStorage (si está logueado)
    const userStorage = sessionStorage.getItem('user');
    const usuario = userStorage ? JSON.parse(userStorage) : null;

    // Construye el objeto con los datos que espera el backend
    const nuevaSolicitud = {
      titulo: formDatos.nombreProyecto, // Nombre del proyecto
      tipo: tipoServicio,               // Tipo de servicio (prop)
      descripcion: formDatos.descripcion, // Descripción del servicio
      cantidad: formDatos.cantidad,     // Cantidad
      foto: fotoBase64 || null,         // Foto en base64 (opcional)
      pdf: pdfBase64 || null,           // PDF en base64 (opcional)
      telefono: usuario ? usuario.telefono : '', // Teléfono del usuario
      direccion: formDatos.direccion, // Dirección del servicio
      usuario: usuario ? usuario.nombre : 'Usuario Desconocido', // Nombre del usuario
    };
    try {
      // Envía los datos al backend usando una petición POST
      const response = await fetch('https://infiniguardsys-production.up.railway.app/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaSolicitud)
      });
      if(response.ok) {
        setModal({ show: true, tipo: 'success', mensaje: '¡Solicitud enviada con éxito!' });
        setFormDatos({ nombreProyecto: '', modelo: '', cantidad: 1 });
        setPreviewImg(null);
        setFotoBase64(null);
        setPreviewPdf(null);
        setPdfBase64(null);
        setTimeout(() => {
          setModal({ show: false, tipo: 'success', mensaje: '' });
          if (onSuccess) onSuccess();
        }, 1800);
      } else {
        setModal({ show: true, tipo: 'error', mensaje: 'Error al enviar la solicitud' });
        setTimeout(() => setModal({ show: false, tipo: 'error', mensaje: '' }), 1800);
      }
    } catch (error) {
      // Si hay un error de red o servidor
      console.error("Error enviando:", error);
      setModal({ show: true, tipo: 'error', mensaje: 'Error al conectar con servidor' });
      setTimeout(() => setModal({ show: false, tipo: 'error', mensaje: '' }), 1800);
    }
  };


  // Renderiza el formulario de cotización
  // Incluye campos para nombre, modelo, cantidad y foto, y un botón para enviar
  return (
    <div className="bg-white rounded-xl  p-0 max-w-2xl mx-auto">
      <ModalMensaje show={modal.show} tipo={modal.tipo} mensaje={modal.mensaje} onClose={() => setModal({ ...modal, show: false })} />
      {/* Encabezado del formulario con título y tipo de servicio */}
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-gray-800">Solicitar Cotización</h2>
        <p className="text-sm text-gray-600 font-medium">{titulo}</p>
      </div>

      {/* Formulario principal */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Campo para el nombre del proyecto */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Proyecto</label>
          <input 
            type="text"
            name="nombreProyecto"
            value={formDatos.nombreProyecto}
            onChange={handleChange}
            placeholder="Ej. Mantenimiento Nave B"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campo para la cantidad solicitada */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad</label>
            <input 
              type="number"
              name="cantidad"
              value={formDatos.cantidad}
              onChange={handleChange}
              min="1"
              placeholder="1"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campo para la direccion del servicio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
            <input 
              type="text"
              name="direccion"
              value={formDatos.direccion}
              onChange={handleChange}
              placeholder="Dirección del servicio"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campo para la descripcion */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
            <input 
              type="text"
              name="descripcion"
              value={formDatos.descripcion}
              onChange={handleChange}
              placeholder="Descripción del servicio solicitado o requerimientos especiales"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campo para subir un archivo PDF */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Archivo PDF</label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition text-center group">
              <input 
                type="file" 
                accept="application/pdf"
                onChange={handlepdfChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {previewPdf ? (
                <div className="relative">
                  <embed src={previewPdf} type="application/pdf" className="h-40 mx-auto rounded-md object-cover shadow-sm" />
                  <button type="button" onClick={handleRemovePdf} className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">✕</button>
                  <p className="text-xs text-green-600 mt-2 font-bold">✅ PDF cargado (Click para cambiar)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl">📄</div>
                  <p className="text-sm text-gray-500 font-medium">
                    Arrastra un archivo PDF aquí o <span className="text-blue-600 group-hover:underline">haz click</span>
                  </p>
                  <p className="text-xs text-gray-400">PDF (Max 10MB)</p>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Foto / Evidencia</label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition text-center group">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {previewImg ? (
                <div className="relative">
                  <img src={previewImg} alt="Vista previa" className="h-40 mx-auto rounded-md object-cover shadow-sm" />
                  <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">✕</button>
                  <p className="text-xs text-green-600 mt-2 font-bold">✅ Imagen cargada (Click para cambiar)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl">📷</div>
                  <p className="text-sm text-gray-500 font-medium">
                    Arrastra una foto aquí o <span className="text-blue-600 group-hover:underline">haz click</span>
                  </p>
                  <p className="text-xs text-gray-400">JPG, PNG (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botón para enviar el formulario */}
        <button 
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]">
          Enviar Solicitud
        </button>
      </form>
    </div>
  );
}


export default CotizacionForms2;

