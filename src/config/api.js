// Detección automática de entorno
const isDevelopment = import.meta.env.MODE === 'development';

// URL del Backend
const API_URL = isDevelopment
    ? 'http://localhost:4000'  // Desarrollo local
    : 'https://updm-infiniguard-production.up.railway.app';  // Producción en Railway

export default API_URL;

// Julio: updm-infiniguard-production.up.railway.app