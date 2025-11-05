# 🐘 Conexión a PostgreSQL - Comercio

## ✅ Configuración Completada

Tu aplicación ahora tiene una conexión completa y funcional a PostgreSQL con los siguientes detalles:

### 📊 Base de Datos
- **Nombre**: Comercio
- **Host**: localhost
- **Puerto**: 5432
- **Usuario**: postgres
- **Contraseña**: Racquet12

### 🚀 Servidor Backend
- **Puerto**: 5000
- **URL**: http://localhost:5000
- **Estado**: ✅ Funcionando correctamente

## 📁 Estructura Creada

```
backend/
├── config/
│   ├── database.js      # Configuración de conexión PostgreSQL
│   └── config.js        # Configuración centralizada
├── routes/
│   └── example.js       # Rutas de ejemplo para probar la conexión
├── models/              # Para futuros modelos de datos
├── utils/
│   └── dbUtils.js       # Utilidades para operaciones de BD
├── examples/
│   └── database-examples.js  # Ejemplos de uso completos
├── server.js           # Servidor principal Express
└── README.md           # Documentación del backend
```

## 🛠️ Scripts Disponibles

```bash
# Iniciar solo el servidor backend
npm run server

# Iniciar servidor con auto-reload (desarrollo)
npm run server:dev

# Iniciar frontend y backend simultáneamente
npm run dev
```

## 🔗 Endpoints Disponibles

### Pruebas de Conexión
- `GET /` - Página principal del servidor
- `GET /api/test-db` - ✅ Probar conexión a PostgreSQL
- `GET /api/health` - Estado del servidor

### Rutas de Ejemplo
- `GET /api/example/users` - Obtener información de PostgreSQL
- `POST /api/example/create-table` - Crear tabla de prueba
- `POST /api/example/insert-data` - Insertar datos de ejemplo
- `GET /api/example/data` - Obtener todos los datos de prueba

## 🧪 Pruebas Realizadas

✅ **Servidor iniciado correctamente** en puerto 5000
✅ **Conexión a PostgreSQL exitosa** - Base de datos "Comercio"
✅ **Consultas funcionando** - Versión PostgreSQL 17.6 detectada
✅ **CORS configurado** para frontend en puerto 3000

## 💡 Cómo Usar la Conexión

### 1. Importar la configuración
```javascript
const { query, getClient, testConnection } = require('./config/database');
```

### 2. Ejecutar consultas simples
```javascript
const result = await query('SELECT * FROM mi_tabla');
```

### 3. Consultas con parámetros
```javascript
const result = await query('SELECT * FROM usuarios WHERE id = $1', [userId]);
```

### 4. Transacciones
```javascript
const client = await getClient();
try {
  await client.query('BEGIN');
  // tus operaciones aquí
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## 🎯 Próximos Pasos

1. **Crear tus propias tablas** en la base de datos "Comercio"
2. **Desarrollar modelos** en la carpeta `backend/models/`
3. **Crear rutas específicas** en `backend/routes/`
4. **Conectar el frontend React** con las APIs del backend
5. **Implementar autenticación** si es necesario

## 🔧 Comandos Útiles

```bash
# Probar la conexión
curl http://localhost:5000/api/test-db

# Ver información de PostgreSQL
curl http://localhost:5000/api/example/users

# Ejecutar ejemplos de base de datos
node backend/examples/database-examples.js
```

## 📝 Notas Importantes

- El servidor está configurado para aceptar conexiones desde `http://localhost:3000` (tu frontend React)
- La conexión usa un pool de conexiones para mejor rendimiento
- Se incluyen utilidades para verificar tablas, obtener información de esquemas, etc.
- Los ejemplos muestran operaciones CRUD completas y transacciones

¡Tu conexión a PostgreSQL está lista para usar! 🎉
