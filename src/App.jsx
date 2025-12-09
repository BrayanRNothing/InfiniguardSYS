// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import AdminLayout from './layouts/AdminLayout.jsx';
import TecnicoLayout from './layouts/TecnicoLayout.jsx';
import DistribuidorLayout from './layouts/DistribuidorLayout.jsx';
import ClienteLayout from './layouts/ClienteLayout.jsx';
import CotizacionForm from './components/forms/CotizacionForm.jsx';
import CotizacionesTable from './components/ui/CotizacionesTable.jsx';

// Páginas
import Login from './pages/auth/Login.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Servicios from './pages/admin/Servicios.jsx';
import Cotizaciones from './pages/admin/Cotizaciones.jsx';
import Usuarios from './pages/admin/Usuarios.jsx';
import TecnicoHome from './pages/tecnico/TecnicoHome.jsx';
import NuevaSolicitud from './pages/tecnico/NuevaSolicitud.jsx';
import DistribuidorHome from './pages/distribuidor/DistribuidorHome.jsx';
import ClienteHome from './pages/cliente/ClienteHome.jsx';
import NotFound from './pages/NotFound.jsx';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* RUTA PÚBLICA (El Login es la raíz "/") */}
        <Route path="/" element={<Login />} />

        {/* --- RUTAS DE TUS 4 ROLES --- */}
        
        {/* Admin - Rutas Protegidas con Layout */}
        <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="cotizaciones" element={<Cotizaciones />} />
            <Route path="servicios" element={<Servicios />} />
            <Route path="comisiones" element={<div className="p-10 text-gray-600">Página de Comisiones (En construcción)</div>} />
            <Route path="usuarios" element={<Usuarios />} />
        </Route>

        {/* --- DISTRIBUIDOR --- */}
        <Route path="/distribuidor" element={<DistribuidorLayout />}>
          <Route index element={<DistribuidorHome />} />
          <Route path="recubrimientos" element={<div>Cotizar Recubrimiento</div>} />
          <Route path="garantias" element={<div>Garantía Extendida</div>} />
        </Route>

       {/* --- TÉCNICO --- */}
        <Route path="/tecnico" element={<TecnicoLayout />}>
          <Route index element={<TecnicoHome />} />
          <Route path="nueva-solicitud" element={<NuevaSolicitud />} />
        </Route>

        {/* --- CLIENTE --- */}
        <Route path="/cliente" element={<ClienteLayout />}>
          <Route index element={<ClienteHome />} />
          <Route path="nuevo-equipo" element={<div>Formulario Equipo</div>} />
          <Route path="nuevo-recubrimiento" element={<div>Formulario Recubrimiento</div>} />
        </Route>

        {/* Si escriben una ruta que no existe, los mandamos al Login */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;