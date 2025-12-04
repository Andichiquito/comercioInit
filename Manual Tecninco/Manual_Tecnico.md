# 📘 Manual Técnico del Sistema de Comercio Internacional

## 1. 📋 Descripción General
El sistema es una aplicación web moderna diseñada para la visualización y análisis de datos de comercio internacional. Utiliza una arquitectura **Client-Server** con **React** en el frontend y **Node.js/Express** en el backend, respaldado por una base de datos **PostgreSQL**.

---

## 2. 💻 Requisitos del Sistema

### Software Necesario
- **Node.js**: v14.0.0 o superior.
- **PostgreSQL**: v12.0 o superior (Recomendado v17.x).
- **NPM**: Gestor de paquetes incluido con Node.js.

### Variables de Entorno (.env)
El sistema requiere un archivo `.env` en la raíz con la siguiente configuración (basado en `.env.example`):
- `PORT`: Puerto del backend (ej. 5000).
- `DB_USER`: Usuario de la base de datos.
- `DB_PASSWORD`: Contraseña de la base de datos.
- `DB_HOST`: Host de la base de datos (ej. localhost).
- `DB_PORT`: Puerto de PostgreSQL (ej. 5432).
- `DB_NAME`: Nombre de la base de datos (ej. Comercio).
- `JWT_SECRET`: Clave secreta para firmar tokens.

---

## 3. ⚙️ Instalación y Puesta en Marcha

### Pasos de Instalación
1.  **Clonar/Descargar el repositorio**.
2.  **Instalar dependencias**:
    ```bash
    npm install
    ```
    Esto instalará tanto las dependencias del frontend como del backend.
3.  **Configurar entorno**:
    Ejecutar el script de configuración para crear el archivo `.env`:
    ```bash
    npm run setup
    ```
    *Nota: Editar el archivo `.env` generado con las credenciales correctas de su base de datos.*

### Ejecución del Sistema
Para iniciar el sistema en modo de desarrollo (Frontend + Backend simultáneamente):
```bash
npm run dev
```
- **Frontend**: Accesible en `http://localhost:3000`
- **Backend**: Accesible en `http://localhost:5000`

Otros comandos útiles:
- `npm start`: Inicia solo el frontend.
- `npm run server`: Inicia solo el backend.

---

## 4. 🖥️ Ventanas y Navegación (Frontend)

La aplicación utiliza `react-router-dom` para la navegación. Las principales vistas son:

### 🔓 Acceso Público / Limitado
- **Dashboard Simple (`/`)**: Vista inicial para usuarios no autenticados o invitados. Muestra datos limitados y estadísticas generales.

### 🔒 Acceso Privado (Requiere Autenticación)
- **Panel de Comercio (`/panel-comercio`)**: Dashboard principal con KPIs en tiempo real, gráficas de exportaciones por país y distribución de transporte.
- **Datos Comerciales (`/datos-comerciales`)**: Vista tabular detallada de los registros comerciales.
- **Gráficos Avanzados (`/graficos`)**: Visualizaciones complejas y personalizables de los datos.
- **Análisis de Mercados (`/analisis`)**: Herramientas para analizar tendencias y mercados específicos.

### 🛡️ Acceso Administrativo (Rol: Admin)
- **Panel de Administración (`/admin`)**:
    - Gestión de usuarios (CRUD).
    - Carga masiva de datos (Excel).
    - Monitoreo del sistema.

---

## 5. 🛠️ CRUDs y Operaciones Técnicas

### 👤 Gestión de Usuarios (CRUD)
Ubicación: `backend/routes/users.js`
Endpoint Base: `/api/users`

| Método | Endpoint | Descripción | Detalles Técnicos |
|--------|----------|-------------|-------------------|
| **GET** | `/` | Listar Usuarios | Soporta paginación (`page`, `limit`) y búsqueda (`search`). |
| **GET** | `/:id` | Ver Usuario | Obtiene detalles completos de un usuario específico. |
| **POST** | `/` | Crear Usuario | Valida email (Gmail/Hotmail), contraseña segura (Mayúscula, símbolo, 6-12 caracteres). Hashea password con `bcrypt`. |
| **PUT** | `/:id` | Actualizar | Permite modificar datos. Valida unicidad de email si se cambia. |
| **DELETE**| `/:id` | Eliminar | Realiza un borrado físico (Hard Delete) o lógico según configuración. Protege al admin de auto-eliminarse. |
| **PATCH** | `/:id/reactivate` | Reactivar | Reactiva un usuario previamente desactivado. |

### 📤 Carga de Datos (Data Upload)
Ubicación: `backend/routes/data-upload.js`
Endpoint Base: `/api/data`

**Proceso de Carga Masiva (`POST /upload`):**
1.  **Recepción**: Recibe archivo Excel (`.xlsx`, `.xls`) vía `multer` (en memoria).
2.  **Validación**: Verifica estructura y contenido del archivo.
3.  **Truncado**: **IMPORTANTE**. Ejecuta `TRUNCATE TABLE hoja1` antes de insertar. Borra todos los datos anteriores.
4.  **Mapeo Inteligente**:
    - Analiza los headers del Excel.
    - Compara con columnas de la BD usando coincidencia difusa (fuzzy matching) y un diccionario manual.
    - Identifica columnas correspondientes automáticamente.
5.  **Inserción**:
    - Inserta datos fila por fila dentro de una transacción.
    - Si falla una fila crítica, hace `ROLLBACK` de todo el proceso.
    - Convierte tipos de datos automáticamente (fechas, números, booleanos).

### 📊 Vistas y Estadísticas
Ubicación: `backend/routes/views.js` y `data-count.js`
- Endpoints de lectura optimizados para alimentar los dashboards.
- Utilizan consultas SQL directas o Vistas Materializadas (si están configuradas) para rendimiento.

---

## 6. 🗄️ Base de Datos (PostgreSQL)

- **Tabla Principal**: `hoja1` (Almacena los datos brutos de comercio).
- **Tabla Usuarios**: `usuarios` (Gestión de acceso y roles).
- **Conexión**: Gestionada vía `pg` (node-postgres) con Pool de conexiones para eficiencia.
- **Configuración**: Archivo `backend/config/database.js`.

---

## 7. 🔒 Seguridad

- **Autenticación**: JWT (JSON Web Tokens). El token se envía en el header `Authorization: Bearer <token>`.
- **Protección de Rutas**: Middleware `authenticateToken` verifica el token en cada petición protegida.
- **Roles**: Middleware `requireAdmin` asegura que solo administradores accedan a rutas críticas.
- **Contraseñas**: Almacenadas como hash (bcrypt).
- **CORS**: Configurado para permitir peticiones solo desde el frontend autorizado.
