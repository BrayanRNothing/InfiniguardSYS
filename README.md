# InfiniguardSYS

Sistema completo de gestión empresarial con módulos de usuarios, servicios, cotizaciones, documentos y estadísticas de encuestas HVACR.

## 🚀 Características

### Frontend
- ✅ Dashboard administrativo completo
- ✅ Gestión de usuarios (Admin, Técnicos, Clientes, Distribuidores)
- ✅ Sistema de servicios y cotizaciones
- ✅ Generación de PDFs (cotizaciones, órdenes de trabajo)
- ✅ Sistema de documentos con historial
- ✅ **Estadísticas de encuestas HVACR** (NUEVO)
- ✅ Respaldo y restauración de base de datos
- ✅ Diseño responsive con TailwindCSS

### Backend
- ✅ API REST con Express.js
- ✅ Base de datos SQLite
- ✅ Sistema de autenticación
- ✅ Gestión de archivos con Multer
- ✅ **Endpoints de encuestas con scoring automático** (NUEVO)
- ✅ Exportación/Importación de datos

## 🆕 Sistema de Encuestas

### Características
- Recepción automática de encuestas desde EncuestasAPI
- Cálculo automático de puntuación (0-100)
- Detección de nivel de madurez (5 niveles)
- Visualización de estadísticas por categoría
- Diagnósticos y recomendaciones automáticas

### Endpoints
- `POST /api/encuestas/responder` - Recibir nueva encuesta
- `GET /api/encuestas` - Listar todas las encuestas
- `GET /api/encuestas/:id` - Detalle con puntuaciones por categoría

## 🛠️ Tecnologías

### Frontend
- React 19
- Vite
- TailwindCSS 4
- React Router DOM
- React Hot Toast
- jsPDF + jsPDF-AutoTable
- Recharts
- Vanta.js + Three.js

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- Multer (gestión de archivos)
- CORS

## 📦 Instalación

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd backend
npm install
```

## 💻 Desarrollo Local

### Backend
```bash
cd backend
node index.js
```
El backend estará en `http://localhost:4000`

### Frontend
```bash
npm run dev
```
El frontend estará en `http://localhost:5173`

## 🏗️ Build para Producción

```bash
npm run build
```

## 🚂 Deploy en Railway (Backend)

El backend está configurado para Railway con `railway.json` y Dockerfile (sin Nixpacks):

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Pasos para deploy:
1. Conectar repositorio a Railway
2. Railway detectará automáticamente la configuración
3. El backend se desplegará en: `https://focused-presence-production-6e28.up.railway.app`

## 📤 Deploy Frontend (Vercel)

1. Conectar repositorio a Vercel
2. Vercel detectará automáticamente que es un proyecto Vite
3. Deploy automático en cada push a main

## 🔐 Credenciales por Defecto

- **Email**: `admin@infiniguard.com`
- **Password**: `123`

## 📊 Niveles de Madurez (Encuestas)

| Puntuación | Nivel | Color | Diagnóstico |
|------------|-------|-------|-------------|
| 0-20 | Inicial | 🔴 Rojo | Requiere atención urgente |
| 21-40 | Básico | 🟠 Naranja | Fundamentos establecidos |
| 41-60 | En Desarrollo | 🟡 Amarillo | Progreso significativo |
| 61-80 | Avanzado | 🔵 Azul | Operación sólida |
| 81-100 | Best in Class | 🟢 Verde | Excelencia operativa |

## 📁 Estructura del Proyecto

```
InfiniguardSYS/
├── backend/
│   ├── index.js          # Servidor Express + SQLite
│   ├── database.db       # Base de datos SQLite
│   ├── uploads/          # Archivos subidos
│   └── package.json
├── src/
│   ├── pages/
│   │   └── admin/
│   │       ├── Ajustes.jsx        # Estadísticas de encuestas
│   │       ├── Usuarios.jsx
│   │       ├── Servicios.jsx
│   │       └── ...
│   ├── config/
│   │   └── api.js        # Configuración de API URL
│   └── ...
├── railway.json          # Configuración de Railway
└── package.json
```

## 🔄 Cambiar entre Local y Producción

Edita `src/config/api.js`:

```javascript
// Para desarrollo local
const API_URL = 'http://localhost:4000';

// Para producción (Railway)
const API_URL = 'https://focused-presence-production-6e28.up.railway.app';
```

## 📝 Licencia

Privado - Uso interno
