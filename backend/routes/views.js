const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Función para obtener la estructura de una tabla
const getTableStructure = async (tableName) => {
  try {
    const result = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);
    
    return result.rows;
  } catch (error) {
    console.error(`Error obteniendo estructura de ${tableName}:`, error);
    throw error;
  }
};

// Ruta para explorar la estructura de las tablas
router.get('/explore-structure', async (req, res) => {
  try {
    const [hoja1Structure, usuariosStructure] = await Promise.all([
      getTableStructure('hoja1'),
      getTableStructure('usuarios')
    ]);
    
    res.json({
      success: true,
      tablas: {
        hoja1: {
          columnas: hoja1Structure,
          total_columnas: hoja1Structure.length
        },
        usuarios: {
          columnas: usuariosStructure,
          total_columnas: usuariosStructure.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error explorando estructura:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error explorando estructura de tablas',
      error: error.message
    });
  }
});

// Ruta para obtener una muestra de datos de cada tabla
router.get('/sample-data', async (req, res) => {
  try {
    const [hoja1Sample, usuariosSample] = await Promise.all([
      query('SELECT * FROM hoja1 LIMIT 5'),
      query('SELECT * FROM usuarios LIMIT 5')
    ]);
    
    res.json({
      success: true,
      muestras: {
        hoja1: {
          datos: hoja1Sample.rows,
          total_registros: hoja1Sample.rowCount
        },
        usuarios: {
          datos: usuariosSample.rows,
          total_registros: usuariosSample.rowCount
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo muestra de datos:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error obteniendo muestra de datos',
      error: error.message
    });
  }
});

// Ruta para crear vistas
router.post('/create', async (req, res) => {
  try {
    const { nombreVista, consultaSQL, descripcion } = req.body;
    
    if (!nombreVista || !consultaSQL) {
      return res.status(400).json({
        success: false,
        mensaje: 'Nombre de vista y consulta SQL son requeridos'
      });
    }
    
    // Crear la vista
    const createViewQuery = `CREATE OR REPLACE VIEW ${nombreVista} AS ${consultaSQL}`;
    await query(createViewQuery);
    
    res.json({
      success: true,
      mensaje: `Vista "${nombreVista}" creada exitosamente`,
      descripcion: descripcion || 'Sin descripción',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creando vista:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error creando vista',
      error: error.message
    });
  }
});

// Ruta para listar todas las vistas
router.get('/list', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        viewname as nombre_vista,
        definition as definicion
      FROM pg_views 
      WHERE schemaname = 'public'
      ORDER BY viewname
    `);
    
    res.json({
      success: true,
      vistas: result.rows,
      total_vistas: result.rowCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error listando vistas:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error listando vistas',
      error: error.message
    });
  }
});

// Ruta para consultar una vista específica
router.get('/query/:nombreVista', async (req, res) => {
  try {
    const { nombreVista } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const result = await query(`SELECT * FROM ${nombreVista} LIMIT $1 OFFSET $2`, [limit, offset]);
    
    res.json({
      success: true,
      vista: nombreVista,
      datos: result.rows,
      total_registros: result.rowCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error consultando vista ${req.params.nombreVista}:`, error);
    res.status(500).json({
      success: false,
      mensaje: `Error consultando vista ${req.params.nombreVista}`,
      error: error.message
    });
  }
});

// Ruta para eliminar una vista
router.delete('/:nombreVista', async (req, res) => {
  try {
    const { nombreVista } = req.params;
    
    await query(`DROP VIEW IF EXISTS ${nombreVista}`);
    
    res.json({
      success: true,
      mensaje: `Vista "${nombreVista}" eliminada exitosamente`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error eliminando vista ${req.params.nombreVista}:`, error);
    res.status(500).json({
      success: false,
      mensaje: `Error eliminando vista ${req.params.nombreVista}`,
      error: error.message
    });
  }
});

module.exports = router;
