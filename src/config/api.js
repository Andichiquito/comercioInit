// Configuración de API según el ambiente
const getApiUrl = () => {
    // IMPORTANTE: En producción (Vercel), usar rutas relativas al mismo dominio
    // NODE_ENV se establece automáticamente a 'production' en Vercel
    if (process.env.NODE_ENV === 'production') {
        console.log('🚀 Modo producción: usando /api');
        return '/api';
    }

    // En desarrollo, usar variable de entorno o localhost
    const devUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    console.log('🔧 Modo desarrollo: usando', devUrl);
    return devUrl;
};

export const API_URL = getApiUrl();
export default { baseURL: API_URL };

// Log para debugging en consola del navegador
if (typeof window !== 'undefined') {
    console.log('📡 API URL configurada:', API_URL);
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
}
