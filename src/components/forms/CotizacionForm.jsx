import React, { useState } from 'react';
import toast from 'react-hot-toast';

function CotizacionForm({ titulo, tipoServicio }) {
  const [preview, setPreview] = useState(null);
  const [fotoBase64, setFotoBase64] = useState(null);
  const [formDatos, setFormDatos] = useState({
    nombreProyecto: '',
    modelo: '',
    cantidad: 1
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es muy grande. Máximo 5MB.');
        return;
      }

      // Crear preview
      setPreview(URL.createObjectURL(file));

      // Convertir a Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    setFormDatos({
      ...formDatos,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Obtener el usuario actual del sessionStorage
    const userStorage = sessionStorage.getItem('user');
    const usuario = userStorage ? JSON.parse(userStorage) : null;
    
    // Preparamos el objeto para enviar al Backend
    const nuevaSolicitud = {
      titulo: formDatos.nombreProyecto,
      tipo: tipoServicio, // Viene de las props (ej: 'equipo')
      usuario: usuario ? usuario.nombre : 'Usuario Desconocido',
      modelo: formDatos.modelo,
      cantidad: formDatos.cantidad,
      foto: fotoBase64 || null // Incluimos la foto en Base64
    };

    try {
      const response = await fetch('https://infiniguardsys-production.up.railway.app/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaSolicitud)
      });
      
      if(response.ok) {
        toast.success('¡Solicitud enviada con éxito!');
        // Limpiar form
        setFormDatos({ nombreProyecto: '', modelo: '', cantidad: 1 });
        setPreview(null);
        setFotoBase64(null);
      } else {
        toast.error('Error al enviar la solicitud');
      }
    } catch (error) {
      console.error("Error enviando:", error);
      toast.error('Error al conectar con servidor');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 max-w-2xl mx-auto">
      
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-gray-800">Solicitar Cotización</h2>
        <p className="text-sm text-blue-600 font-medium">{titulo} - {tipoServicio}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* 1. Nombre del Proyecto */}
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
          {/* 2. Tipo / Modelo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo / Modelo</label>
            <input 
              type="text"
              name="modelo"
              value={formDatos.modelo}
              onChange={handleChange}
              placeholder="Ej. Industrial Heavy Duty"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* 3. Cantidad */}
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

        {/* 4. Subir Foto (Área visual) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Foto / Evidencia</label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition text-center group">
            
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            {preview ? (
              // Si ya subió foto, la mostramos
              <div className="relative">
                <img src={preview} alt="Vista previa" className="h-40 mx-auto rounded-md object-cover shadow-sm" />
                <p className="text-xs text-green-600 mt-2 font-bold">✅ Imagen cargada (Click para cambiar)</p>
              </div>
            ) : (
              // Si no hay foto, mostramos instrucciones
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

        {/* Botón Enviar */}
        <button 
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
        >
          Enviar Solicitud
        </button>

      </form>
    </div>
  );
}

export default CotizacionForm;