const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { query, getClient } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Ruta de prueba para verificar que el router funciona
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Ruta de carga de datos está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12' // .xlsm
    ];
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.match(/\.(xlsx|xls|xlsm)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls, .xlsm)'), false);
    }
  }
});

// Función para obtener la estructura de la tabla hoja1
const getTableStructure = async (client = null) => {
  try {
    const queryFn = client ? client.query.bind(client) : query;
    const result = await queryFn(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'hoja1' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo estructura de tabla:', error);
    throw error;
  }
};

// Función para limpiar y normalizar nombres de columnas
const normalizeColumnName = (name) => {
  if (!name) return null;
  // Convertir a string, eliminar espacios extra, convertir a minúsculas
  return String(name).trim().toLowerCase();
};

// Función para mapear datos del Excel a la estructura de la base de datos
const mapExcelToDB = async (excelHeaders) => {
  const tableStructure = await getTableStructure();
  const dbColumns = tableStructure.map(col => col.column_name);
  
  console.log(`\n📋 Columnas en la base de datos (${dbColumns.length}):`);
  dbColumns.forEach((col, idx) => {
    console.log(`   ${idx + 1}. ${col}`);
  });
  
  console.log(`\n📋 Columnas en el Excel (${excelHeaders.length}):`);
  excelHeaders.forEach((col, idx) => {
    console.log(`   ${idx + 1}. ${col || '(vacío)'}`);
  });
  
  // Crear mapa de columnas Excel -> DB
  const columnMap = {};
  const unmappedColumns = [];
  const usedDbColumns = new Set(); // Evitar mapear múltiples columnas Excel a la misma columna DB
  
  // Mapeo manual para casos específicos conocidos
  const manualMapping = {
    'codigo de la aduana de despacho': 'codigo_de_la_aduana_de_despacho',
    'descripcion de la aduana de despacho': 'descripcion_de_la_aduana_de_despacho',
    'gestion': 'gestion',
    'mes': 'mes',
    'tipo de operación: exportación, reexportación o efectos personales.': 'tipo_de_operacion_exportacion_reexportacion_o_efectos_personale',
    'código arancelario nandina (norma de clasificación de productos en la can).': 'codigo_arancelario_nandina_norma_de_clasificacion_de_productos_',
    'descripción del producto según código nandina.': 'descripcion_del_producto_segun_codigo_nandina',
    'capítulo de la clasificación nandina (primeros 2 dígitos).': 'capitulo_de_la_clasificacion_nandina_primeros_2_digitos',
    'descripción del capítulo nandina.': 'descripcion_del_capitulo_nandina',
    'sección de la clasificación nandina.': 'seccion_de_la_clasificacion_nandina',
    'descripción de la sección nandina.': 'descripcion_de_la_seccion_nandina',
    'código del país de destino.': 'codigo_del_pais_de_destino',
    'nombre del país de destino.': 'nombre_del_pais_de_destino',
    'código de zona geoeconómica.': 'codigo_de_zona_geoeconomica',
    'descripción de zona geoeconómica (can, mercosur, nafta, etc.).': 'descripcion_de_zona_geoeconomica_can_mercosur_nafta_etc',
    'medi': 'medi',
    'descripción del medio de transporte (aéreo, terrestre, marítimo, etc.).': 'descripcion_del_medio_de_transporte_aereo_terrestre_maritimo_et',
    'código de la vía de salida (puerto, aeropuerto, frontera).': 'codigo_de_la_via_de_salida_puerto_aeropuerto_frontera',
    'descripción de la vía de salida.': 'descripcion_de_la_via_de_salida',
    'código del departamento de origen.': 'codigo_del_departamento_de_origen',
    'descripción del departamento de origen.': 'descripcion_del_departamento_de_origen',
    'cuci3': 'cuci3',
    'descuci3': 'descuci3',
    'gce3': 'gce3',
    'desgce3': 'desgce3',
    'ciiur3': 'ciiur3',
    'descripción de la clasificación ciiu rev.3.': 'descripcion_de_la_clasificacion_ciiu_rev3',
    'clasificación por actividad económica (texto).': 'clasificacion_por_actividad_economica_texto',
    'codact2': 'codact2',
    'descripción del producto según actividad económica.': 'descripcion_del_producto_segun_actividad_economica',
    'tnt': 'tnt',
    'destnt': 'destnt',
    'cltnt': 'cltnt',
    'peso bruto (kg).': 'peso_bruto_kg',
    'peso neto (kg).': 'peso_neto_kg',
    'contenido fino (en caso de minerales u otros productos que requieran pureza).': 'contenido_fino_en_caso_de_minerales_u_otros_productos_que_requi',
    'valor fob (en dólares estadounidenses).': 'valor_fob_en_dolares_estadounidenses'
  };
  
  excelHeaders.forEach((excelHeader, index) => {
    if (!excelHeader) {
      unmappedColumns.push({ index, excelHeader: '(vacío)', reason: 'Header vacío' });
      return; // Saltar headers vacíos
    }
    
    const normalizedExcelHeader = normalizeColumnName(excelHeader);
    let dbColumn = null;
    
    // 1. Intentar mapeo manual primero
    if (manualMapping[normalizedExcelHeader]) {
      dbColumn = manualMapping[normalizedExcelHeader];
    }
    
    // 2. Si no hay mapeo manual, buscar coincidencia exacta
    if (!dbColumn) {
      dbColumn = dbColumns.find(dbCol => {
        const normalizedDbCol = normalizeColumnName(dbCol);
        return normalizedDbCol === normalizedExcelHeader;
      });
    }
    
    // 3. Si no hay coincidencia exacta, buscar por palabras clave importantes
    if (!dbColumn) {
      // Extraer palabras clave del header Excel
      const excelKeywords = normalizedExcelHeader
        .replace(/[()]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['del', 'de', 'la', 'las', 'los', 'en', 'por', 'según'].includes(w));
      
      // Buscar columna DB que contenga todas las palabras clave importantes
      dbColumn = dbColumns.find(dbCol => {
        if (usedDbColumns.has(dbCol)) return false; // Ya está mapeada
        if (dbCol === 'id') return false; // Evitar mapear a 'id' automáticamente
        
        const normalizedDbCol = normalizeColumnName(dbCol);
        
        // Verificar si todas las palabras clave importantes están en la columna DB
        const allKeywordsMatch = excelKeywords.every(keyword => 
          normalizedDbCol.includes(keyword) || keyword.includes(normalizedDbCol)
        );
        
        if (allKeywordsMatch && excelKeywords.length > 0) {
          return true;
        }
        
        // Coincidencia parcial más estricta (al menos 70% de coincidencia)
        const excelParts = normalizedExcelHeader.replace(/[_-]/g, ' ').split(/\s+/).filter(p => p.length > 2);
        const dbParts = normalizedDbCol.replace(/[_-]/g, ' ').split(/\s+/).filter(p => p.length > 2);
        
        if (excelParts.length === 0 || dbParts.length === 0) return false;
        
        const matchingParts = excelParts.filter(part => 
          dbParts.some(dbPart => dbPart.includes(part) || part.includes(dbPart))
        );
        
        // Requerir al menos 70% de coincidencia y que no sea 'id'
        const matchRatio = matchingParts.length / Math.min(excelParts.length, dbParts.length);
        return matchRatio >= 0.7;
      });
    }
    
    // 4. Si encontramos una columna, verificar que no esté ya mapeada
    if (dbColumn && usedDbColumns.has(dbColumn)) {
      dbColumn = null; // Ya está mapeada, buscar otra
    }
    
    if (dbColumn) {
      columnMap[index] = dbColumn;
      usedDbColumns.add(dbColumn); // Marcar como usada
      console.log(`✅ Mapeado: "${excelHeader}" (col ${index}) -> "${dbColumn}"`);
    } else {
      unmappedColumns.push({ index, excelHeader, reason: 'No se encontró coincidencia' });
      console.log(`⚠️  No mapeado: "${excelHeader}" (col ${index})`);
    }
  });
  
  console.log(`\n📊 Resumen de mapeo:`);
  console.log(`   ✅ Mapeadas: ${Object.keys(columnMap).length} de ${excelHeaders.length}`);
  console.log(`   ⚠️  No mapeadas: ${unmappedColumns.length}`);
  
  if (unmappedColumns.length > 0) {
    console.log(`\n⚠️  Columnas del Excel que no se mapearon:`);
    unmappedColumns.forEach(({ index, excelHeader, reason }) => {
      console.log(`   - Columna ${index}: "${excelHeader}" (${reason})`);
    });
  }
  
  return { columnMap, dbColumns, unmappedColumns };
};

// Función para convertir valores según el tipo de dato
const convertValue = (value, dataType) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Si el tipo de dato es numérico (numeric, integer, double precision, etc.)
  if (dataType.includes('numeric') || dataType.includes('integer') || dataType.includes('double') || dataType.includes('real') || dataType.includes('decimal')) {
    // Si ya es un número, retornarlo
    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }
    
    // Si es string, intentar convertir
    if (typeof value === 'string') {
      // Limpiar el string de caracteres no numéricos (excepto punto y signo negativo)
      const cleaned = value.trim().replace(/[^0-9.-]/g, '');
      if (cleaned === '' || cleaned === '-' || cleaned === '.') {
        return null;
      }
      const numValue = parseFloat(cleaned);
      return isNaN(numValue) ? null : numValue;
    }
    
    // Si no se puede convertir, retornar null
    return null;
  }
  
  // Si es fecha
  if (dataType.includes('date') || dataType.includes('timestamp')) {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'number') {
      // Excel almacena fechas como números
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 86400000);
      return date;
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }
  
  // Si es booleano
  if (dataType.includes('boolean')) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      return lower === 'true' || lower === '1' || lower === 'si' || lower === 'sí' || lower === 'yes';
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return Boolean(value);
  }
  
  // Para texto y otros tipos, convertir a string y limpiar
  if (typeof value === 'string') {
    return value.trim();
  }
  
  // Convertir otros tipos a string
  return String(value);
};

// Ruta para cargar datos desde Excel
router.post('/upload', authenticateToken, requireAdmin, upload.single('excelFile'), async (req, res) => {
  console.log('\n📤 ========================================');
  console.log('📤 POST /api/data/upload - RUTA RECIBIDA');
  console.log('📤 ========================================\n');
  let client;
  
  try {
    console.log('📤 Iniciando carga de datos desde Excel...');
    
    // Verificar conexión a la base de datos
    console.log('🔌 Verificando conexión a la base de datos...');
    client = await getClient();
    
    // Probar la conexión
    const connectionTest = await client.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log('✅ Conexión verificada:', {
      database: connectionTest.rows[0].db_name,
      time: connectionTest.rows[0].current_time
    });
    
    // Verificar que la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hoja1'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.error('❌ La tabla hoja1 no existe');
      return res.status(400).json({
        success: false,
        message: 'La tabla hoja1 no existe en la base de datos'
      });
    }
    
    console.log('✅ Tabla hoja1 existe');
    
    // ============================================
    // PASO 1: HACER TRUNCATE PRIMERO (ANTES DE TODO)
    // ============================================
    console.log('\n');
    console.log('========================================');
    console.log('🗑️ PASO 1: TRUNCATE DE LA TABLA hoja1');
    console.log('========================================');
    
    // Verificar cuántos registros hay antes del truncate
    console.log('📊 Contando registros antes del TRUNCATE...');
    const countBefore = await client.query('SELECT COUNT(*) as total FROM hoja1');
    const countBeforeNum = parseInt(countBefore.rows[0].total);
    console.log(`📊 Registros ANTES del truncate: ${countBeforeNum}`);
    
    // Hacer TRUNCATE INMEDIATAMENTE - SIN TRANSACCIÓN
    console.log('🗑️ EJECUTANDO TRUNCATE TABLE hoja1 RESTART IDENTITY CASCADE...');
    console.log('🗑️ Este comando se ejecuta AHORA, antes de procesar el Excel');
    
    try {
      const truncateResult = await client.query('TRUNCATE TABLE hoja1 RESTART IDENTITY CASCADE');
      console.log('✅✅✅ TRUNCATE EJECUTADO EXITOSAMENTE ✅✅✅');
      console.log('✅ Resultado del TRUNCATE:', truncateResult);
      
      // Verificar que el truncate funcionó
      console.log('📊 Verificando que la tabla quedó vacía...');
      const countAfterTruncate = await client.query('SELECT COUNT(*) as total FROM hoja1');
      const countAfter = parseInt(countAfterTruncate.rows[0].total);
      console.log(`📊 Registros DESPUÉS del truncate: ${countAfter}`);
      
      if (countAfter !== 0) {
        console.error(`❌ ERROR: El TRUNCATE no eliminó todos los registros. Quedan ${countAfter} registros.`);
        throw new Error(`El TRUNCATE no eliminó todos los registros. Quedan ${countAfter} registros.`);
      }
      
      console.log('✅✅✅ TRUNCATE EXITOSO - La tabla está COMPLETAMENTE VACÍA ✅✅✅');
      console.log('✅ La tabla hoja1 ahora tiene 0 registros');
      console.log('========================================\n');
    } catch (truncateError) {
      console.error('\n');
      console.error('========================================');
      console.error('❌❌❌ ERROR EN TRUNCATE - OPERACIÓN DETENIDA ❌❌❌');
      console.error('========================================');
      console.error('❌ Mensaje:', truncateError.message);
      console.error('❌ Código PostgreSQL:', truncateError.code);
      console.error('❌ Detalle:', truncateError.detail);
      console.error('❌ Stack:', truncateError.stack);
      console.error('========================================');
      console.error('❌ NO SE PROCESARÁ EL ARCHIVO EXCEL');
      console.error('❌ LA OPERACIÓN SE DETIENE AQUÍ');
      console.error('========================================\n');
      
      // Cerrar conexión antes de retornar error
      if (client) {
        client.release();
      }
      
      const truncateErr = new Error(`ERROR EN TRUNCATE: ${truncateError.message}. Código: ${truncateError.code || 'N/A'}. Detalle: ${truncateError.detail || 'Sin detalles'}`);
      truncateErr.code = truncateError.code;
      truncateErr.detail = truncateError.detail;
      return res.status(500).json({
        success: false,
        message: 'Error al ejecutar TRUNCATE en la tabla hoja1',
        error: truncateErr.message,
        code: truncateError.code,
        detail: truncateError.detail
      });
    }
    
    // ============================================
    // PASO 2: PROCESAR EL ARCHIVO EXCEL (SOLO SI EL TRUNCATE FUE EXITOSO)
    // ============================================
    console.log('📄 ========== PASO 2: PROCESANDO ARCHIVO EXCEL ==========');
    
    if (!req.file) {
      console.error('❌ No se proporcionó ningún archivo');
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    console.log(`📄 Archivo recibido: ${req.file.originalname}, tamaño: ${req.file.size} bytes`);

    // Leer el archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Usar la primera hoja
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📊 Hoja de cálculo: ${sheetName}`);
    
    // Convertir a JSON
    const excelData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: null,
      raw: false
    });
    
    if (excelData.length === 0) {
      console.error('❌ El archivo Excel está vacío');
      return res.status(400).json({
        success: false,
        message: 'El archivo Excel está vacío'
      });
    }
    
    // Primera fila son los headers
    const excelHeaders = excelData[0];
    const dataRows = excelData.slice(1).filter(row => {
      // Filtrar filas completamente vacías
      return row.some(cell => cell !== null && cell !== undefined && cell !== '');
    });
    
    console.log(`📋 Headers encontrados: ${excelHeaders.length}`);
    console.log(`📋 Filas de datos: ${dataRows.length}`);
    
    if (dataRows.length === 0) {
      console.error('❌ No hay datos en el archivo Excel (solo headers)');
      return res.status(400).json({
        success: false,
        message: 'No hay datos en el archivo Excel (solo headers)'
      });
    }
    
    // Obtener estructura de la tabla y mapear columnas
    console.log('\n🔍 Mapeando columnas del Excel a la base de datos...');
    const { columnMap, dbColumns, unmappedColumns } = await mapExcelToDB(excelHeaders);
    
    console.log(`\n✅ Columnas mapeadas: ${Object.keys(columnMap).length} de ${excelHeaders.length}`);
    console.log('📝 Mapeo completo:', JSON.stringify(columnMap, null, 2));
    
    if (Object.keys(columnMap).length === 0) {
      console.error('❌ No se pudo mapear ninguna columna');
      return res.status(400).json({
        success: false,
        message: 'No se pudo mapear ninguna columna del Excel con la estructura de la base de datos',
        excelHeaders: excelHeaders,
        dbColumns: dbColumns,
        unmappedColumns: unmappedColumns
      });
    }
    
    // Advertencia si hay muchas columnas sin mapear
    if (unmappedColumns.length > 0) {
      console.warn(`\n⚠️  ADVERTENCIA: ${unmappedColumns.length} columnas del Excel no se mapearon.`);
      console.warn('   Estas columnas se ignorarán durante la inserción.');
    }
    
    // Obtener información de tipos de datos
    console.log('📋 Obteniendo estructura de la tabla...');
    const tableStructure = await getTableStructure(client);
    const columnTypes = {};
    tableStructure.forEach(col => {
      columnTypes[col.column_name] = col.data_type;
    });
    
    // Preparar datos para inserción
    const insertColumns = Object.values(columnMap).filter((v, i, a) => a.indexOf(v) === i); // Columnas únicas
    const placeholders = insertColumns.map((_, i) => `$${i + 1}`).join(', ');
    const insertQuery = `INSERT INTO hoja1 (${insertColumns.join(', ')}) VALUES (${placeholders})`;
    
    console.log(`📝 Query de inserción preparado para ${insertColumns.length} columnas`);
    console.log(`📝 Columnas: ${insertColumns.join(', ')}`);
    
    // ============================================
    // PASO 3: INSERTAR DATOS FILA POR FILA
    // ============================================
    console.log('\n🚀 ========== PASO 3: INSERTANDO DATOS FILA POR FILA ==========');
    
    // Iniciar transacción SOLO para las inserciones
    console.log('🔄 Iniciando transacción para inserción de datos...');
    let transactionStarted = false;
    
    try {
      await client.query('BEGIN');
      transactionStarted = true;
      console.log('✅ Transacción iniciada');
      
      let insertedRows = 0;
      let errorRows = 0;
      const errors = [];
      
      // Insertar datos fila por fila para capturar errores específicos
      console.log(`🚀 Iniciando inserción de ${dataRows.length} filas (una por una para mejor diagnóstico)...`);
      console.log(`📝 Query que se usará: INSERT INTO hoja1 (${insertColumns.join(', ')}) VALUES (${placeholders})`);
      
      // Probar con la primera fila para capturar el error inmediatamente
      if (dataRows.length > 0) {
        console.log('🧪 Probando inserción con la primera fila para validar...');
        const testRow = dataRows[0];
        const testValues = insertColumns.map(col => {
          const excelIndex = Object.keys(columnMap).find(key => columnMap[key] === col);
          const excelValue = excelIndex !== undefined ? testRow[parseInt(excelIndex)] : null;
          const dataType = columnTypes[col] || 'text';
          return convertValue(excelValue, dataType);
        });
        
        console.log('📋 Valores de prueba:', testValues);
        console.log('📋 Columnas:', insertColumns);
        
        try {
          await client.query(insertQuery, testValues);
          console.log('✅ Primera fila insertada correctamente. Continuando con el resto...');
          insertedRows++;
        } catch (firstRowError) {
          // CAPTURAR EL ERROR REAL DE LA PRIMERA FILA
          const errorInfo = {
            message: firstRowError.message,
            code: firstRowError.code,
            detail: firstRowError.detail,
            position: firstRowError.position,
            column: firstRowError.column,
            constraint: firstRowError.constraint,
            table: firstRowError.table,
            schema: firstRowError.schema
          };
          
          console.error('\n❌❌❌ ERROR EN LA PRIMERA FILA - ESTE ES EL ERROR REAL ❌❌❌');
          console.error(`❌ Mensaje:`, errorInfo.message);
          console.error(`❌ Código PostgreSQL:`, errorInfo.code);
          console.error(`❌ Detalle:`, errorInfo.detail);
          console.error(`❌ Posición en query:`, errorInfo.position);
          console.error(`❌ Columna problemática:`, errorInfo.column);
          console.error(`❌ Constraint:`, errorInfo.constraint);
          console.error(`❌ Tabla:`, errorInfo.table);
          console.error(`❌ Columnas insertadas:`, insertColumns);
          console.error(`❌ Valores:`, JSON.stringify(testValues, null, 2));
          console.error(`❌ Datos originales:`, testRow);
          console.error(`❌ Query completo:`, insertQuery);
          console.error('❌❌❌ FIN DEL ERROR REAL ❌❌❌\n');
          
          // Hacer ROLLBACK inmediatamente
          try {
            await client.query('ROLLBACK');
            console.error('✅ ROLLBACK completado');
          } catch (rollbackErr) {
            console.error('❌ Error en ROLLBACK:', rollbackErr.message);
          }
          
          // Crear error mejorado con toda la información
          const detailedError = new Error(
            `ERROR EN PRIMERA FILA: ${errorInfo.message || 'Error desconocido'}. ` +
            `Código PostgreSQL: ${errorInfo.code || 'N/A'}. ` +
            `Detalle: ${errorInfo.detail || 'Sin detalles'}. ` +
            (errorInfo.column ? `Columna problemática: ${errorInfo.column}. ` : '') +
            (errorInfo.constraint ? `Constraint: ${errorInfo.constraint}. ` : '')
          );
          
          // Agregar información adicional al error
          detailedError.code = errorInfo.code;
          detailedError.detail = errorInfo.detail;
          detailedError.column = errorInfo.column;
          detailedError.constraint = errorInfo.constraint;
          detailedError.insertColumns = insertColumns;
          detailedError.testValues = testValues;
          
          throw detailedError;
        }
      }
      
      // Continuar con el resto de las filas
      for (let i = 1; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowIndex = i;
        
        try {
          // Preparar valores para esta fila
          const values = insertColumns.map(col => {
            const excelIndex = Object.keys(columnMap).find(key => columnMap[key] === col);
            const excelValue = excelIndex !== undefined ? row[parseInt(excelIndex)] : null;
            const dataType = columnTypes[col] || 'text';
            return convertValue(excelValue, dataType);
          });
          
          // Insertar la fila
          await client.query(insertQuery, values);
          insertedRows++;
          
          // Log progreso cada 100 filas
          if (insertedRows % 100 === 0) {
            console.log(`✅ ${insertedRows} filas insertadas...`);
          }
        } catch (rowError) {
          // Si la transacción está abortada, el error real ya se mostró
          if (rowError.message && rowError.message.includes('abortada')) {
            console.error('❌ Transacción abortada. El error real fue en una fila anterior.');
            try {
              await client.query('ROLLBACK');
            } catch (rollbackErr) {
              // Ignorar
            }
            throw new Error('Transacción abortada. Revisa los logs anteriores para el error específico.');
          }
          
          // Otros errores
          errorRows++;
          errors.push({
            row: rowIndex + 2,
            error: rowError.message,
            code: rowError.code,
            detail: rowError.detail
          });
          
          if (errors.length <= 5) {
            console.error(`❌ Error en fila ${rowIndex + 2}:`, rowError.message);
          }
          
          if (errors.length >= 50) {
            console.error('❌ Demasiados errores, deteniendo inserción');
            throw new Error(`Demasiados errores. Primer error en fila ${errors[0].row}: ${errors[0].error}`);
          }
        }
      }
      
      console.log(`✅ Inserción completada: ${insertedRows} filas insertadas, ${errorRows} errores`);
      
      // Verificar cuántos registros hay después de la inserción
      console.log('📊 Verificando registros insertados...');
      try {
        const countAfterInsert = await client.query('SELECT COUNT(*) as total FROM hoja1');
        console.log(`📊 Registros después de la inserción: ${countAfterInsert.rows[0].total}`);
      } catch (countError) {
        console.error('❌ Error verificando conteo (transacción puede estar abortada):', countError.message);
        if (countError.message && countError.message.includes('abortada')) {
          await client.query('ROLLBACK');
          throw new Error('La transacción fue abortada durante la inserción. Revisa los logs anteriores para el error específico.');
        }
      }
      
      // Confirmar transacción
      console.log('💾 Confirmando transacción...');
      try {
        await client.query('COMMIT');
        console.log('✅ Transacción confirmada');
      } catch (commitError) {
        console.error('❌ Error en COMMIT:', commitError.message);
        if (commitError.message && commitError.message.includes('abortada')) {
          console.error('❌ La transacción ya estaba abortada. Haciendo ROLLBACK...');
          try {
            await client.query('ROLLBACK');
          } catch (rollbackErr) {
            console.error('❌ Error en ROLLBACK:', rollbackErr.message);
          }
          throw new Error('La transacción fue abortada. Revisa los logs del servidor para encontrar el error específico que causó el aborto.');
        }
        throw commitError;
      }
      
      // Verificar final después del commit
      const countFinal = await client.query('SELECT COUNT(*) as total FROM hoja1');
      console.log(`📊 Registros finales después del commit: ${countFinal.rows[0].total}`);
      
      if (parseInt(countFinal.rows[0].total) !== insertedRows) {
        console.warn(`⚠️ Advertencia: Se insertaron ${insertedRows} filas pero hay ${countFinal.rows[0].total} registros en la tabla`);
      }
      
      res.json({
        success: true,
        message: `Datos cargados exitosamente`,
        data: {
          totalRows: dataRows.length,
          insertedRows,
          errorRows,
          recordsInDB: parseInt(countFinal.rows[0].total),
          errors: errors.slice(0, 10), // Solo mostrar primeros 10 errores
          columnMapping: columnMap,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      // Revertir transacción en caso de error
      console.error('❌ Error en transacción:', error.message);
      console.error('❌ Stack:', error.stack);
      
      if (transactionStarted) {
        try {
          console.log('🔄 Haciendo ROLLBACK de la transacción...');
          await client.query('ROLLBACK');
          console.log('✅ ROLLBACK completado');
        } catch (rollbackError) {
          console.error('❌ Error haciendo ROLLBACK:', rollbackError.message);
        }
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('\n❌❌❌ ERROR FINAL EN CARGA DE DATOS ❌❌❌');
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌❌❌ FIN DEL ERROR ❌❌❌\n');
    
    // Si hay un cliente y está en una transacción, hacer rollback
    if (client) {
      try {
        // Intentar hacer ROLLBACK sin verificar (más seguro)
        console.log('🔄 Intentando ROLLBACK...');
        await client.query('ROLLBACK');
        console.log('✅ ROLLBACK completado');
      } catch (rollbackError) {
        // Si el rollback falla, probablemente ya no estamos en transacción
        console.warn('⚠️ No se pudo hacer ROLLBACK:', rollbackError.message);
      }
    }
    
    // Enviar error detallado al frontend
    const errorMessage = error.message || 'Error desconocido';
    const errorCode = error.code || 'N/A';
    const errorDetail = error.detail || 'Sin detalles adicionales';
    
    // Construir mensaje de error más descriptivo
    let userFriendlyMessage = errorMessage;
    
    if (errorCode === '42703') {
      userFriendlyMessage = `Columna no existe en la tabla: ${error.column || 'desconocida'}`;
    } else if (errorCode === '23502') {
      userFriendlyMessage = `Campo requerido está vacío: ${error.column || 'desconocido'}`;
    } else if (errorCode === '23503') {
      userFriendlyMessage = `Violación de clave foránea: ${error.detail || 'valor no existe en tabla referenciada'}`;
    } else if (errorCode === '23505') {
      userFriendlyMessage = `Valor duplicado: ${error.detail || 'ya existe en la tabla'}`;
    } else if (errorCode === '22P02') {
      userFriendlyMessage = `Tipo de dato incorrecto: ${error.detail || 'el valor no coincide con el tipo de columna'}`;
    } else if (error.message && error.message.includes('abortada')) {
      userFriendlyMessage = `La transacción fue abortada. Error original: ${error.detail || errorMessage}. Revisa los logs del servidor.`;
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al cargar los datos',
      error: userFriendlyMessage,
      code: errorCode,
      detail: errorDetail,
      column: error.column,
      constraint: error.constraint,
      insertColumns: error.insertColumns,
      hint: 'Revisa la consola del servidor para ver los logs completos con el error específico',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (client) {
      client.release();
      console.log('🔓 Cliente de base de datos liberado');
    }
  }
});

// Ruta para obtener información sobre la estructura esperada
router.get('/structure', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const structure = await getTableStructure();
    
    res.json({
      success: true,
      table: 'hoja1',
      columns: structure.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.column_default
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo estructura:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estructura de la tabla',
      error: error.message
    });
  }
});

module.exports = router;

