import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import CELLS from 'vanta/dist/vanta.cells.min.js';
import Avatar from '../components/ui/Avatar';
import { getUser } from '../utils/authUtils';

const ClienteLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vantaRef = useRef(null);
  const vantaInstanceRef = useRef(null);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Cargar usuario
    const userGuardado = getUser();
    setUsuario(userGuardado);
    if (vantaRef.current && !vantaInstanceRef.current) {
      try {
        vantaInstanceRef.current = CELLS({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 400.00,
          minWidth: 400.00,
          scale: 1.50,
          scaleMobile: 1.00,
          color1: 0x101025,
          color2: 0x35b1f2,
          size: 5.00,
          speed: 0.90
        });
      } catch (error) {
        console.error("Error al iniciar Vanta:", error);
      }
    }

    return () => {
      if (vantaInstanceRef.current) {
        vantaInstanceRef.current.destroy();
        vantaInstanceRef.current = null;
      }
    };
  }, []);

  // Detectar la tab activa desde el hash de clientehome
  const currentTab = new URLSearchParams(location.search).get('tab') || 'home';

  const handleTabChange = (tab) => {
    // Navegar a clientehome y cambiar el tab internamente
    navigate('/usuario');
    // El componente ClienteHome manejará el cambio de tab
    window.dispatchEvent(new CustomEvent('changeClienteTab', { detail: tab }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header ref={vantaRef} className="shadow-lg px-6 py-4 flex justify-between items-center z-10 relative overflow-hidden">
        {/* Overlay para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-transparent to-blue-950 bg-opacity-50 pointer-events-none z-0"></div>

        <div className="relative z-10 flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            {usuario && <Avatar name={usuario.nombre} size="md" />}
            <div>
              <h2 className="text-lg font-bold text-white drop-shadow-[0_2px_8px_rgba(37,99,235,0.5)]">🏠 Portal Usuario</h2>
              {usuario && <p className="text-xs text-blue-200">{usuario.nombre}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20 mb-16">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg pb-safe z-50">
        <div className="max-w-2xl mx-auto px-6 py-2">
          <div className="flex items-center justify-around relative h-16">
            {/* Home */}
            <button
              onClick={() => handleTabChange('home')}
              className={`flex flex-col items-center justify-center gap-1 transition-all p-2 rounded-lg ${currentTab === 'home' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </button>

            {/* Botón central de Crear/Solicitar (flotante) */}
            <button
              onClick={() => handleTabChange('solicitar')}
              className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Ajustes */}
            <button
              onClick={() => handleTabChange('ajustes')}
              className={`flex flex-col items-center justify-center gap-1 transition-all p-2 rounded-lg ${currentTab === 'ajustes' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">Ajustes</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default ClienteLayout;