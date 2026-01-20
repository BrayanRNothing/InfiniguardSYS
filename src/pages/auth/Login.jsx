import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import CELLS from 'vanta/dist/vanta.cells.min.js';
import Register from './Register';
import { getUser, saveUser } from '../../utils/authUtils';

// URL DEL BACKEND (Ajústala si pruebas en local)
import API_URL from '../../config/api';
// const API_URL = 'http://localhost:4000'; 

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const vantaRef = useRef(null);
  const vantaInstanceRef = useRef(null);

  useEffect(() => {
    // Auto-login si hay sesión guardada
    const user = getUser();
    if (user) {
      const { rol } = user;
      switch (rol) {
        case 'admin': navigate('/admin'); break;
        case 'tecnico': navigate('/tecnico'); break;
        case 'distribuidor': navigate('/distribuidor'); break;
        case 'usuario': navigate('/usuario'); break;
        default: break;
      }
    }

    // Inicialización del efecto de fondo (Vanta JS)
    if (vantaRef.current && !vantaInstanceRef.current) {
      try {
        vantaInstanceRef.current = CELLS({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
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
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login exitoso - guardar según preferencia de "recordar sesión"
        saveUser(data.user, rememberMe);

        // Redirigimos según el rol
        const { rol } = data.user;
        switch (rol) {
          case 'admin': navigate('/admin'); break;
          case 'tecnico': navigate('/tecnico'); break;
          case 'distribuidor': navigate('/distribuidor'); break;
          case 'usuario': navigate('/usuario'); break;
          default: navigate('/'); // Por seguridad
        }
      } else {
        setError(data.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('No hay conexión con el servidor ⚠️');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={vantaRef} className="flex min-h-screen items-center justify-center text-white px-4 sm:px-6 lg:px-8">

      {/* Tarjeta con efecto Glass */}
      <div className="z-10 w-full max-w-md bg-black/40 backdrop-blur-lg p-8 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-wider mb-2">Infiniguard SYS</h1>
          <p className="text-blue-200 text-sm font-light tracking-widest uppercase">Sistema de Gestión</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 animate-pulse">
              <span>🚫</span> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase mb-2 ml-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition hover:bg-white/10"
                placeholder="user@infiniguard.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase mb-2 ml-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition hover:bg-white/10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Checkbox Recordar Sesión */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-sm text-blue-100 cursor-pointer select-none">
              Recordar sesión
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Validando...' : 'INICIAR SESIÓN'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">No tienes una cuenta? <a href='/register' className="text-blue-500 hover:underline">Registrate</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;