// Detección automática de entorno
const isDevelopment = import.meta.env.MODE === 'development';

// URL del Backend - Usar localhost para desarrollo
//const API_URL = 'http://localhost:4000';  // Backend local

// URL del Backend - Railway (comentado)
const API_URL = 'https://updm-infiniguard-production.up.railway.app';
export default API_URL;