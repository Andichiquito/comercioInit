// Configuración de API según el ambiente
const getApiUrl = () => {
    // En producción (Vercel), usar rutas relativas
    if (process.env.NODE_ENV === 'production') {
        return '/api';
    }
    // En desarrollo, usar variable de entorno o localhost
    return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();
export default { baseURL: API_URL };
