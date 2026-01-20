import React, { useState } from 'react';
import CotizacionForm from '../../components/forms/CotizacionForm.jsx';

function NuevaSolicitud() {
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');

  const tipos = [
    { id: 'Mantenimiento', label: 'Mantenimiento', icon: '🛠️', descripcion: 'Solicitar Mantenimiento' },
    { id: 'Servicio Industrial', label: 'Recubrimientos', icon: '🛡️', descripcion: 'Solicitar servicio de recubrimiento' },
    { id: 'Extensión', label: 'Garantías', icon: '📋', descripcion: 'Solicitar extensión de garantía' },
  ];

  // Si ya seleccionó un tipo, mostrar el formulario
  if (tipoSeleccionado) {
    const tipoInfo = tipos.find(t => t.id === tipoSeleccionado);
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setTipoSeleccionado('')}
          className="mb-4 text-blue-600 font-medium flex items-center gap-2"
        >
          ← Cambiar tipo de solicitud
        </button>
        <CotizacionForm
          titulo={`Cotización de ${tipoInfo.label}`}
          tipoServicio={tipoSeleccionado}
        />
      </div>
    );
  }

  // Si no ha seleccionado, mostrar opciones
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nueva Solicitud</h1>
        <p className="text-gray-500 text-sm">Selecciona el tipo de solicitud que deseas crear</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tipos.map((tipo) => (
          <button
            key={tipo.id}
            onClick={() => setTipoSeleccionado(tipo.id)}
            className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">{tipo.icon}</div>
            <h3 className="font-bold text-gray-800 mb-1">{tipo.label}</h3>
            <p className="text-xs text-gray-500">{tipo.descripcion}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default NuevaSolicitud;
