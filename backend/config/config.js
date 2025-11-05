require('dotenv').config();

// Configuración centralizada de la aplicación
module.exports = {
  // Configuración de la base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'Comercio',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Racquet12',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },

  // Configuración del servidor
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost'
  },

  // Configuración de CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro_aqui',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Configuración de desarrollo
  development: {
    logQueries: process.env.NODE_ENV !== 'production',
    logErrors: process.env.NODE_ENV !== 'production'
  }
};
