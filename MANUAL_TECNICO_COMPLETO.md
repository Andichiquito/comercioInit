# Manual Técnico Completo - Sistema de Comercio Internacional

## 📋 Tabla de Contenidos

1. [Introducción y Arquitectura](#introducción-y-arquitectura)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Comandos del Sistema](#comandos-del-sistema)
4. [Conexiones: Base de Datos, Frontend y Backend](#conexiones)
5. [APIs del Backend - Documentación Completa](#apis-del-backend)
6. [Scripts del Sistema](#scripts-del-sistema)
7. [Código Importante - Líneas Clave](#código-importante)
8. [Flujo de Datos y Autenticación](#flujo-de-datos-y-autenticación)
9. [Troubleshooting](#troubleshooting)

---

## Introducción y Arquitectura

### Stack Tecnológico

**Frontend:**
- React 19.2.0
- React Router DOM 7.9.4
- Axios 1.12.2 (para peticiones HTTP)
- Recharts 3.2.1 (gráficos)
- Tailwind CSS 3.4.18

**Backend:**
- Node.js
- Express 5.1.0
- PostgreSQL 8.16.3 (driver pg)
- JWT (jsonwebtoken 9.0.2) para autenticación
- Multer 2.0.2 (carga de archivos)
- XLSX 0.18.5 (procesamiento de Excel)
- Bcryptjs 3.0.2 (hash de contraseñas)

### Arquitectura del Sistema

```
┌─────────────────┐
│   Frontend      │  React App (Puerto 3000)
│   (React)       │
└────────┬────────┘
         │ HTTP/HTTPS
         │ API Calls
         │ (axios)
         ▼
┌─────────────────┐
│   Backend       │  Express Server (Puerto 5000)
│   (Node.js)     │
└────────┬────────┘
         │ SQL Queries
         │ (pg Pool)
         ▼
┌─────────────────┐
│   PostgreSQL    │  Base de Datos (Puerto 5432)
│   (Comercio)    │
└─────────────────┘
```

### Estructura de Directorios

```
comercioint/
├── backend/
│   ├── config/
│   │   ├── config.js          # Configuración centralizada
│   │   └── database.js        # Pool de conexiones PostgreSQL
│   ├── middleware/
│   │   └── auth.js            # JWT, autenticación, autorización
│   ├── routes/
│   │   ├── auth.js            # Login, registro, verificación
│   │   ├── users.js           # CRUD usuarios (admin)
│   │   ├── data-upload.js     # Carga de Excel a hoja1
│   │   ├── data-count.js      # Conteo de registros
│   │   ├── views.js           # Gestión de vistas PostgreSQL
│   │   └── example.js         # Rutas de prueba
│   ├── scripts/
│   │   ├── start-server.js    # Script de inicio con validaciones
│   │   └── create-views.js    # Creación de vistas predefinidas
│   ├── utils/
│   │   └── dbUtils.js         # Utilidades de base de datos
│   └── server.js              # Servidor Express principal
├── src/
│   ├── components/            # Componentes React
│   ├── contexts/
│   │   └── AuthContext.js     # Context de autenticación
│   └── index.js               # Punto de entrada React
├── package.json
└── .env                       # Variables de entorno
```

---

## Instalación y Configuración

### Requisitos Previos

1. **Node.js** (v16 o superior)
2. **PostgreSQL** (v12 o superior)
3. **npm** o **yarn**

### Paso 1: Clonar e Instalar Dependencias

```bash
# Navegar al directorio del proyecto
cd comercioint

# Instalar dependencias
npm install
```

### Paso 2: Configurar Base de Datos PostgreSQL

#### Crear Base de Datos

```sql
-- Conectar a PostgreSQL como superusuario
psql -U postgres

-- Crear base de datos
CREATE DATABASE "Comercio";

-- Conectar a la base de datos
\c Comercio
```

#### Crear Tabla de Usuarios

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('admin', 'cliente')),
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Crear Tabla de Datos Comerciales (hoja1)

La tabla `hoja1` debe crearse según la estructura del Excel que se va a cargar. El sistema detecta automáticamente la estructura al cargar datos.

### Paso 3: Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Comercio
DB_USER=postgres
DB_PASSWORD=Racquet12

# Servidor
PORT=5000
NODE_ENV=development

# JWT Secret (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:** Cambiar `JWT_SECRET` y `DB_PASSWORD` en producción.

### Paso 4: Verificar Instalación

```bash
# Probar conexión a base de datos
npm run server

# En otra terminal, probar el frontend
npm start
```

---

## Comandos del Sistema

### Comandos NPM Disponibles

```bash
# Iniciar solo el frontend (React)
npm start
# → Abre http://localhost:3000

# Iniciar solo el backend (Express)
npm run server
# → Inicia servidor en http://localhost:5000

# Iniciar backend simple (sin validaciones)
npm run server:simple
# → node backend/server.js

# Iniciar backend con auto-reload (desarrollo)
npm run server:dev
# → Requiere nodemon instalado

# Iniciar frontend y backend simultáneamente
npm run dev
# → Usa concurrently para ejecutar ambos

# Compilar para producción
npm run build
# → Crea carpeta build/ con archivos optimizados

# Ejecutar tests
npm test

# Configurar archivo .env
npm run setup
```

### Comandos de PostgreSQL

```bash
# Iniciar servicio PostgreSQL (Windows)
net start postgresql-x64-XX

# Detener servicio PostgreSQL (Windows)
net stop postgresql-x64-XX

# Conectar a PostgreSQL
psql -U postgres -d Comercio

# Ejecutar script SQL
psql -U postgres -d Comercio -f script.sql

# Backup de base de datos
pg_dump -U postgres Comercio > backup.sql

# Restaurar base de datos
psql -U postgres Comercio < backup.sql
```

### Comandos de Node.js (Scripts)

```bash
# Ejecutar script de creación de vistas
node backend/scripts/create-views.js

# Ejecutar script de inspección de usuarios
node backend/scripts/inspect-users.js
```

---

## Conexiones

### Conexión Backend → PostgreSQL

**Archivo:** `backend/config/database.js`

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'Comercio',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Racquet12',
  max: 20,                    // Máximo 20 conexiones simultáneas
  idleTimeoutMillis: 30000,    // Cerrar conexiones inactivas después de 30s
  connectionTimeoutMillis: 5000 // Timeout de conexión: 5 segundos
});
```

**Uso en el código:**

```javascript
const { query, getClient, testConnection } = require('./config/database');

// Consulta simple
const result = await query('SELECT * FROM usuarios WHERE id = $1', [userId]);

// Obtener cliente para transacciones
const client = await getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO ...');
  await client.query('COMMIT');
} finally {
  client.release();
}
```

### Conexión Frontend → Backend

**Archivo:** `src/contexts/AuthContext.js`

```javascript
const API_BASE = 'http://localhost:5000/api';

// Configurar axios globalmente
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

**Ejemplo de uso en componentes:**

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Configurar cliente axios
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Petición GET
const response = await apiClient.get('/views/query/vista_estadisticas_generales');

// Petición POST con autenticación
const response = await apiClient.post('/auth/login', {
  email: 'usuario@example.com',
  password: 'contraseña123'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Configuración CORS

**Archivo:** `backend/server.js`

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',  // Frontend React
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true  // Permitir cookies/headers de autenticación
}));
```

---

## APIs del Backend

### Base URL

```
http://localhost:5000/api
```

### Autenticación (`/api/auth`)

#### POST `/api/auth/register`

Registrar nuevo usuario.

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "contraseña123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "rol": "cliente"  // Opcional, default: "cliente"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@example.com",
      "nombre": "Juan",
      "apellido": "Pérez",
      "rol": "cliente",
      "fecha_registro": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Código importante:**
```javascript
// backend/routes/auth.js líneas 41-43
const saltRounds = 10;
const passwordHash = await bcrypt.hash(password, saltRounds);
```

#### POST `/api/auth/login`

Iniciar sesión.

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "contraseña123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@example.com",
      "nombre": "Juan",
      "apellido": "Pérez",
      "rol": "cliente"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Código importante:**
```javascript
// backend/routes/auth.js líneas 122-123
const isValidPassword = await bcrypt.compare(password, user.password_hash);
```

#### GET `/api/auth/verify`

Verificar token JWT.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@example.com",
      "nombre": "Juan",
      "apellido": "Pérez",
      "rol": "cliente",
      "activo": true
    }
  }
}
```

#### POST `/api/auth/logout`

Cerrar sesión.

**Headers:**
```
Authorization: Bearer TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

---

### Gestión de Usuarios (`/api/users`) - Requiere Admin

**Todas las rutas requieren:**
- Header: `Authorization: Bearer TOKEN`
- Rol: `admin`

#### GET `/api/users`

Listar usuarios con paginación.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Registros por página (default: 10)
- `search` (opcional): Búsqueda en nombre, apellido, email

**Ejemplo:**
```
GET /api/users?page=1&limit=10&search=juan
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "usuario@example.com",
        "nombre": "Juan",
        "apellido": "Pérez",
        "rol": "cliente",
        "activo": true,
        "fecha_registro": "2024-01-15T10:30:00.000Z",
        "ultimo_acceso": "2024-01-16T14:20:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### GET `/api/users/:id`

Obtener usuario por ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@example.com",
      "nombre": "Juan",
      "apellido": "Pérez",
      "rol": "cliente",
      "activo": true
    }
  }
}
```

#### POST `/api/users`

Crear nuevo usuario (solo admin).

**Request:**
```json
{
  "email": "nuevo@example.com",
  "password": "contraseña123",
  "nombre": "María",
  "apellido": "González",
  "rol": "cliente"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "user": {
      "id": 2,
      "email": "nuevo@example.com",
      "nombre": "María",
      "apellido": "González",
      "rol": "cliente",
      "activo": true
    }
  }
}
```

#### PUT `/api/users/:id`

Actualizar usuario.

**Request (campos opcionales):**
```json
{
  "email": "nuevoemail@example.com",
  "nombre": "Juan Carlos",
  "apellido": "Pérez",
  "rol": "admin",
  "activo": true,
  "password": "nuevacontraseña123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "email": "nuevoemail@example.com",
      "nombre": "Juan Carlos",
      "apellido": "Pérez",
      "rol": "admin",
      "activo": true
    }
  }
}
```

#### DELETE `/api/users/:id`

Eliminar usuario permanentemente.

**Response (200):**
```json
{
  "success": true,
  "message": "Usuario eliminado permanentemente"
}
```

**Código importante:**
```javascript
// backend/routes/users.js líneas 328-334
// No permitir que un admin se elimine a sí mismo
if (parseInt(id) === req.user.id) {
  return res.status(400).json({
    success: false,
    message: 'No puedes eliminar tu propia cuenta'
  });
}
```

#### PATCH `/api/users/:id/reactivate`

Reactivar usuario desactivado.

**Response (200):**
```json
{
  "success": true,
  "message": "Usuario reactivado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@example.com",
      "activo": true
    }
  }
}
```

---

### Carga de Datos (`/api/data`) - Requiere Admin

#### POST `/api/data/upload`

Cargar datos desde archivo Excel a la tabla `hoja1`.

**Headers:**
```
Authorization: Bearer TOKEN
Content-Type: multipart/form-data
```

**Request (FormData):**
```
excelFile: [archivo .xlsx, .xls, o .xlsm]
```

**Proceso de carga (3 pasos):**

1. **PASO 1: TRUNCATE**
   - Elimina todos los registros de `hoja1`
   - Reinicia secuencias
   - Verifica que la tabla quede vacía

2. **PASO 2: PROCESAR EXCEL**
   - Lee archivo Excel desde memoria
   - Mapea columnas Excel → Base de datos
   - Valida tipos de datos
   - Convierte valores según tipo

3. **PASO 3: INSERTAR DATOS**
   - Inserta fila por fila en transacción
   - Captura errores específicos por fila
   - Hace COMMIT si todo es exitoso

**Response (200):**
```json
{
  "success": true,
  "message": "Datos cargados exitosamente",
  "data": {
    "totalRows": 1000,
    "insertedRows": 995,
    "errorRows": 5,
    "recordsInDB": 995,
    "errors": [
      {
        "row": 15,
        "error": "null value in column violates not-null constraint",
        "code": "23502",
        "detail": "Column 'nombre_del_pais_de_destino'"
      }
    ],
    "columnMapping": {
      "0": "gestion",
      "1": "mes",
      "2": "nombre_del_pais_de_destino"
    },
    "timestamp": "2024-01-16T14:30:00.000Z"
  }
}
```

**Código importante - Mapeo de columnas:**
```javascript
// backend/routes/data-upload.js líneas 69-151
const mapExcelToDB = async (excelHeaders) => {
  // 1. Obtener estructura de la tabla
  const tableStructure = await getTableStructure();
  const dbColumns = tableStructure.map(col => col.column_name);
  
  // 2. Buscar coincidencias exactas primero
  // 3. Si no hay coincidencia, buscar parcial
  // 4. Analizar partes de palabras para coincidencias flexibles
  
  return { columnMap, dbColumns, unmappedColumns };
};
```

**Código importante - Conversión de valores:**
```javascript
// backend/routes/data-upload.js líneas 153-193
const convertValue = (value, dataType) => {
  // Maneja números, fechas (incluyendo fechas Excel), booleanos
  // Excel almacena fechas como números desde 30 dic 1899
  if (dataType.includes('date') && typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date;
  }
  // ... más conversiones
};
```

**Código importante - TRUNCATE antes de insertar:**
```javascript
// backend/routes/data-upload.js líneas 249-270
// Hacer TRUNCATE INMEDIATAMENTE - SIN TRANSACCIÓN
const truncateResult = await client.query(
  'TRUNCATE TABLE hoja1 RESTART IDENTITY CASCADE'
);

// Verificar que quedó vacía
const countAfter = await client.query('SELECT COUNT(*) as total FROM hoja1');
if (parseInt(countAfter.rows[0].total) !== 0) {
  throw new Error('El TRUNCATE no eliminó todos los registros');
}
```

#### GET `/api/data/structure`

Obtener estructura de la tabla `hoja1`.

**Response (200):**
```json
{
  "success": true,
  "table": "hoja1",
  "columns": [
    {
      "name": "id",
      "type": "integer",
      "nullable": false,
      "default": "nextval('hoja1_id_seq'::regclass)"
    },
    {
      "name": "gestion",
      "type": "integer",
      "nullable": true,
      "default": null
    }
  ],
  "timestamp": "2024-01-16T14:30:00.000Z"
}
```

#### GET `/api/data/test`

Probar que la ruta funciona.

**Response (200):**
```json
{
  "success": true,
  "message": "Ruta de carga de datos está funcionando",
  "timestamp": "2024-01-16T14:30:00.000Z"
}
```

---

### Conteo de Datos (`/api/count`)

#### GET `/api/count/hoja1`

Contar registros en tabla `hoja1`.

**Response (200):**
```json
{
  "success": true,
  "tabla": "hoja1",
  "total_registros": 15234,
  "mensaje": "La tabla hoja1 tiene 15234 registros",
  "timestamp": "2024-01-16T14:30:00.000Z"
}
```

#### GET `/api/count/usuarios`

Contar registros en tabla `usuarios`.

**Response (200):**
```json
{
  "success": true,
  "tabla": "usuarios",
  "total_registros": 25,
  "mensaje": "La tabla usuarios tiene 25 registros"
}
```

#### GET `/api/count/ambas`

Contar registros en ambas tablas.

**Response (200):**
```json
{
  "success": true,
  "tablas": {
    "hoja1": {
      "total_registros": 15234,
      "mensaje": "La tabla hoja1 tiene 15234 registros"
    },
    "usuarios": {
      "total_registros": 25,
      "mensaje": "La tabla usuarios tiene 25 registros"
    }
  },
  "resumen": {
    "total_general": 15259,
    "mensaje": "En total hay 15259 registros entre ambas tablas"
  }
}
```

#### GET `/api/count/info`

Información detallada de tablas.

**Response (200):**
```json
{
  "success": true,
  "tablas_encontradas": ["hoja1", "usuarios"],
  "resultados": {
    "hoja1": {
      "existe": true,
      "total_registros": 15234
    },
    "usuarios": {
      "existe": true,
      "total_registros": 25
    }
  }
}
```

---

### Gestión de Vistas (`/api/views`)

#### GET `/api/views/explore-structure`

Explorar estructura de tablas.

**Response (200):**
```json
{
  "success": true,
  "tablas": {
    "hoja1": {
      "columnas": [
        {
          "column_name": "id",
          "data_type": "integer",
          "is_nullable": "NO"
        }
      ],
      "total_columnas": 45
    },
    "usuarios": {
      "columnas": [...],
      "total_columnas": 10
    }
  }
}
```

#### GET `/api/views/sample-data`

Obtener muestra de datos (5 registros de cada tabla).

**Response (200):**
```json
{
  "success": true,
  "muestras": {
    "hoja1": {
      "datos": [...],
      "total_registros": 5
    },
    "usuarios": {
      "datos": [...],
      "total_registros": 5
    }
  }
}
```

#### POST `/api/views/create`

Crear o reemplazar vista.

**Request:**
```json
{
  "nombreVista": "vista_mi_vista",
  "consultaSQL": "SELECT * FROM hoja1 WHERE gestion = 2024",
  "descripcion": "Vista de operaciones 2024"
}
```

**Response (200):**
```json
{
  "success": true,
  "mensaje": "Vista \"vista_mi_vista\" creada exitosamente",
  "descripcion": "Vista de operaciones 2024"
}
```

#### GET `/api/views/list`

Listar todas las vistas.

**Response (200):**
```json
{
  "success": true,
  "vistas": [
    {
      "nombre_vista": "vista_estadisticas_generales",
      "definicion": "SELECT tipo_de_operacion..."
    }
  ],
  "total_vistas": 10
}
```

#### GET `/api/views/query/:nombreVista`

Consultar una vista específica.

**Query Parameters:**
- `limit` (opcional): Límite de registros (default: 100)
- `offset` (opcional): Desplazamiento (default: 0)

**Ejemplo:**
```
GET /api/views/query/vista_estadisticas_generales?limit=50&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "vista": "vista_estadisticas_generales",
  "datos": [...],
  "total_registros": 50,
  "limit": 50,
  "offset": 0
}
```

#### DELETE `/api/views/:nombreVista`

Eliminar vista.

**Response (200):**
```json
{
  "success": true,
  "mensaje": "Vista \"vista_mi_vista\" eliminada exitosamente"
}
```

---

### Rutas de Ejemplo (`/api/example`)

#### GET `/api/example/users`

Consulta de ejemplo.

**Response (200):**
```json
{
  "success": true,
  "message": "Consulta exitosa",
  "data": [
    {
      "current_time": "2024-01-16T14:30:00.000Z",
      "postgres_version": "PostgreSQL 14.5"
    }
  ]
}
```

---

### Rutas del Sistema

#### GET `/`

Estado del servidor.

**Response (200):**
```json
{
  "message": "🚀 Servidor backend funcionando correctamente",
  "timestamp": "2024-01-16T14:30:00.000Z",
  "database": "PostgreSQL - Comercio"
}
```

#### GET `/api/test-db`

Probar conexión a base de datos.

**Response (200):**
```json
{
  "success": true,
  "message": "✅ Conexión a la base de datos exitosa",
  "database": "Comercio",
  "timestamp": "2024-01-16T14:30:00.000Z"
}
```

#### GET `/api/health`

Salud del servidor.

**Response (200):**
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2024-01-16T14:30:00.000Z",
  "uptime": 3600.5
}
```

---

## Scripts del Sistema

### `backend/scripts/start-server.js`

Script de inicio del servidor con validaciones.

**Funcionalidad:**
1. Verifica conexión a PostgreSQL antes de iniciar
2. Muestra mensajes de error útiles si falla
3. Inicia el servidor Express
4. Maneja señales de terminación (SIGINT, SIGTERM)

**Código importante:**
```javascript
// backend/scripts/start-server.js líneas 7-28
const checkPostgreSQL = async () => {
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.log('❌ No se pudo conectar a PostgreSQL');
    console.log('🔧 Soluciones posibles:');
    console.log('   1. Verifica que PostgreSQL esté ejecutándose');
    console.log('   2. Revisa las credenciales en el archivo .env');
    // ...
    process.exit(1);
  }
};
```

**Uso:**
```bash
node backend/scripts/start-server.js
# o
npm run server
```

### `backend/scripts/create-views.js`

Script para crear vistas predefinidas en PostgreSQL.

**Vistas creadas:**
1. `vista_exportaciones_por_pais` - Exportaciones agrupadas por país
2. `vista_operaciones_por_mes` - Operaciones por mes y año
3. `vista_aduana_despacho` - Estadísticas por aduana
4. `vista_productos_mas_exportados` - Top 50 productos exportados
5. `vista_operaciones_recientes` - Últimas 1000 operaciones
6. `vista_estadisticas_generales` - Estadísticas generales
7. `vista_top_10_paises_exportacion` - Top 10 países destino
8. `vista_medio_transporte` - Estadísticas por transporte
9. `vista_departamentos_origen` - Estadísticas por departamento
10. `vista_usuarios_activos` - Información de usuarios

**Código importante:**
```javascript
// backend/scripts/create-views.js líneas 193-212
async function crearTodasLasVistas() {
  for (const vista of vistas) {
    try {
      const createViewQuery = `CREATE OR REPLACE VIEW ${vista.nombre} AS ${vista.consulta}`;
      await query(createViewQuery);
      console.log(`✅ Vista "${vista.nombre}" creada exitosamente`);
    } catch (error) {
      console.error(`❌ Error creando vista "${vista.nombre}":`, error.message);
    }
  }
}
```

**Uso:**
```bash
node backend/scripts/create-views.js
```

**Ejemplo de vista creada:**
```sql
CREATE OR REPLACE VIEW vista_estadisticas_generales AS
SELECT 
  tipo_de_operacion_exportacion_reexportacion_o_efectos_personale as tipo_operacion,
  COUNT(*) as total_operaciones,
  SUM(valor_fob_en_dolares_estadounidenses) as valor_total_usd,
  AVG(valor_fob_en_dolares_estadounidenses) as valor_promedio_usd
FROM hoja1 
GROUP BY tipo_de_operacion_exportacion_reexportacion_o_efectos_personale
ORDER BY valor_total_usd DESC;
```

---

## Código Importante

### Autenticación JWT

**Middleware de autenticación:**
```javascript
// backend/middleware/auth.js líneas 7-43
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acceso requerido' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar que el usuario aún existe y está activo
    const userResult = await query(
      'SELECT id, email, nombre, apellido, rol, activo FROM usuarios WHERE id = $1 AND activo = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado o inactivo' 
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
};
```

**Generación de token:**
```javascript
// backend/middleware/auth.js líneas 97-104
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
};
```

### Hash de Contraseñas

```javascript
// backend/routes/auth.js líneas 41-43
const saltRounds = 10;
const passwordHash = await bcrypt.hash(password, saltRounds);

// Verificación
const isValidPassword = await bcrypt.compare(password, user.password_hash);
```

### Pool de Conexiones PostgreSQL

```javascript
// backend/config/database.js líneas 5-15
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'Comercio',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Racquet12',
  max: 20,                    // Máximo 20 conexiones
  idleTimeoutMillis: 30000,    // Cerrar inactivas después de 30s
  connectionTimeoutMillis: 5000
});
```

### Mapeo Inteligente de Columnas Excel → DB

```javascript
// backend/routes/data-upload.js líneas 88-137
excelHeaders.forEach((excelHeader, index) => {
  const normalizedExcelHeader = normalizeColumnName(excelHeader);
  
  // 1. Buscar coincidencia exacta
  let dbColumn = dbColumns.find(dbCol => {
    const normalizedDbCol = normalizeColumnName(dbCol);
    return normalizedDbCol === normalizedExcelHeader;
  });
  
  // 2. Si no hay coincidencia exacta, buscar parcial
  if (!dbColumn) {
    dbColumn = dbColumns.find(dbCol => {
      const normalizedDbCol = normalizeColumnName(dbCol);
      
      // Coincidencia parcial
      if (normalizedDbCol.includes(normalizedExcelHeader) || 
          normalizedExcelHeader.includes(normalizedDbCol)) {
        return true;
      }
      
      // Analizar partes de palabras
      const excelParts = normalizedExcelHeader.replace(/[_-]/g, ' ').split(/\s+/);
      const dbParts = normalizedDbCol.replace(/[_-]/g, ' ').split(/\s+/);
      
      // Verificar si hay suficiente coincidencia (al menos 50%)
      const matchingParts = excelParts.filter(part => 
        dbParts.some(dbPart => dbPart.includes(part) || part.includes(dbPart))
      );
      
      return matchingParts.length >= Math.min(excelParts.length, dbParts.length) * 0.5;
    });
  }
  
  if (dbColumn) {
    columnMap[index] = dbColumn;
  }
});
```

### Frontend - Context de Autenticación

```javascript
// src/contexts/AuthContext.js líneas 19-28
const API_BASE = 'http://localhost:5000/api';

// Configurar axios para incluir token en todas las peticiones
useEffect(() => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}, [token]);
```

### Frontend - Peticiones Paralelas

```javascript
// src/components/Dashboard/Dashboard.js líneas 40-52
const [statsResponse, exportResponse, countryResponse, transportResponse, recentResponse] = 
  await Promise.all([
    apiClient.get('/views/query/vista_estadisticas_generales'),
    apiClient.get('/views/query/vista_operaciones_por_mes?limit=12'),
    apiClient.get('/views/query/vista_exportaciones_por_pais?limit=10'),
    apiClient.get('/views/query/vista_medio_transporte'),
    apiClient.get('/views/query/vista_operaciones_recientes?limit=10')
  ]);
```

---

## Flujo de Datos y Autenticación

### Flujo de Login

```
1. Usuario ingresa email y contraseña
   ↓
2. Frontend: POST /api/auth/login
   ↓
3. Backend: Verifica credenciales
   - Busca usuario en DB
   - Compara hash de contraseña
   - Verifica que esté activo
   ↓
4. Backend: Genera token JWT
   ↓
5. Backend: Retorna token y datos de usuario
   ↓
6. Frontend: Guarda token en localStorage
   ↓
7. Frontend: Configura axios con token
   axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
   ↓
8. Frontend: Redirige al dashboard
```

### Flujo de Carga de Datos Excel

```
1. Admin selecciona archivo Excel
   ↓
2. Frontend: FormData con archivo
   POST /api/data/upload
   Headers: Authorization: Bearer TOKEN
   ↓
3. Backend: Valida token y rol admin
   ↓
4. Backend: PASO 1 - TRUNCATE TABLE hoja1
   - Elimina todos los registros
   - Reinicia secuencias
   - Verifica que quede vacía
   ↓
5. Backend: PASO 2 - Procesar Excel
   - Lee archivo desde memoria (multer)
   - Convierte a JSON (XLSX)
   - Mapea columnas Excel → DB
   - Valida tipos de datos
   ↓
6. Backend: PASO 3 - Insertar datos
   - Inicia transacción
   - Inserta fila por fila
   - Captura errores específicos
   - COMMIT si todo es exitoso
   - ROLLBACK si hay error
   ↓
7. Backend: Retorna resumen
   - Total de filas
   - Filas insertadas
   - Errores (si los hay)
   ↓
8. Frontend: Muestra resultado
```

### Flujo de Consulta de Vistas

```
1. Usuario accede al dashboard
   ↓
2. Frontend: Múltiples peticiones en paralelo
   Promise.all([
     GET /api/views/query/vista_estadisticas_generales,
     GET /api/views/query/vista_operaciones_por_mes,
     GET /api/views/query/vista_exportaciones_por_pais,
     ...
   ])
   ↓
3. Backend: Ejecuta consultas SQL a las vistas
   SELECT * FROM vista_estadisticas_generales LIMIT 100
   ↓
4. PostgreSQL: Ejecuta la vista (query predefinida)
   ↓
5. Backend: Retorna datos JSON
   ↓
6. Frontend: Renderiza gráficos y tablas
```

---

## Troubleshooting

### Error: "No se pudo conectar a PostgreSQL"

**Causas posibles:**
1. PostgreSQL no está ejecutándose
2. Credenciales incorrectas en `.env`
3. Base de datos no existe
4. Puerto 5432 bloqueado

**Soluciones:**

```bash
# Windows: Iniciar PostgreSQL
net start postgresql-x64-XX

# Verificar que esté ejecutándose
psql -U postgres -c "SELECT version();"

# Verificar base de datos existe
psql -U postgres -l | grep Comercio

# Verificar credenciales en .env
cat .env
```

### Error: "Token inválido o expirado"

**Causas:**
1. Token expirado (24 horas)
2. JWT_SECRET diferente
3. Token no enviado correctamente

**Soluciones:**

```javascript
// Verificar token en frontend
const token = localStorage.getItem('token');
console.log('Token:', token);

// Verificar headers
console.log('Headers:', axios.defaults.headers.common);

// Hacer logout y login nuevamente
await logout();
await login(email, password);
```

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Causa:** Frontend en puerto diferente al configurado en CORS

**Solución:**

```javascript
// backend/server.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',  // Agregar puerto adicional
    'http://localhost:3002'
  ],
  credentials: true
}));
```

### Error: "El TRUNCATE no eliminó todos los registros"

**Causa:** Foreign keys o constraints que impiden el truncate

**Solución:**

```sql
-- Verificar foreign keys
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'hoja1';

-- Si hay foreign keys, usar CASCADE (ya está en el código)
TRUNCATE TABLE hoja1 RESTART IDENTITY CASCADE;
```

### Error: "Columnas no mapeadas"

**Causa:** Nombres de columnas en Excel no coinciden con DB

**Solución:**

1. Verificar estructura esperada:
```bash
GET /api/data/structure
```

2. Ajustar nombres en Excel para que coincidan

3. O modificar el mapeo en `mapExcelToDB()` para ser más flexible

### Error: "ECONNREFUSED" en Frontend

**Causa:** Backend no está ejecutándose

**Solución:**

```bash
# Verificar que el backend esté corriendo
curl http://localhost:5000/api/health

# Iniciar backend
npm run server

# Verificar logs del backend
# Debe mostrar: "🚀 Servidor iniciado en puerto 5000"
```

### Error: "Timeout" en peticiones

**Causa:** Consultas SQL muy lentas o base de datos sobrecargada

**Solución:**

```javascript
// Aumentar timeout en frontend
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 segundos
});

// Optimizar consultas SQL
// Agregar índices en columnas frecuentemente consultadas
CREATE INDEX idx_gestion ON hoja1(gestion);
CREATE INDEX idx_pais_destino ON hoja1(nombre_del_pais_de_destino);
```

---

## Referencias Rápidas

### URLs Importantes

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000
- **API Base:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health
- **Test DB:** http://localhost:5000/api/test-db

### Variables de Entorno

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Comercio
DB_USER=postgres
DB_PASSWORD=Racquet12
PORT=5000
JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion
NODE_ENV=development
```

### Comandos Útiles

```bash
# Iniciar todo
npm run dev

# Solo backend
npm run server

# Solo frontend
npm start

# Crear vistas
node backend/scripts/create-views.js

# Backup DB
pg_dump -U postgres Comercio > backup.sql

# Restaurar DB
psql -U postgres Comercio < backup.sql
```

---

## Implementación Frontend - Detalles Específicos

### Estructura de Rutas (React Router)

**Archivo:** `src/App.js`

```javascript
// Rutas públicas (acceso limitado)
<Route path="/" element={
  <LimitedAccessView showLimitedData={true}>
    <DashboardSimple />
  </LimitedAccessView>
} />

// Rutas protegidas (requieren autenticación)
<Route path="/panel-comercio" element={
  <ProtectedRoute requireAuth={true}>
    <InternationalTradePanel />
  </ProtectedRoute>
} />

// Rutas de administración (requieren rol admin)
<Route path="/admin" element={
  <ProtectedRoute requireAuth={true} allowedRoles={['admin']}>
    <AdminPanel />
  </ProtectedRoute>
} />
```

**Rutas disponibles:**
- `/` - Dashboard público (datos limitados)
- `/panel-comercio` - Panel completo (requiere auth)
- `/datos-comerciales` - Tabla de datos (requiere auth)
- `/graficos` - Gráficos avanzados (requiere auth)
- `/analisis` - Análisis de mercados (requiere auth)
- `/admin` - Panel de administración (requiere admin)
- `/about` - Página pública

### Context de Autenticación - Implementación Completa

**Archivo:** `src/contexts/AuthContext.js`

```javascript
// Configuración global de axios
const API_BASE = 'http://localhost:5000/api';

useEffect(() => {
  if (token) {
    // Agregar token a todas las peticiones
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Remover token si no existe
    delete axios.defaults.headers.common['Authorization'];
  }
}, [token]);

// Función de login
const login = async (email, password) => {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email,
    password
  });

  if (response.data.success) {
    const { user: userData, token: newToken } = response.data.data;
    
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('token', newToken); // Persistir en localStorage
    
    return { success: true, user: userData };
  }
};
```

**Funciones del contexto:**
- `login(email, password)` - Iniciar sesión
- `register(userData)` - Registrar usuario
- `logout()` - Cerrar sesión
- `isAdmin()` - Verificar si es admin
- `isClient()` - Verificar si es cliente
- `isAuthenticated()` - Verificar si está autenticado
- `hasRole(role)` - Verificar rol específico

### Componente de Login - Implementación

**Archivo:** `src/components/Auth/Login.js`

```javascript
const Login = ({ onSwitchToRegister, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        onClose?.(); // Cerrar modal si existe
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Error inesperado. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
};
```

### Panel de Administración - CRUD de Usuarios

**Archivo:** `src/components/Admin/AdminPanel.js`

#### Cargar Usuarios con Paginación

```javascript
const fetchUsers = async () => {
  try {
    setLoading(true);
    const response = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (data.success) {
      setUsers(data.data.users || data.data);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    addToast('Error al cargar usuarios', 'error');
  } finally {
    setLoading(false);
  }
};
```

#### Crear Usuario

```javascript
const handleCreateUser = async (e) => {
  e.preventDefault();
  setFormLoading(true);

  try {
    const response = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      addToast('Usuario creado exitosamente', 'success');
      setShowCreateModal(false);
      resetForm();
      fetchUsers(); // Recargar lista
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    addToast(error.message, 'error');
  } finally {
    setFormLoading(false);
  }
};
```

#### Actualizar Usuario

```javascript
const handleEditUser = async (e) => {
  e.preventDefault();
  setFormLoading(true);

  try {
    // Preparar datos (excluir password vacío)
    const updateData = { ...formData };
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }

    const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (data.success) {
      addToast('Usuario actualizado exitosamente', 'success');
      setShowEditModal(false);
      resetForm();
      fetchUsers();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    addToast(error.message, 'error');
  } finally {
    setFormLoading(false);
  }
};
```

#### Eliminar Usuario

```javascript
const handleDeleteUser = async () => {
  if (!selectedUser) return;

  setFormLoading(true);

  try {
    const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      addToast('Usuario eliminado exitosamente', 'success');
      setShowDeleteModal(false);
      setSelectedUser(null);
      await fetchUsers();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    addToast(error.message, 'error');
  } finally {
    setFormLoading(false);
  }
};
```

### Carga de Archivos Excel - Implementación Completa

**Archivo:** `src/components/Admin/AdminPanel.js`

#### Selección y Validación de Archivo

```javascript
const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validar extensión
    const validExtensions = ['.xlsx', '.xls', '.xlsm'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      addToast('Por favor selecciona un archivo Excel (.xlsx, .xls, .xlsm)', 'error');
      e.target.value = ''; // Limpiar input
      return;
    }
    
    setSelectedFile(file);
    setShowUploadConfirmModal(true); // Mostrar confirmación
  }
};
```

#### Envío de Archivo al Backend

```javascript
const handleUploadData = async () => {
  if (!selectedFile) {
    addToast('Por favor selecciona un archivo Excel', 'error');
    return;
  }

  setUploadLoading(true);
  setShowUploadConfirmModal(false);

  try {
    // Crear FormData
    const formData = new FormData();
    formData.append('excelFile', selectedFile);

    console.log('📤 Enviando archivo:', selectedFile.name);

    // Enviar al backend
    const response = await fetch('http://localhost:5000/api/data/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
        // NO incluir 'Content-Type' - el navegador lo hace automáticamente
      },
      body: formData
    });

    // Procesar respuesta
    let data;
    try {
      const text = await response.text();
      data = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Error al procesar la respuesta: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Error ${response.status}`);
    }

    if (data.success) {
      // Mostrar resultado
      addToast(
        `Datos cargados: ${data.data.insertedRows} filas de ${data.data.totalRows}`,
        'success'
      );
      
      if (data.data.errorRows > 0) {
        addToast(
          `Advertencia: ${data.data.errorRows} filas tuvieron errores`,
          'warning'
        );
      }
      
      // Limpiar
      setSelectedFile(null);
      setShowUploadModal(false);
      const fileInput = document.getElementById('excel-file-input');
      if (fileInput) fileInput.value = '';
    } else {
      // Mostrar error detallado
      let errorMsg = data.error || data.message || 'Error al cargar los datos';
      
      if (data.code) {
        errorMsg += ` (Código: ${data.code})`;
      }
      
      if (data.detail) {
        errorMsg += ` - ${data.detail}`;
      }
      
      addToast(errorMsg, 'error');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    addToast(error.message || 'Error al cargar el archivo', 'error');
  } finally {
    setUploadLoading(false);
  }
};
```

### Componente de Datos Comerciales - Filtros y Paginación

**Archivo:** `src/components/DatosComerciales/DatosComerciales.js`

#### Carga de Datos con Límite

```javascript
const fetchData = async () => {
  try {
    setLoading(true);
    console.log('Cargando datos comerciales (1,000,000 registros)...');
    
    // Obtener datos de operaciones recientes
    const response = await axios.get(
      `${API_BASE}/views/query/vista_operaciones_recientes?limit=1000000`
    );
    
    console.log('Datos cargados:', response.data.datos.length);
    setData(response.data.datos);
    setFilteredData(response.data.datos);

  } catch (err) {
    console.error('Error cargando datos:', err);
    setError(`Error: ${err.message} - Status: ${err.response?.status}`);
  } finally {
    setLoading(false);
  }
};
```

#### Carga de Opciones de Filtro

```javascript
const fetchFilterOptions = async () => {
  try {
    // Obtener países únicos
    const paisesResponse = await axios.get(
      `${API_BASE}/views/query/vista_exportaciones_por_pais?limit=100`
    );
    const paisesUnicos = [...new Set(
      paisesResponse.data.datos.map(item => item.nombre_del_pais_de_destino)
    )];
    setPaises(paisesUnicos.filter(p => p));

    // Obtener tipos de operación únicos
    const tiposResponse = await axios.get(
      `${API_BASE}/views/query/vista_estadisticas_generales`
    );
    const tiposUnicos = tiposResponse.data.datos.map(item => item.tipo_operacion);
    setTiposOperacion(tiposUnicos);

  } catch (err) {
    console.error('Error cargando opciones de filtro:', err);
  }
};
```

#### Aplicación de Filtros con Debounce

```javascript
// Debounce para mejorar rendimiento
useEffect(() => {
  const timeoutId = setTimeout(() => {
    applyFilters();
  }, 300); // Esperar 300ms después del último cambio

  return () => clearTimeout(timeoutId);
}, [data, filters]);

const applyFilters = () => {
  console.log('Aplicando filtros a', data.length, 'registros...');
  const startTime = performance.now();
  
  let filtered = data;

  // Filtro por país
  if (filters.pais) {
    const paisLower = filters.pais.toLowerCase();
    filtered = filtered.filter(item => 
      item.nombre_del_pais_de_destino?.toLowerCase().includes(paisLower)
    );
  }

  // Filtro por producto
  if (filters.producto) {
    const productoLower = filters.producto.toLowerCase();
    filtered = filtered.filter(item => 
      item.codigo_producto?.toString().includes(filters.producto) ||
      item.descripcion_del_capitulo_nandina?.toLowerCase().includes(productoLower)
    );
  }

  // Filtro por tipo de operación
  if (filters.tipoOperacion) {
    filtered = filtered.filter(item => 
      item.tipo_operacion?.includes(filters.tipoOperacion)
    );
  }

  // Filtro por fecha desde
  if (filters.fechaDesde) {
    const desdeDate = new Date(filters.fechaDesde);
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= desdeDate;
    });
  }

  // Filtro por fecha hasta
  if (filters.fechaHasta) {
    const hastaDate = new Date(filters.fechaHasta);
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate <= hastaDate;
    });
  }

  // Búsqueda general
  if (filters.busqueda) {
    const searchTerm = filters.busqueda.toLowerCase();
    filtered = filtered.filter(item => 
      item.nombre_del_pais_de_destino?.toLowerCase().includes(searchTerm) ||
      item.codigo_producto?.toString().includes(searchTerm) ||
      item.descripcion_de_la_aduana_de_despacho?.toLowerCase().includes(searchTerm) ||
      item.medio_transporte?.toLowerCase().includes(searchTerm)
    );
  }

  const endTime = performance.now();
  console.log(`Filtrado completado en ${(endTime - startTime).toFixed(2)}ms. Resultados: ${filtered.length}`);
  
  setFilteredData(filtered);
  setCurrentPage(1); // Resetear a primera página
};
```

#### Paginación

```javascript
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(100);

// Calcular índices
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(filteredData.length / itemsPerPage);

// Navegación
const paginate = (pageNumber) => setCurrentPage(pageNumber);
const nextPage = () => {
  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
};
const prevPage = () => {
  if (currentPage > 1) setCurrentPage(currentPage - 1);
};
```

### Dashboard - Carga Paralela de Datos

**Archivo:** `src/components/Dashboard/Dashboard.js`

```javascript
const fetchDashboardData = async () => {
  try {
    setLoading(true);
    
    // Cargar todos los datos en paralelo usando Promise.all
    const [
      statsResponse,
      exportResponse,
      countryResponse,
      transportResponse,
      recentResponse
    ] = await Promise.all([
      apiClient.get('/views/query/vista_estadisticas_generales'),
      apiClient.get('/views/query/vista_operaciones_por_mes?limit=12'),
      apiClient.get('/views/query/vista_exportaciones_por_pais?limit=10'),
      apiClient.get('/views/query/vista_medio_transporte'),
      apiClient.get('/views/query/vista_operaciones_recientes?limit=10')
    ]);

    // Actualizar estados
    setStats(statsResponse.data.datos);
    setExportData(exportResponse.data.datos);
    setCountryData(countryResponse.data.datos);
    setTransportData(transportResponse.data.datos);
    setRecentOps(recentResponse.data.datos);

  } catch (err) {
    // Manejo de errores específicos
    if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
      setError('Error de conexión: El servidor backend no está disponible.');
    } else if (err.response) {
      setError(`Error del servidor: ${err.response.status} - ${err.response.statusText}`);
    } else {
      setError(`Error: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
};
```

### Configuración de Axios con Timeout

```javascript
// Crear instancia de axios con configuración
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Proceso de Carga de Excel - Detalles Técnicos

### Paso 1: TRUNCATE - Código Completo

```javascript
// backend/routes/data-upload.js líneas 236-301
console.log('========================================');
console.log('🗑️ PASO 1: TRUNCATE DE LA TABLA hoja1');
console.log('========================================');

// Contar registros antes
const countBefore = await client.query('SELECT COUNT(*) as total FROM hoja1');
const countBeforeNum = parseInt(countBefore.rows[0].total);
console.log(`📊 Registros ANTES del truncate: ${countBeforeNum}`);

// Ejecutar TRUNCATE
console.log('🗑️ EJECUTANDO TRUNCATE TABLE hoja1 RESTART IDENTITY CASCADE...');
const truncateResult = await client.query(
  'TRUNCATE TABLE hoja1 RESTART IDENTITY CASCADE'
);
console.log('✅✅✅ TRUNCATE EJECUTADO EXITOSAMENTE ✅✅✅');

// Verificar que quedó vacía
const countAfterTruncate = await client.query('SELECT COUNT(*) as total FROM hoja1');
const countAfter = parseInt(countAfterTruncate.rows[0].total);
console.log(`📊 Registros DESPUÉS del truncate: ${countAfter}`);

if (countAfter !== 0) {
  throw new Error(`El TRUNCATE no eliminó todos los registros. Quedan ${countAfter} registros.`);
}

console.log('✅✅✅ TRUNCATE EXITOSO - La tabla está COMPLETAMENTE VACÍA ✅✅✅');
```

### Paso 2: Procesamiento de Excel - Detalles

```javascript
// Leer archivo Excel desde buffer
const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0]; // Primera hoja
const worksheet = workbook.Sheets[sheetName];

// Convertir a JSON con headers en primera fila
const excelData = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,        // Primera fila como headers
  defval: null,     // Valores por defecto null
  raw: false        // Convertir valores
});

// Separar headers y datos
const excelHeaders = excelData[0];
const dataRows = excelData.slice(1).filter(row => {
  // Filtrar filas completamente vacías
  return row.some(cell => cell !== null && cell !== undefined && cell !== '');
});

console.log(`📋 Headers encontrados: ${excelHeaders.length}`);
console.log(`📋 Filas de datos: ${dataRows.length}`);
```

### Paso 3: Inserción Fila por Fila - Manejo de Errores

```javascript
// Iniciar transacción
await client.query('BEGIN');
let transactionStarted = true;

let insertedRows = 0;
let errorRows = 0;
const errors = [];

// Probar con primera fila para capturar errores inmediatamente
if (dataRows.length > 0) {
  const testRow = dataRows[0];
  const testValues = insertColumns.map(col => {
    const excelIndex = Object.keys(columnMap).find(key => columnMap[key] === col);
    const excelValue = excelIndex !== undefined ? testRow[parseInt(excelIndex)] : null;
    const dataType = columnTypes[col] || 'text';
    return convertValue(excelValue, dataType);
  });
  
  try {
    await client.query(insertQuery, testValues);
    insertedRows++;
  } catch (firstRowError) {
    // Capturar error detallado
    const errorInfo = {
      message: firstRowError.message,
      code: firstRowError.code,
      detail: firstRowError.detail,
      column: firstRowError.column,
      constraint: firstRowError.constraint
    };
    
    console.error('❌❌❌ ERROR EN LA PRIMERA FILA ❌❌❌');
    console.error(`❌ Mensaje:`, errorInfo.message);
    console.error(`❌ Código PostgreSQL:`, errorInfo.code);
    console.error(`❌ Detalle:`, errorInfo.detail);
    console.error(`❌ Columna problemática:`, errorInfo.column);
    console.error(`❌ Valores:`, JSON.stringify(testValues, null, 2));
    
    // Hacer ROLLBACK
    await client.query('ROLLBACK');
    throw new Error(`ERROR EN PRIMERA FILA: ${errorInfo.message}`);
  }
}

// Continuar con resto de filas
for (let i = 1; i < dataRows.length; i++) {
  const row = dataRows[i];
  
  try {
    const values = insertColumns.map(col => {
      const excelIndex = Object.keys(columnMap).find(key => columnMap[key] === col);
      const excelValue = excelIndex !== undefined ? row[parseInt(excelIndex)] : null;
      const dataType = columnTypes[col] || 'text';
      return convertValue(excelValue, dataType);
    });
    
    await client.query(insertQuery, values);
    insertedRows++;
    
    // Log progreso cada 100 filas
    if (insertedRows % 100 === 0) {
      console.log(`✅ ${insertedRows} filas insertadas...`);
    }
  } catch (rowError) {
    errorRows++;
    errors.push({
      row: i + 2, // +2 porque empieza en 0 y hay header
      error: rowError.message,
      code: rowError.code,
      detail: rowError.detail
    });
    
    if (errors.length >= 50) {
      console.error('❌ Demasiados errores, deteniendo inserción');
      throw new Error(`Demasiados errores. Primer error en fila ${errors[0].row}`);
    }
  }
}

// Confirmar transacción
await client.query('COMMIT');
console.log(`✅ Inserción completada: ${insertedRows} filas insertadas, ${errorRows} errores`);
```

## Ejemplos Prácticos de Uso

### Ejemplo 1: Crear Usuario Admin desde Frontend

```javascript
// En AdminPanel.js
const createAdminUser = async () => {
  const userData = {
    email: 'admin@example.com',
    password: 'Admin123!',
    nombre: 'Administrador',
    apellido: 'Sistema',
    rol: 'admin',
    activo: true
  };

  const response = await fetch('http://localhost:5000/api/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json();
  console.log('Usuario creado:', data);
};
```

### Ejemplo 2: Consultar Vista con Filtros

```javascript
// Consultar vista con paginación
const fetchVistaData = async (vistaName, limit = 100, offset = 0) => {
  try {
    const response = await axios.get(
      `${API_BASE}/views/query/${vistaName}?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    return response.data.datos;
  } catch (error) {
    console.error('Error consultando vista:', error);
    throw error;
  }
};

// Uso
const datos = await fetchVistaData('vista_exportaciones_por_pais', 50, 0);
```

### Ejemplo 3: Cargar Excel y Mostrar Progreso

```javascript
const uploadExcelWithProgress = async (file) => {
  const formData = new FormData();
  formData.append('excelFile', file);

  // Usar XMLHttpRequest para mostrar progreso
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Monitorear progreso
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        console.log(`Progreso: ${percentComplete.toFixed(2)}%`);
        // Actualizar UI con progreso
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(data);
      } else {
        reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Error de red'));
    });

    xhr.open('POST', 'http://localhost:5000/api/data/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
    xhr.send(formData);
  });
};
```

### Ejemplo 4: Búsqueda con Debounce

```javascript
import { useState, useEffect, useRef } from 'react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Uso en componente
const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Realizar búsqueda
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar..."
    />
  );
};
```

## Conclusión

Este manual técnico cubre todos los aspectos importantes del sistema de Comercio Internacional:

- ✅ Instalación y configuración completa
- ✅ Comandos del sistema
- ✅ Conexiones (DB, Frontend-Backend)
- ✅ APIs documentadas con ejemplos
- ✅ Scripts explicados
- ✅ Código importante destacado
- ✅ Flujos de datos y autenticación
- ✅ **Implementación específica del frontend**
- ✅ **Ejemplos prácticos de uso**
- ✅ **Código completo de componentes**
- ✅ **Manejo de errores detallado**
- ✅ Troubleshooting

Para más detalles, consultar el código fuente directamente o los comentarios en cada archivo.

---

**Última actualización:** Enero 2024  
**Versión del sistema:** 0.1.0

