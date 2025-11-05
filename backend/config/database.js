const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la base de datos PostgreSQL
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

// Función para probar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Conexión a PostgreSQL exitosa');
    console.log('📊 Base de datos:', process.env.DB_NAME || 'Comercio');
    console.log('🔗 Host:', `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    console.log('🐘 PostgreSQL:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    console.error('🔧 Verifica que PostgreSQL esté ejecutándose y las credenciales sean correctas');
    return false;
  }
};

// Función para ejecutar consultas
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📝 Query ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    throw error;
  }
};

// Función para obtener un cliente del pool
const getClient = async () => {
  return await pool.connect();
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};
