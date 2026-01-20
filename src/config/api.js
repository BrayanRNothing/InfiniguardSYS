// Detección automática// URL del Backend
const isDevelopment = import.meta.env.MODE === 'development';

// URL del Backend - Usar localhost para desarrollo
//const API_URL = 'http://localhost:4000';  // Backend local

// URL del Backend - Railway (producción)
const API_URL = 'https://focused-presence-production-6e28.up.railway.app';

export default API_URL;