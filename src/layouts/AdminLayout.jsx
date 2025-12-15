import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import CELLS from 'vanta/dist/vanta.cells.min.js';
import Avatar from '../components/ui/Avatar';

const AdminLayout = () => {
  const location = useLocation();
  const vantaRef = useRef(null);
  const vantaInstanceRef = useRef(null);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Cargar usuario
    const userGuardado = JSON.parse(sessionStorage.getItem('user'));
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

  // Las opciones basadas en TU diagrama
  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      )
    },
    { 
      name: 'Cotizaciones', 
      path: '/admin/cotizaciones',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      name: 'Servicios', 
      path: '/admin/servicios',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 7.293a1 1 0 010 1.414l-8.586 8.586a2 2 0 01-2.828 0l-1.172-1.172a2 2 0 010-2.828l8.586-8.586a1 1 0 011.414 0l2.586 2.586a1 1 0 010 1.414l-1.293 1.293 1.293 1.293z" />
        </svg>
      )
    },
    { 
      name: 'Comisiones', 
      path: '/admin/comisiones',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      name: 'Usuarios', 
      path: '/admin/usuarios',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      )
    },
    { 
      name: 'Ajustes', 
      path: '/admin/ajustes',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      )
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* 1. SIDEBAR (Barra Lateral) con Vanta.js */}
      <aside ref={vantaRef} className="w-64 hidden md:flex flex-col relative overflow-hidden">
        
        {/* Overlay para mejorar legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950 via-transparent to-blue-950 bg-opacity-40 pointer-events-none z-0"></div>

        {/* Contenido del sidebar */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo o Título */}
          <div className="h-16 flex items-center justify-center mb-2">
            <h2 className="text-xl font-bold text-white tracking-wide drop-shadow-[0_2px_8px_rgba(37,99,235,0.5)]">INFINIGUARD ADMIN</h2>
          </div>

          {/* Perfil del Usuario */}
          {usuario && (
            <div className="px-4 py-3 mb-2">
              <div className="bg-blue-500 bg-opacity-20 backdrop-blur-sm border border-blue-400 border-opacity-30 rounded-lg p-3 flex items-center gap-3">
                <Avatar name={usuario.nombre} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{usuario.nombre}</p>
                  <p className="text-blue-200 text-xs truncate">{usuario.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Menú de Navegación */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-blue-500 bg-opacity-30 text-white font-semibold shadow-lg shadow-blue-500/20 backdrop-blur-sm border border-blue-400 border-opacity-20'
                        : 'text-blue-100 hover:bg-blue-500 hover:bg-opacity-20 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Botón Salir */}
          <div className="p-4">
            <button 
              onClick={() => {
                sessionStorage.removeItem('user');
                window.location.href = '/';
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA DE CONTENIDO (Aquí cambia lo que ves) */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 md:hidden">
            {/* Header móvil simple */}
            <span className="font-bold text-gray-700">Menú</span>
        </header>
        
        <div className="p-8">
            {/* <Outlet /> es el hueco donde se renderiza la página hija (ej. DashboardAdmin) */}
            <Outlet />
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;