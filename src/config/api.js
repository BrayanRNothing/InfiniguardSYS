// Detección automática de entorno
const isDevelopment = import.meta.env.MODE === 'development';

const API_URL = 'https://focused-presence-production-6e28.up.railway.app';  // URL de producción

//const API_URL = isDevelopment
  //  ? 'http://localhost:4000'
    //: 'https://focused-presence-production-6e28.up.railway.app';

export default API_URL;