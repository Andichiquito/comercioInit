const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Ruta para contar registros en la tabla hoja1
router.get('/hoja1', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as total FROM hoja1');
    const total = result.rows[0].total;
    
    res.json({
      success: true,
      tabla: 'hoja1',
      total_registros: parseInt(total),
      mensaje: `La tabla hoja1 tiene ${total} registros`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error contando registros en hoja1:', error);
    res.status(500).json({
      success: false,
      tabla: 'hoja1',
      mensaje: 'Error contando registros en hoja1',
      error: error.message
    });
  }
});

// Ruta para contar registros en la tabla usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as total FROM usuarios');
    const total = result.rows[0].total;
    
    res.json({
      success: true,
      tabla: 'usuarios',
      total_registros: parseInt(total),
      mensaje: `La tabla usuarios tiene ${total} registros`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error contando registros en usuarios:', error);
    res.status(500).json({
      success: false,
      tabla: 'usuarios',
      mensaje: 'Error contando registros en usuarios',
      error: error.message
    });
  }
});

// Ruta para contar registros en ambas tablas
router.get('/ambas', async (req, res) => {
  try {
    const [hoja1Result, usuariosResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM hoja1'),
      query('SELECT COUNT(*) as total FROM usuarios')
    ]);
    
    const totalHoja1 = parseInt(hoja1Result.rows[0].total);
    const totalUsuarios = parseInt(usuariosResult.rows[0].total);
    
    res.json({
      success: true,
      tablas: {
        hoja1: {
          total_registros: totalHoja1,
          mensaje: `La tabla hoja1 tiene ${totalHoja1} registros`
        },
        usuarios: {
          total_registros: totalUsuarios,
          mensaje: `La tabla usuarios tiene ${totalUsuarios} registros`
        }
      },
      resumen: {
        total_general: totalHoja1 + totalUsuarios,
        mensaje: `En total hay ${totalHoja1 + totalUsuarios} registros entre ambas tablas`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error contando registros en ambas tablas:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error contando registros en las tablas',
      error: error.message
    });
  }
});

// Ruta para obtener información detallada de las tablas
router.get('/info', async (req, res) => {
  try {
    // Verificar si las tablas existen
    const tablasExistentes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('hoja1', 'usuarios')
    `);
    
    const tablasEncontradas = tablasExistentes.rows.map(row => row.table_name);
    
    const resultados = {};
    
    // Contar registros en cada tabla existente
    for (const tabla of tablasEncontradas) {
      try {
        const result = await query(`SELECT COUNT(*) as total FROM ${tabla}`);
        resultados[tabla] = {
          existe: true,
          total_registros: parseInt(result.rows[0].total)
        };
      } catch (error) {
        resultados[tabla] = {
          existe: true,
          error: error.message
        };
      }
    }
    
    // Verificar tablas que no existen
    if (!tablasEncontradas.includes('hoja1')) {
      resultados.hoja1 = { existe: false, mensaje: 'La tabla hoja1 no existe' };
    }
    if (!tablasEncontradas.includes('usuarios')) {
      resultados.usuarios = { existe: false, mensaje: 'La tabla usuarios no existe' };
    }
    
    res.json({
      success: true,
      tablas_encontradas: tablasEncontradas,
      resultados,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo información de tablas:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error obteniendo información de las tablas',
      error: error.message
    });
  }
});

module.exports = router;
