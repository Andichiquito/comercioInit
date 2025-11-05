import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Login = ({ onSwitchToRegister, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Limpiar error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // El contexto ya maneja el estado del usuario
        onClose?.();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Error inesperado. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="gradient-text">🔐 Iniciar Sesión</h2>
          <p>Accede a tu cuenta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">📧 Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">🔒 Contraseña</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Tu contraseña"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner-small"></div>
                Iniciando sesión...
              </>
            ) : (
              <>
                🚀 Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
              disabled={loading}
            >
              Regístrate aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
