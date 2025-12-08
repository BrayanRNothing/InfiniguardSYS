import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import CELLS from 'vanta/dist/vanta.cells.min.js';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const vantaRef = useRef(null);
  const vantaInstanceRef = useRef(null);

  useEffect(() => {
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
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://infiniguardsys-production.up.railway.app/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login exitoso - guardamos el usuario en localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirigimos según el rol
        const { rol } = data.user;
        if (rol === 'admin') navigate('/admin');
        else if (rol === 'tecnico') navigate('/tecnico');
        else if (rol === 'distribuidor') navigate('/distribuidor');
        else if (rol === 'cliente') navigate('/cliente');
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={vantaRef} className="flex min-h-screen items-center justify-center text-white px-4 sm:px-6 lg:px-8">
      
      {/* Tarjeta con efecto Glass (Vidrio) para que se vea el fondo detrás */}
      <div className="z-10 w-full max-w-md bg-black/30 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl">
        
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wider">Infiniguard SYS</h1>
          <p className="text-blue-200 mt-2 text-xs sm:text-sm font-light">Ingreso de Usuarios</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Usuario</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="user@infiniguard.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-2.5 sm:py-3 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.5)] text-sm sm:text-base"
          >
            {loading ? 'Iniciando sesión...' : 'ACCEDER'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;