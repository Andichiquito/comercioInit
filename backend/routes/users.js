const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Aplicar autenticación y autorización de admin a todas las rutas
router.use(authenticateToken);
router.use(requireAdmin);

// Obtener todos los usuarios (con paginación)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = '';
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause = `WHERE (nombre ILIKE $${paramCount} OR apellido ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Obtener usuarios
    const usersQuery = `
      SELECT 
        id, email, nombre, apellido, rol, activo, 
        fecha_registro, ultimo_acceso, created_at, updated_at
      FROM usuarios 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    const users = await query(usersQuery, queryParams);

    // Obtener total de usuarios
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM usuarios 
      ${whereClause}
    `;
    
    const countParams = search ? [`%${search}%`] : [];
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        id, email, nombre, apellido, rol, activo, 
        fecha_registro, ultimo_acceso, created_at, updated_at
       FROM usuarios 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { email, password, nombre, apellido, rol = 'cliente' } = req.body;

    // Validaciones
    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (!['admin', 'cliente'].includes(rol)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Debe ser "admin" o "cliente"'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar nuevo usuario
    const result = await query(
      `INSERT INTO usuarios (email, password_hash, nombre, apellido, rol, activo, fecha_registro, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, email, nombre, apellido, rol, activo, fecha_registro`,
      [email.toLowerCase(), passwordHash, nombre, apellido, rol]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: newUser
      }
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar usuario
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nombre, apellido, rol, activo, password } = req.body;

    // Verificar que el usuario existe
    const existingUser = await query(
      'SELECT id FROM usuarios WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (email !== undefined) {
      // Verificar si el email ya existe en otro usuario
      const emailCheck = await query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email.toLowerCase(), id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso por otro usuario'
        });
      }

      paramCount++;
      updates.push(`email = $${paramCount}`);
      values.push(email.toLowerCase());
    }

    if (nombre !== undefined) {
      paramCount++;
      updates.push(`nombre = $${paramCount}`);
      values.push(nombre);
    }

    if (apellido !== undefined) {
      paramCount++;
      updates.push(`apellido = $${paramCount}`);
      values.push(apellido);
    }

    if (rol !== undefined) {
      if (!['admin', 'cliente'].includes(rol)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido. Debe ser "admin" o "cliente"'
        });
      }
      paramCount++;
      updates.push(`rol = $${paramCount}`);
      values.push(rol);
    }

    if (activo !== undefined) {
      paramCount++;
      updates.push(`activo = $${paramCount}`);
      values.push(activo);
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }
      paramCount++;
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramCount}`);
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

        // Agregar updated_at (no es parámetro) y el ID
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        paramCount++;
        values.push(id);

        const updateQuery = `
          UPDATE usuarios 
          SET ${updates.join(', ')}
          WHERE id = $${paramCount}
          RETURNING id, email, nombre, apellido, rol, activo, fecha_registro, ultimo_acceso, updated_at
        `;

    const result = await query(updateQuery, values);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        user: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar usuario (soft delete - desactivar)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const existingUser = await query(
      'SELECT id, email FROM usuarios WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir que un admin se elimine a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    // Eliminar usuario completamente (hard delete)
    await query(
      'DELETE FROM usuarios WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Usuario eliminado permanentemente'
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Reactivar usuario
router.patch('/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE usuarios SET activo = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, nombre, apellido, rol, activo',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario reactivado exitosamente',
      data: {
        user: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Error reactivando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
