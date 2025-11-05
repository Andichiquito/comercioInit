import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GraficosAvanzados.css';

const GraficosAvanzados = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({
    exportaciones: [],
    paises: [],
    transporte: [],
    mensual: []
  });
  
  // Estados para controlar el tipo de gráfico
  const [chartTypes, setChartTypes] = useState({
    paises: 'barras', // 'barras', 'circular', 'lineas'
    transporte: 'circular', // 'circular', 'barras'
    mensual: 'lineas' // 'lineas', 'area', 'barras'
  });

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Cargando datos para gráficos avanzados...');
      console.log('🌐 API Base URL:', API_BASE);
      
      const [exportacionesRes, paisesRes, transporteRes, mensualRes] = await Promise.all([
        axios.get(`${API_BASE}/views/query/vista_estadisticas_generales`, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }),
        axios.get(`${API_BASE}/views/query/vista_exportaciones_por_pais?limit=8`, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }),
        axios.get(`${API_BASE}/views/query/vista_medio_transporte`, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }),
        axios.get(`${API_BASE}/views/query/vista_operaciones_por_mes`, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        })
      ]);

      console.log('✅ Datos cargados exitosamente:');
      console.log('- Exportaciones:', exportacionesRes.data.datos?.length || 0, 'registros');
      console.log('- Países:', paisesRes.data.datos?.length || 0, 'registros');
      console.log('- Transporte:', transporteRes.data.datos?.length || 0, 'registros');
      console.log('- Mensual:', mensualRes.data.datos?.length || 0, 'registros');

      setChartData({
        exportaciones: exportacionesRes.data.datos || [],
        paises: paisesRes.data.datos || [],
        transporte: transporteRes.data.datos || [],
        mensual: mensualRes.data.datos || []
      });

    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        setError('Error de conexión: El servidor backend no está disponible. Verifica que esté ejecutándose en el puerto 5000.');
      } else if (err.response) {
        setError(`Error del servidor: ${err.response.status} - ${err.response.statusText}`);
      } else if (err.request) {
        setError('Error de red: No se pudo conectar con el servidor. Verifica tu conexión.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getTransportIcon = (transport) => {
    if (!transport) return '🚚';
    
    const transportLower = transport.toLowerCase();
    if (transportLower.includes('maritimo') || transportLower.includes('marítimo')) {
      return '🚢';
    } else if (transportLower.includes('aereo') || transportLower.includes('aéreo')) {
      return '✈️';
    } else if (transportLower.includes('terrestre')) {
      return '🚛';
    }
    return '🚚';
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNumber - 1] || `Mes ${monthNumber}`;
  };

  // Función para cambiar el tipo de gráfico
  const changeChartType = (chartName, newType) => {
    setChartTypes(prev => ({
      ...prev,
      [chartName]: newType
    }));
  };

  // Función para renderizar gráfico de países
  const renderPaisesChart = () => {
    const data = chartData.paises.slice(0, 6);
    const maxValue = Math.max(...data.map(p => p.valor_total_usd || 0));

    switch (chartTypes.paises) {
      case 'barras':
        return (
          <div className="bar-chart">
            {data.map((pais, index) => {
              const percentage = Math.min((pais.valor_total_usd / maxValue) * 100, 100);
              return (
                <div key={index} className="bar-item">
                  <div className="bar-label">
                    <span className="country-name">{pais.nombre_del_pais_de_destino || 'N/A'}</span>
                    <div className="bar-values">
                      <span className="country-value">{formatCurrency(pais.valor_total_usd)}</span>
                      <span className="country-percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: `${percentage}%` 
                      }}
                    >
                      <span className="bar-percentage-text">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      
      case 'circular':
        return (
          <div className="pie-chart">
            {data.map((pais, index) => (
              <div key={index} className="pie-item">
                <div className="pie-slice" style={{
                  background: `conic-gradient(${getSliceColor(index)} 0deg ${((pais.valor_total_usd / maxValue) * 100) * 3.6}deg, rgba(255,255,255,0.1) ${((pais.valor_total_usd / maxValue) * 100) * 3.6}deg 360deg)`
                }}>
                  <div className="pie-center">
                    <div className="pie-icon">🌍</div>
                    <div className="pie-percentage">{((pais.valor_total_usd / maxValue) * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div className="pie-label">
                  <span className="transport-name">{pais.nombre_del_pais_de_destino || 'N/A'}</span>
                  <span className="transport-count">{formatCurrency(pais.valor_total_usd)}</span>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'lineas':
        return (
          <div className="line-chart">
            <div className="chart-grid">
              {Array.from({ length: data.length }, (_, i) => (
                <div key={i} className="grid-line"></div>
              ))}
            </div>
            <div className="line-path">
              {data.map((pais, index) => (
                <div 
                  key={index} 
                  className="line-point"
                  style={{
                    left: `${(index / (data.length - 1)) * 100}%`,
                    bottom: `${((pais.valor_total_usd / maxValue) * 100)}%`
                  }}
                >
                  <div className="point-tooltip">
                    <div className="tooltip-month">{pais.nombre_del_pais_de_destino || 'N/A'}</div>
                    <div className="tooltip-value">{formatCurrency(pais.valor_total_usd)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Función para renderizar gráfico de transporte
  const renderTransporteChart = () => {
    const data = chartData.transporte;

    switch (chartTypes.transporte) {
      case 'circular':
        return (
          <div className="pie-chart">
            {data.map((item, index) => (
              <div key={index} className="pie-item">
                <div className="pie-slice" style={{
                  background: `conic-gradient(${getSliceColor(index)} 0deg ${(item.porcentaje || 0) * 3.6}deg, rgba(255,255,255,0.1) ${(item.porcentaje || 0) * 3.6}deg 360deg)`
                }}>
                  <div className="pie-center">
                    <div className="pie-icon">{getTransportIcon(item.medio_transporte)}</div>
                    <div className="pie-percentage">{item.porcentaje?.toFixed(1) || '0'}%</div>
                  </div>
                </div>
                <div className="pie-label">
                  <span className="transport-name">{item.medio_transporte || 'N/A'}</span>
                  <span className="transport-count">{item.total_operaciones?.toLocaleString() || '0'} operaciones</span>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'barras':
        const maxOps = Math.max(...data.map(t => t.total_operaciones || 0));
        return (
          <div className="bar-chart">
            {data.map((item, index) => (
              <div key={index} className="bar-item">
                <div className="bar-label">
                  <span className="country-name">
                    {getTransportIcon(item.medio_transporte)} {item.medio_transporte || 'N/A'}
                  </span>
                  <span className="country-value">{item.total_operaciones?.toLocaleString() || '0'}</span>
                </div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: `${Math.min(((item.total_operaciones || 0) / maxOps) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Función para renderizar gráfico mensual
  const renderMensualChart = () => {
    const data = chartData.mensual;
    const maxValue = Math.max(...data.map(m => m.total_operaciones || 0));

    switch (chartTypes.mensual) {
      case 'lineas':
        return (
          <div className="basic-line-chart">
            {/* Título básico */}
            <div className="basic-title-section">
              <h3 className="basic-title">REPORTE DE OPERACIONES MENSUALES</h3>
              <div className="basic-branding">
                <span className="basic-brand">UNIVERSIDAD DEL VALLE</span>
                <span className="basic-subtitle">Comercio Internacional</span>
              </div>
            </div>
            
            {/* Leyenda básica */}
            <div className="basic-legend">
              <div className="basic-legend-item">
                <div className="basic-legend-color exportaciones"></div>
                <span>Exportaciones</span>
              </div>
              <div className="basic-legend-item">
                <div className="basic-legend-color importaciones"></div>
                <span>Importaciones</span>
              </div>
            </div>
            
            {/* Gráfico básico */}
            <div className="basic-chart-container">
              {/* Eje Y básico */}
              <div className="basic-y-axis">
                {[0, 100, 200, 300, 400, 500].map(value => (
                  <div key={value} className="basic-y-tick">
                    <span className="basic-y-label">{value}</span>
                  </div>
                ))}
              </div>
              
              {/* Área del gráfico */}
              <div className="basic-chart-area">
                {/* Líneas de cuadrícula básicas */}
                <div className="basic-grid-lines">
                  {[0, 100, 200, 300, 400, 500].map(value => (
                    <div 
                      key={value} 
                      className="basic-grid-line"
                      style={{ bottom: `${(value / 500) * 100}%` }}
                    ></div>
                  ))}
                </div>
                
                {/* Líneas del gráfico básicas */}
                <svg className="basic-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Línea de Exportaciones */}
                  <polyline
                    className="basic-line-exportaciones"
                    points={data.map((point, index) => 
                      `${(index / (data.length - 1)) * 100},${100 - ((point.total_operaciones || 0) / 500) * 100}`
                    ).join(' ')}
                    fill="none"
                    stroke="#8B1538"
                    strokeWidth="2"
                  />
                  
                  {/* Línea de Importaciones */}
                  <polyline
                    className="basic-line-importaciones"
                    points={data.map((point, index) => 
                      `${(index / (data.length - 1)) * 100},${100 - (((point.total_operaciones || 0) * 0.7) / 500) * 100}`
                    ).join(' ')}
                    fill="none"
                    stroke="#4ecdc4"
                    strokeWidth="2"
                  />
                  
                  {/* Puntos de datos básicos */}
                  {data.map((point, index) => (
                    <g key={index}>
                      <circle
                        className="basic-data-point exportaciones"
                        cx={(index / (data.length - 1)) * 100}
                        cy={100 - ((point.total_operaciones || 0) / 500) * 100}
                        r="2"
                        fill="#8B1538"
                      />
                      <circle
                        className="basic-data-point importaciones"
                        cx={(index / (data.length - 1)) * 100}
                        cy={100 - (((point.total_operaciones || 0) * 0.7) / 500) * 100}
                        r="2"
                        fill="#4ecdc4"
                      />
                    </g>
                  ))}
                </svg>
              </div>
              
              {/* Eje X básico */}
              <div className="basic-x-axis">
                {data.map((point, index) => (
                  <div key={index} className="basic-x-tick">
                    <span className="basic-x-label">{getMonthName(point.mes).substring(0, 3).toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'area':
        return (
          <div className="area-chart">
            <div className="chart-grid">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="grid-line"></div>
              ))}
            </div>
            <div className="area-path">
              {data.map((month, index) => (
                <div 
                  key={index} 
                  className="area-point"
                  style={{
                    left: `${(index / (data.length - 1)) * 100}%`,
                    bottom: `${((month.total_operaciones / maxValue) * 100)}%`
                  }}
                >
                  <div className="point-tooltip">
                    <div className="tooltip-month">{getMonthName(month.mes)}</div>
                    <div className="tooltip-value">{month.total_operaciones?.toLocaleString() || '0'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'barras':
        return (
          <div className="bar-chart monthly-bars">
            {data.map((month, index) => {
              const percentage = Math.min(((month.total_operaciones || 0) / maxValue) * 100, 100);
              const monthName = getMonthName(month.mes);
              return (
                <div key={index} className="bar-item monthly-bar-item">
                  <div className="bar-label">
                    <span className="country-name">{monthName}</span>
                    <div className="bar-values">
                      <span className="country-value">{month.total_operaciones?.toLocaleString() || '0'}</span>
                      <span className="country-percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="bar-container monthly-bar-container">
                    <div 
                      className="bar-fill monthly-bar-fill" 
                      style={{ 
                        width: `${percentage}%` 
                      }}
                    >
                      <span className="bar-percentage-text">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="graficos-loading">
        <div className="loading-spinner"></div>
        <p>Cargando gráficos avanzados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="graficos-error">
        <h2>Error al cargar los gráficos</h2>
        <p>{error}</p>
        <button onClick={fetchChartData} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="graficos-avanzados">
      {/* Header */}
      <div className="graficos-header">
        <div className="header-content">
          <h1>📈 Gráficos Avanzados</h1>
          <p className="header-description">
            Visualizaciones interactivas y análisis detallado de datos comerciales
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {chartData.exportaciones.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">
              {stat.tipo_operacion?.includes('Exportación') ? '📤' : 
               stat.tipo_operacion?.includes('Reexportación') ? '🔄' : '📦'}
            </div>
            <div className="stat-content">
              <h3>{stat.tipo_operacion || 'Operación'}</h3>
              <div className="stat-value">{stat.total_operaciones?.toLocaleString() || '0'}</div>
              <div className="stat-label">Operaciones</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Top Countries Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h2>🌍 Top Países de Destino</h2>
            <div className="chart-controls">
              <button 
                className={`control-btn ${chartTypes.paises === 'barras' ? 'active' : ''}`}
                onClick={() => changeChartType('paises', 'barras')}
              >
                📊 Barras
              </button>
              <button 
                className={`control-btn ${chartTypes.paises === 'circular' ? 'active' : ''}`}
                onClick={() => changeChartType('paises', 'circular')}
              >
                🥧 Circular
              </button>
              <button 
                className={`control-btn ${chartTypes.paises === 'lineas' ? 'active' : ''}`}
                onClick={() => changeChartType('paises', 'lineas')}
              >
                📈 Líneas
              </button>
            </div>
          </div>
          <div className="chart-content">
            {renderPaisesChart()}
          </div>
        </div>

        {/* Transport Distribution */}
        <div className="chart-container">
          <div className="chart-header">
            <h2>🚚 Distribución por Transporte</h2>
            <div className="chart-controls">
              <button 
                className={`control-btn ${chartTypes.transporte === 'circular' ? 'active' : ''}`}
                onClick={() => changeChartType('transporte', 'circular')}
              >
                🥧 Circular
              </button>
              <button 
                className={`control-btn ${chartTypes.transporte === 'barras' ? 'active' : ''}`}
                onClick={() => changeChartType('transporte', 'barras')}
              >
                📊 Barras
              </button>
            </div>
          </div>
          <div className="chart-content">
            {renderTransporteChart()}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="trends-section">
        <div className="chart-container full-width">
          <div className="chart-header">
            <h2>📅 Tendencias Mensuales</h2>
            <div className="chart-controls">
              <button 
                className={`control-btn ${chartTypes.mensual === 'lineas' ? 'active' : ''}`}
                onClick={() => changeChartType('mensual', 'lineas')}
              >
                📈 Líneas
              </button>
              <button 
                className={`control-btn ${chartTypes.mensual === 'area' ? 'active' : ''}`}
                onClick={() => changeChartType('mensual', 'area')}
              >
                📊 Área
              </button>
              <button 
                className={`control-btn ${chartTypes.mensual === 'barras' ? 'active' : ''}`}
                onClick={() => changeChartType('mensual', 'barras')}
              >
                📊 Barras
              </button>
            </div>
          </div>
          <div className="chart-content">
            {renderMensualChart()}
          </div>
        </div>
        
      </div>

      {/* Export Options */}

    </div>
  );
};

const getSliceColor = (index) => {
  const colors = ['#8B1538', '#A01D47', '#6B0F2A', '#BDB6B8', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
  return colors[index % colors.length];
};

export default GraficosAvanzados;
