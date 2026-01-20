// Test script para verificar imports
import { migrarDocumentos } from './migrations/documentos.js';
import crearRutasDocumentos from './routes/documentos.js';

console.log('✅ Imports exitosos');
console.log('migrarDocumentos:', typeof migrarDocumentos);
console.log('crearRutasDocumentos:', typeof crearRutasDocumentos);
