// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import AdminLayout from './layouts/AdminLayout.jsx';
import TecnicoLayout from './layouts/TecnicoLayout.jsx';
import DistribuidorLayout from './layouts/DistribuidorLayout.jsx';
import ClienteLayout from './layouts/ClienteLayout.jsx';


// Páginas
import React, { Suspense, lazy } from 'react';
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const Register = lazy(() => import('./pages/auth/Register.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const Servicios = lazy(() => import('./pages/admin/Servicios.jsx'));
const Cotizaciones = lazy(() => import('./pages/admin/Cotizaciones.jsx'));
const Usuarios = lazy(() => import('./pages/admin/Usuarios.jsx'));
const Comisiones = lazy(() => import('./pages/admin/Comisiones.jsx'));
const Documentos = lazy(() => import('./pages/admin/Documentos.jsx'));
const CrearCotizaciones = lazy(() => import('./pages/admin/CrearCotizaciones.jsx'));
const CrearOrdenTrabajo = lazy(() => import('./pages/admin/CrearOrdenTrabajo.jsx'));
const CrearReporteTrabajo = lazy(() => import('./pages/admin/CrearReporteTrabajo.jsx'));
const HistorialDocumentos = lazy(() => import('./pages/admin/HistorialDocumentos.jsx'));
const Ajustes = lazy(() => import('./pages/admin/Ajustes.jsx'));
const TecnicoHome = lazy(() => import('./pages/tecnico/TecnicoHome.jsx'));
const NuevaSolicitud = lazy(() => import('./pages/tecnico/NuevaSolicitud.jsx'));
const DistribuidorHome = lazy(() => import('./pages/distribuidor/DistribuidorHome.jsx'));
const ClienteHome = lazy(() => import('./pages/cliente/ClienteHome.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#23272f',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '15px',
            boxShadow: '0 4px 24px 0 #0002',
            fontWeight: 500,
          },
          success: {
            duration: 3000,
            style: {
              background: '#16a34a',
              color: '#fff',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#dc2626',
              color: '#fff',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          warning: {
            duration: 3500,
            style: {
              background: '#facc15',
              color: '#92400e',
            },
            iconTheme: {
              primary: '#f59e42',
              secondary: '#fff',
            },
          },
          info: {
            duration: 3000,
            style: {
              background: '#2563eb',
              color: '#fff',
            },
            iconTheme: {
              primary: '#60a5fa',
              secondary: '#fff',
            },
          },
        }}
      />
      <Suspense fallback={<div className="flex items-center justify-center h-screen text-blue-600 font-bold text-xl">Cargando página...</div>}>
        <Routes>
          {/* RUTA PÚBLICA (El Login es la raíz "/") */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* --- RUTAS DE TUS 4 ROLES --- */}
          {/* Admin - Rutas Protegidas con Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="cotizaciones" element={<Cotizaciones />} />
            <Route path="servicios" element={<Servicios />} />
            <Route path="comisiones" element={<Comisiones />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="crear-cotizaciones" element={<CrearCotizaciones />} />
            <Route path="crear-orden-trabajo" element={<CrearOrdenTrabajo />} />
            <Route path="crear-reporte-trabajo" element={<CrearReporteTrabajo />} />
            <Route path="historial-documentos" element={<HistorialDocumentos />} />
            <Route path="ajustes" element={<Ajustes />} />
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

          {/* --- USUARIO --- */}
          <Route path="/usuario" element={<ClienteLayout />}>
            <Route index element={<ClienteHome />} />
            <Route path="nuevo-equipo" element={<div>Formulario Equipo</div>} />
            <Route path="nuevo-recubrimiento" element={<div>Formulario Recubrimiento</div>} />
          </Route>

          {/* Si escriben una ruta que no existe, los mandamos al Login */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;