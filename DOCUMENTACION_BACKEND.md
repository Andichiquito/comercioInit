# Documentación del Sistema Backend - Comercio Internacional

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Configuración](#configuración)
4. [Base de Datos](#base-de-datos)
5. [Middleware de Autenticación](#middleware-de-autenticación)
6. [Rutas del Sistema](#rutas-del-sistema)
7. [Utilidades](#utilidades)
8. [Scripts](#scripts)

---

## Introducción

Este documento describe el funcionamiento del sistema backend para la aplicación de Comercio Internacional. El backend está construido con Node.js, Express y PostgreSQL, y proporciona una API RESTful para gestionar usuarios, datos comerciales y análisis.

---

## Arquitectura del Sistema

El sistema backend está organizado en las siguientes capas:

- **Servidor Principal** (`server.js`): Configuración y arranque del servidor Express
- **Rutas** (`routes/`): Endpoints de la API organizados por funcionalidad
- **Middleware** (`middleware/`): Autenticación y autorización
- **Configuración** (`config/`): Configuración de base de datos y aplicación
- **Utilidades** (`utils/`): Funciones auxiliares para operaciones comunes
- **Scripts** (`scripts/`): Scripts de utilidad para mantenimiento

---

## Configuración

### Archivo: `backend/config/config.js`

Este archivo centraliza toda la configuración de la aplicación:

- **Base de datos**: Configuración de conexión a PostgreSQL (host, puerto, nombre, usuario, contraseña)
- **Servidor**: Puerto y host donde se ejecuta el servidor (por defecto puerto 5000)
- **CORS**: Configuración de orígenes permitidos para el frontend
- **JWT**: Secret key y tiempo de expiración de tokens (por defecto 24 horas)
- **Desarrollo**: Configuración de logs y debugging

**Comentarios importantes:**
- La configuración usa variables de entorno con valores por defecto
- El JWT_SECRET debe cambiarse en producción
- Los logs de queries solo se muestran en desarrollo

### Archivo: `backend/server.js`

Este es el punto de entrada principal del servidor. Sus funciones principales son:

#### Middleware Global
```javascript
// CORS configurado para permitir conexiones desde el frontend React
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
```

#### Rutas Principales
- **GET `/`**: Ruta de prueba que verifica que el servidor está funcionando
- **GET `/api/test-db`**: Prueba la conexión a la base de datos PostgreSQL
- **GET `/api/health`**: Endpoint de salud del servidor con información de uptime

#### Registro de Rutas
El servidor registra las siguientes rutas:
- `/api/example` - Rutas de ejemplo para testing
- `/api/count` - Conteo de registros en tablas
- `/api/views` - Gestión de vistas de PostgreSQL
- `/api/auth` - Autenticación y registro de usuarios
- `/api/users` - CRUD de usuarios (solo administradores)
- `/api/data` - Carga de datos desde archivos Excel

#### Manejo de Errores
- Middleware global para capturar errores no manejados
- Ruta 404 para rutas no encontradas
- Logs detallados en modo desarrollo

**Comentarios importantes:**
- El servidor prueba la conexión a la base de datos al iniciar
- Los errores muestran detalles completos solo en desarrollo
- El puerto por defecto es 5000 pero puede configurarse con variable de entorno

---

## Base de Datos

### Archivo: `backend/config/database.js`

Este archivo gestiona la conexión a PostgreSQL usando un pool de conexiones.

#### Configuración del Pool
```javascript
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'Comercio',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Racquet12',
  max: 20, // máximo número de clientes en el pool
  idleTimeoutMillis: 30000, // cerrar clientes inactivos después de 30 segundos
  connectionTimeoutMillis: 5000, // retornar error después de 5 segundos si no se puede conectar
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

#### Funciones Principales

**`testConnection()`**
- Prueba la conexión a PostgreSQL
- Muestra información de la base de datos y versión de PostgreSQL
- Retorna `true` si la conexión es exitosa, `false` en caso contrario

**`query(text, params)`**
- Ejecuta consultas SQL de forma segura usando parámetros preparados
- Registra el tiempo de ejecución y número de filas afectadas
- Maneja errores y los registra en consola

**`getClient()`**
- Obtiene un cliente del pool de conexiones
- Útil para transacciones que requieren múltiples queries

**Comentarios importantes:**
- El pool permite hasta 20 conexiones simultáneas
- Las conexiones inactivas se cierran después de 30 segundos
- En producción se habilita SSL para conexiones seguras

---

## Middleware de Autenticación

### Archivo: `backend/middleware/auth.js`

Este archivo contiene toda la lógica de autenticación y autorización del sistema.

#### Variables de Configuración
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambiar_en_produccion';
```

**⚠️ IMPORTANTE**: El JWT_SECRET debe cambiarse en producción.

#### Funciones Principales

**`authenticateToken(req, res, next)`**
- Middleware para verificar tokens JWT
- Extrae el token del header `Authorization` en formato `Bearer TOKEN`
- Verifica que el token sea válido y no esté expirado
- Verifica que el usuario exista y esté activo en la base de datos
- Agrega el objeto `user` al request si la autenticación es exitosa
- Retorna error 401 si no hay token o 403 si el token es inválido

**`requireAdmin(req, res, next)`**
- Middleware que verifica que el usuario tenga rol de administrador
- Debe usarse después de `authenticateToken`
- Retorna error 403 si el usuario no es administrador

**`requireAuth(req, res, next)`**
- Middleware que verifica que el usuario tenga rol de admin o cliente
- Permite acceso a usuarios autenticados con cualquier rol válido

**`optionalAuth(req, res, next)`**
- Middleware opcional que no falla si no hay token
- Útil para rutas que pueden funcionar con o sin autenticación
- Si hay token válido, agrega el usuario al request

**`generateToken(userId)`**
- Genera un token JWT para un usuario
- El token expira en 24 horas
- Contiene el `userId` en el payload

**`updateLastAccess(userId)`**
- Actualiza el campo `ultimo_acceso` del usuario
- Se ejecuta después de login y logout
- No lanza errores si falla (solo registra en consola)

**Comentarios importantes:**
- Los tokens expiran después de 24 horas
- El middleware verifica que el usuario esté activo en cada request
- El JWT_SECRET debe ser una cadena segura y única en producción

---

## Rutas del Sistema

### 1. Autenticación (`backend/routes/auth.js`)

Este módulo gestiona el registro, login y verificación de usuarios.

#### POST `/api/auth/register`
**Registro de usuario**

- Valida que todos los campos requeridos estén presentes (email, password, nombre, apellido)
- Verifica que la contraseña tenga al menos 6 caracteres
- Verifica que el email no esté ya registrado
- Hashea la contraseña usando bcrypt con 10 salt rounds
- Crea el usuario con rol 'cliente' por defecto
- Genera un token JWT y actualiza el último acceso
- Retorna el usuario creado (sin la contraseña) y el token

**Comentarios:**
- El email se normaliza a minúsculas antes de guardar
- La contraseña nunca se retorna en las respuestas
- El usuario se crea como activo por defecto

#### POST `/api/auth/login`
**Login de usuario**

- Valida email y contraseña
- Busca el usuario en la base de datos
- Verifica que el usuario exista y esté activo
- Compara la contraseña con el hash almacenado usando bcrypt
- Genera un token JWT y actualiza el último acceso
- Retorna el usuario y el token

**Comentarios:**
- Retorna el mismo mensaje de error para usuario inexistente o contraseña incorrecta (seguridad)
- Verifica que la cuenta esté activa antes de permitir login

#### GET `/api/auth/verify`
**Verificar token**

- Extrae el token del header Authorization
- Verifica que el token sea válido y no esté expirado
- Verifica que el usuario exista y esté activo
- Retorna la información del usuario

**Comentarios:**
- Útil para verificar si una sesión sigue siendo válida
- Se usa en el frontend para mantener la sesión activa

#### POST `/api/auth/logout`
**Logout de usuario**

- Actualiza el último acceso del usuario
- No invalida el token (los tokens JWT son stateless)
- Retorna confirmación de logout exitoso

**Comentarios:**
- En un sistema JWT, el logout se maneja principalmente en el frontend eliminando el token
- El backend actualiza el último acceso para registro de actividad

---

### 2. Gestión de Usuarios (`backend/routes/users.js`)

Este módulo proporciona CRUD completo de usuarios, **solo accesible para administradores**.

**Todas las rutas requieren:**
- Autenticación válida (`authenticateToken`)
- Rol de administrador (`requireAdmin`)

#### GET `/api/users`
**Obtener todos los usuarios (con paginación)**

- Soporta paginación con parámetros `page` y `limit` (por defecto página 1, 10 por página)
- Soporta búsqueda con parámetro `search` (busca en nombre, apellido y email)
- Retorna usuarios ordenados por fecha de creación (más recientes primero)
- Retorna información de paginación (página actual, total, número de páginas)

**Comentarios:**
- La búsqueda es case-insensitive usando `ILIKE`
- No retorna las contraseñas en ningún caso

#### GET `/api/users/:id`
**Obtener un usuario por ID**

- Busca el usuario por su ID
- Retorna error 404 si no se encuentra
- Retorna toda la información del usuario (excepto contraseña)

#### POST `/api/users`
**Crear nuevo usuario (solo admin)**

- Valida todos los campos requeridos
- Valida que el rol sea 'admin' o 'cliente'
- Valida que la contraseña tenga al menos 6 caracteres
- Verifica que el email no esté ya en uso
- Hashea la contraseña antes de guardar
- Crea el usuario como activo por defecto

**Comentarios:**
- Solo los administradores pueden crear usuarios
- El email se normaliza a minúsculas

#### PUT `/api/users/:id`
**Actualizar usuario**

- Permite actualizar cualquier campo del usuario (email, nombre, apellido, rol, activo, password)
- Solo actualiza los campos que se proporcionen en el body
- Valida que el email no esté en uso por otro usuario
- Valida el rol si se proporciona
- Valida la contraseña si se proporciona
- Actualiza automáticamente el campo `updated_at`

**Comentarios:**
- La actualización es parcial (solo los campos enviados)
- Si se actualiza la contraseña, se hashea antes de guardar

#### DELETE `/api/users/:id`
**Eliminar usuario (hard delete)**

- Verifica que el usuario exista
- **No permite que un admin se elimine a sí mismo**
- Elimina el usuario permanentemente de la base de datos (hard delete)

**Comentarios:**
- Esta es una eliminación permanente, no un soft delete
- Los administradores no pueden eliminarse a sí mismos por seguridad

#### PATCH `/api/users/:id/reactivate`
**Reactivar usuario**

- Reactiva un usuario que estaba desactivado
- Actualiza el campo `activo` a `true`
- Actualiza el campo `updated_at`

---

### 3. Carga de Datos (`backend/routes/data-upload.js`)

Este módulo gestiona la carga de datos desde archivos Excel a la tabla `hoja1`.

**Todas las rutas requieren:**
- Autenticación válida (`authenticateToken`)
- Rol de administrador (`requireAdmin`)

#### Configuración de Multer

```javascript
const upload = multer({
  storage: multer.memoryStorage(), // Almacena el archivo en memoria
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Solo permite archivos Excel (.xlsx, .xls, .xlsm)
  }
});
```

**Comentarios:**
- Los archivos se procesan en memoria (no se guardan en disco)
- Tamaño máximo: 50MB
- Solo acepta archivos Excel

#### Funciones Auxiliares

**`getTableStructure(client)`**
- Obtiene la estructura de la tabla `hoja1` desde `information_schema`
- Retorna información de columnas: nombre, tipo de dato, nullable, default
- Se usa para mapear columnas del Excel a la base de datos

**`normalizeColumnName(name)`**
- Normaliza nombres de columnas: convierte a string, elimina espacios, convierte a minúsculas
- Facilita el mapeo entre Excel y base de datos

**`mapExcelToDB(excelHeaders)`**
- Mapea las columnas del Excel a las columnas de la base de datos
- Busca coincidencias exactas primero
- Si no hay coincidencia exacta, busca coincidencias parciales
- Analiza partes de palabras para encontrar coincidencias flexibles
- Retorna un mapa de índices de Excel a nombres de columnas de DB
- Registra columnas no mapeadas para advertencias

**Comentarios importantes:**
- El mapeo es flexible y tolera diferencias en mayúsculas/minúsculas
- Las columnas no mapeadas se ignoran durante la inserción
- Se registra un resumen completo del mapeo en consola

**`convertValue(value, dataType)`**
- Convierte valores del Excel según el tipo de dato de la columna
- Maneja números (incluyendo strings que representan números)
- Maneja fechas (incluyendo fechas de Excel como números)
- Maneja booleanos (acepta 'true', '1', 'si', 'sí', 'yes')
- Retorna `null` para valores vacíos

**Comentarios:**
- Excel almacena fechas como números desde el 30 de diciembre de 1899
- La conversión es necesaria porque Excel puede devolver números como strings

#### POST `/api/data/upload`
**Cargar datos desde Excel**

Este es el endpoint principal para cargar datos. El proceso se divide en 3 pasos:

**PASO 1: TRUNCATE DE LA TABLA**
- Verifica la conexión a la base de datos
- Verifica que la tabla `hoja1` exista
- Cuenta los registros antes del truncate
- **Ejecuta `TRUNCATE TABLE hoja1 RESTART IDENTITY CASCADE`**
- Verifica que la tabla quede completamente vacía (0 registros)
- Si el truncate falla, detiene todo el proceso y retorna error

**Comentarios críticos:**
- El truncate se ejecuta **ANTES** de procesar el Excel
- Si el truncate falla, **NO se procesa el archivo**
- El truncate elimina todos los datos permanentemente
- `RESTART IDENTITY` reinicia los contadores de secuencias
- `CASCADE` elimina datos relacionados en otras tablas si hay foreign keys

**PASO 2: PROCESAR EL ARCHIVO EXCEL**
- Verifica que se haya proporcionado un archivo
- Lee el archivo Excel desde el buffer en memoria
- Usa la primera hoja del libro
- Convierte la hoja a JSON con headers en la primera fila
- Filtra filas completamente vacías
- Obtiene la estructura de la tabla y mapea columnas
- Valida que al menos una columna se haya mapeado
- Obtiene tipos de datos de cada columna
- Prepara el query de inserción

**Comentarios:**
- Solo procesa la primera hoja del Excel
- Las filas vacías se ignoran automáticamente
- Si no se mapea ninguna columna, retorna error

**PASO 3: INSERTAR DATOS FILA POR FILA**
- Inicia una transacción
- Inserta datos fila por fila (no en batch) para mejor diagnóstico de errores
- Prueba con la primera fila para capturar errores inmediatamente
- Si la primera fila falla, muestra error detallado y hace rollback
- Continúa con el resto de filas
- Registra progreso cada 100 filas
- Captura errores por fila sin detener todo el proceso
- Si hay más de 50 errores, detiene la inserción
- Verifica el conteo después de la inserción
- Hace COMMIT de la transacción
- Verifica el conteo final después del commit

**Manejo de Errores:**
- Si hay error en la primera fila, muestra información detallada:
  - Mensaje de error PostgreSQL
  - Código de error PostgreSQL
  - Detalle del error
  - Columna problemática
  - Constraint violado
  - Valores que causaron el error
- Si la transacción se aborta, hace rollback automático
- Retorna mensajes de error amigables según el código de error:
  - `42703`: Columna no existe
  - `23502`: Campo requerido vacío
  - `23503`: Violación de clave foránea
  - `23505`: Valor duplicado
  - `22P02`: Tipo de dato incorrecto

**Comentarios importantes:**
- La inserción fila por fila permite identificar exactamente qué fila causa problemas
- Los errores se capturan y registran sin detener todo el proceso
- El rollback asegura que si algo falla, no se inserten datos parciales
- Se verifica el conteo antes y después para asegurar integridad

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Datos cargados exitosamente",
  "data": {
    "totalRows": 1000,
    "insertedRows": 995,
    "errorRows": 5,
    "recordsInDB": 995,
    "errors": [...], // Primeros 10 errores
    "columnMapping": {...},
    "timestamp": "..."
  }
}
```

#### GET `/api/data/structure`
**Obtener estructura de la tabla**

- Retorna la estructura completa de la tabla `hoja1`
- Incluye nombre, tipo, nullable, y default de cada columna
- Útil para que el frontend sepa qué columnas esperar

#### GET `/api/data/test`
**Ruta de prueba**

- Verifica que el router de carga de datos esté funcionando
- Retorna mensaje de confirmación

---

### 4. Conteo de Datos (`backend/routes/data-count.js`)

Este módulo proporciona endpoints para contar registros en las tablas principales.

#### GET `/api/count/hoja1`
**Contar registros en tabla hoja1**

- Ejecuta `SELECT COUNT(*) FROM hoja1`
- Retorna el total de registros

#### GET `/api/count/usuarios`
**Contar registros en tabla usuarios**

- Ejecuta `SELECT COUNT(*) FROM usuarios`
- Retorna el total de registros

#### GET `/api/count/ambas`
**Contar registros en ambas tablas**

- Ejecuta ambas consultas en paralelo usando `Promise.all`
- Retorna conteo de ambas tablas y total general

#### GET `/api/count/info`
**Información detallada de tablas**

- Verifica qué tablas existen
- Cuenta registros en cada tabla existente
- Indica si las tablas no existen
- Retorna información completa de estado

**Comentarios:**
- Útil para verificar el estado de la base de datos
- Maneja casos donde las tablas no existen

---

### 5. Gestión de Vistas (`backend/routes/views.js`)

Este módulo permite crear, listar, consultar y eliminar vistas de PostgreSQL.

#### Funciones Auxiliares

**`getTableStructure(tableName)`**
- Obtiene la estructura de una tabla desde `information_schema`
- Retorna información detallada de columnas

#### GET `/api/views/explore-structure`
**Explorar estructura de tablas**

- Obtiene la estructura de las tablas `hoja1` y `usuarios` en paralelo
- Retorna información completa de columnas de ambas tablas

#### GET `/api/views/sample-data`
**Obtener muestra de datos**

- Obtiene los primeros 5 registros de cada tabla
- Útil para ver ejemplos de datos

#### POST `/api/views/create`
**Crear vista**

- Crea o reemplaza una vista de PostgreSQL
- Requiere `nombreVista` y `consultaSQL` en el body
- Opcionalmente acepta `descripcion`
- Usa `CREATE OR REPLACE VIEW`

**Comentarios:**
- Las vistas permiten crear consultas complejas reutilizables
- Útil para análisis y reportes

#### GET `/api/views/list`
**Listar todas las vistas**

- Consulta `pg_views` para obtener todas las vistas del esquema público
- Retorna nombre y definición de cada vista

#### GET `/api/views/query/:nombreVista`
**Consultar una vista específica**

- Ejecuta `SELECT * FROM vista` con paginación
- Soporta parámetros `limit` y `offset` (por defecto 100, 0)
- Retorna los datos de la vista

#### DELETE `/api/views/:nombreVista`
**Eliminar vista**

- Elimina una vista usando `DROP VIEW IF EXISTS`
- No falla si la vista no existe

---

### 6. Rutas de Ejemplo (`backend/routes/example.js`)

Este módulo contiene rutas de ejemplo para testing y desarrollo.

#### GET `/api/example/users`
**Consulta de ejemplo**

- Ejecuta una consulta simple: `SELECT NOW(), version()`
- Útil para verificar que la base de datos funciona

#### POST `/api/example/create-table`
**Crear tabla de prueba**

- Crea una tabla `test_table` con campos básicos
- Útil para pruebas de desarrollo

#### POST `/api/example/insert-data`
**Insertar datos de prueba**

- Inserta datos en `test_table`
- Requiere `name` y `email` en el body

#### GET `/api/example/data`
**Obtener datos de prueba**

- Obtiene todos los registros de `test_table`
- Ordenados por fecha de creación descendente

**Comentarios:**
- Estas rutas son principalmente para desarrollo y testing
- La tabla `test_table` es independiente del sistema principal

---

## Utilidades

### Archivo: `backend/utils/dbUtils.js`

Este archivo contiene funciones auxiliares para operaciones comunes con la base de datos.

#### `tableExists(tableName)`
- Verifica si una tabla existe en el esquema público
- Usa `information_schema.tables`
- Retorna `true` o `false`
- Maneja errores silenciosamente

#### `getTableInfo(tableName)`
- Obtiene información detallada de las columnas de una tabla
- Retorna nombre, tipo, nullable, y default de cada columna
- Ordenado por posición ordinal

#### `getAllTables()`
- Obtiene lista de todas las tablas en el esquema público
- Retorna array de nombres de tablas
- Ordenado alfabéticamente

#### `executeTransaction(operations)`
- Ejecuta múltiples operaciones en una transacción
- Recibe array de objetos con `query` y `params`
- Hace COMMIT si todo es exitoso
- Hace ROLLBACK si hay algún error
- Libera el cliente al finalizar

**Comentarios:**
- Útil para operaciones que requieren múltiples queries atómicas
- Asegura que todas las operaciones se completen o ninguna

#### `backupTableStructure(tableName)`
- Genera el SQL CREATE TABLE para una tabla
- Útil para backups de estructura
- Incluye tipos de datos, NOT NULL, y defaults

**Comentarios:**
- Solo genera la estructura, no los datos
- Útil para documentación y migraciones

---

## Scripts

### `backend/scripts/`

El directorio contiene scripts de utilidad para mantenimiento y administración:

- **`create-views.js`**: Script para crear vistas predefinidas
- **`inspect-users.js`**: Script para inspeccionar usuarios en la base de datos
- **`start-server.js`**: Script alternativo para iniciar el servidor

**Nota**: Estos scripts son herramientas de administración y no forman parte de la API principal.

---

## Resumen de Endpoints

### Autenticación (`/api/auth`)
- `POST /register` - Registro de usuario
- `POST /login` - Login de usuario
- `GET /verify` - Verificar token
- `POST /logout` - Logout

### Usuarios (`/api/users`) - Requiere Admin
- `GET /` - Listar usuarios (con paginación y búsqueda)
- `GET /:id` - Obtener usuario por ID
- `POST /` - Crear usuario
- `PUT /:id` - Actualizar usuario
- `DELETE /:id` - Eliminar usuario
- `PATCH /:id/reactivate` - Reactivar usuario

### Carga de Datos (`/api/data`) - Requiere Admin
- `POST /upload` - Cargar datos desde Excel
- `GET /structure` - Obtener estructura de tabla
- `GET /test` - Probar ruta

### Conteo (`/api/count`)
- `GET /hoja1` - Contar registros en hoja1
- `GET /usuarios` - Contar registros en usuarios
- `GET /ambas` - Contar en ambas tablas
- `GET /info` - Información detallada

### Vistas (`/api/views`)
- `GET /explore-structure` - Explorar estructura de tablas
- `GET /sample-data` - Muestra de datos
- `POST /create` - Crear vista
- `GET /list` - Listar vistas
- `GET /query/:nombreVista` - Consultar vista
- `DELETE /:nombreVista` - Eliminar vista

### Ejemplo (`/api/example`)
- `GET /users` - Consulta de ejemplo
- `POST /create-table` - Crear tabla de prueba
- `POST /insert-data` - Insertar datos de prueba
- `GET /data` - Obtener datos de prueba

### Sistema
- `GET /` - Estado del servidor
- `GET /api/test-db` - Probar conexión a BD
- `GET /api/health` - Salud del servidor

---

## Seguridad

### Autenticación
- Todos los endpoints protegidos requieren token JWT válido
- Los tokens expiran después de 24 horas
- Los tokens se verifican en cada request

### Autorización
- Endpoints de administración requieren rol `admin`
- Los usuarios no pueden eliminarse a sí mismos
- Las contraseñas se hashean con bcrypt (10 salt rounds)

### Validación
- Validación de entrada en todos los endpoints
- Uso de parámetros preparados para prevenir SQL injection
- Validación de tipos de archivo en carga de datos
- Límites de tamaño de archivo (50MB)

### Manejo de Errores
- Los errores no exponen información sensible en producción
- Los mensajes de error son amigables para el usuario
- Los logs detallados solo en desarrollo

---

## Consideraciones de Producción

### Variables de Entorno Requeridas
- `DB_HOST` - Host de PostgreSQL
- `DB_PORT` - Puerto de PostgreSQL
- `DB_NAME` - Nombre de la base de datos
- `DB_USER` - Usuario de PostgreSQL
- `DB_PASSWORD` - Contraseña de PostgreSQL
- `JWT_SECRET` - Secret key para JWT (debe ser seguro y único)
- `NODE_ENV` - Entorno (development/production)
- `PORT` - Puerto del servidor (opcional, default 5000)

### Configuración Recomendada
- Cambiar `JWT_SECRET` a un valor seguro y único
- Configurar SSL para PostgreSQL en producción
- Habilitar logs estructurados
- Configurar rate limiting
- Configurar CORS para dominios específicos
- Usar variables de entorno para todas las configuraciones sensibles

---

## Notas Finales

Este documento está basado en los comentarios y código del sistema backend. Para más detalles sobre implementación específica, consultar el código fuente directamente.

**Última actualización**: Basado en el código actual del repositorio.

---

*Documento generado automáticamente basado en comentarios del código*

