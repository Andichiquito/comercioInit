// Serverless function para Vercel que maneja todas las peticiones de la API
const express = require('express');
const cors = require('cors');
const { testConnection } = require('../backend/config/database');

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
            callback(null, true);
        } else {
            callback(null, true); // Permitir todos en producción temporalmente
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/api', (req, res) => {
    res.json({
        message: '🚀 API funcionando correctamente',
        timestamp: new Date().toISOString(),
        database: 'Supabase (PostgreSQL)'
    });
});

app.get('/api/test-db', async (req, res) => {
    try {
        const isConnected = await testConnection();
        if (isConnected) {
            res.json({
                success: true,
                message: '✅ Conexión a Supabase exitosa',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                message: '❌ Error conectando a Supabase'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en la conexión',
            error: error.message
        });
    }
});

// Importar y usar rutas del backend
const authRoutes = require('../backend/routes/auth');
const usersRoutes = require('../backend/routes/users');
const dataCountRoutes = require('../backend/routes/data-count');
const viewsRoutes = require('../backend/routes/views');
const dataUploadRoutes = require('../backend/routes/data-upload');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/count', dataCountRoutes);
app.use('/api/views', viewsRoutes);
app.use('/api/data', dataUploadRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});

// Exportar para Vercel
module.exports = app;
