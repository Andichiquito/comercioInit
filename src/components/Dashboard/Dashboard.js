import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MetricCard from '../Metrics/MetricCard';
import ExportChart from '../Charts/ExportChart';
import TopCountriesChart from '../Charts/TopCountriesChart';
import TransportDistributionChart from '../Charts/TransportDistributionChart';
import RecentOperations from '../Charts/RecentOperations';
import './Dashboard.css';
import '../Charts/Charts.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [exportData, setExportData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [transportData, setTransportData] = useState([]);
  const [recentOps, setRecentOps] = useState([]);

  const API_BASE = 'http://localhost:5000/api';
  
  // Configurar axios con timeout
  const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 10000, // 10 segundos
    headers: {
      'Content-Type': 'application/json',
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        statsResponse,
        exportResponse,
        countryResponse,
        transportResponse,
        recentResponse
      ] = await Promise.all([
        apiClient.get('/views/query/vista_estadisticas_generales'),
        apiClient.get('/views/query/vista_operaciones_por_mes?limit=12'),
        apiClient.get('/views/query/vista_exportaciones_por_pais?limit=10'),
        apiClient.get('/views/query/vista_medio_transporte'),
        apiClient.get('/views/query/vista_operaciones_recientes?limit=10')
      ]);

      setStats(statsResponse.data.datos);
      setExportData(exportResponse.data.datos);
      setCountryData(countryResponse.data.datos);
      setTransportData(transportResponse.data.datos);
      setRecentOps(recentResponse.data.datos);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      // Mejor manejo de errores de red
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        setError('Error de conexión: El servidor backend no está disponible. Verifica que esté ejecutándose en el puerto 5000.');
      } else if (err.response) {
        // Error con respuesta del servidor
        setError(`Error del servidor: ${err.response.status} - ${err.response.statusText}`);
      } else if (err.request) {
        // Error de red sin respuesta
        setError('Error de red: No se pudo conectar con el servidor. Verifica tu conexión.');
      } else {
        // Otro tipo de error
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('es-ES').format(value);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando datos del dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error al cargar el dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  // Calculate totals from stats
  const totalExports = stats?.find(s => s.tipo_operacion.includes('EXPORTACIONES'));
  const totalReexports = stats?.find(s => s.tipo_operacion.includes('REEXPORTACIONES'));
  const totalPersonal = stats?.find(s => s.tipo_operacion.includes('EFECTOS'));

  const totalOperations = (totalExports?.total_operaciones || 0) + 
                         (totalReexports?.total_operaciones || 0) + 
                         (totalPersonal?.total_operaciones || 0);

  // const totalValue = (totalExports?.valor_total_usd || 0) + 
  //                   (totalReexports?.valor_total_usd || 0) + 
  //                   (totalPersonal?.valor_total_usd || 0);

  const totalCountries = Math.max(
    totalExports?.paises_destino || 0,
    totalReexports?.paises_destino || 0,
    totalPersonal?.paises_destino || 0
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-logo-section">
          <img 
            src="/download.png" 
            alt="Universidad del Valle" 
            className="dashboard-logo"
          />
          <div className="header-text">
            <h1>Universidad del Valle</h1>
            <p>Dashboard de Comercio Internacional</p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Exportaciones Totales"
          value={formatCurrency(totalExports?.valor_total_usd || 0)}
          subtitle={`${formatNumber(totalExports?.total_operaciones || 0)} operaciones`}
          icon="📈"
          color="blue"
        />
        <MetricCard
          title="Crecimiento Anual"
          value="+12.8%"
          subtitle="vs año anterior"
          icon="📊"
          color="green"
        />
        <MetricCard
          title="Países Socios"
          value={formatNumber(totalCountries)}
          subtitle="destinos comerciales"
          icon="🌍"
          color="purple"
        />
        <MetricCard
          title="Transacciones Mensuales"
          value={formatNumber(Math.round(totalOperations / 12))}
          subtitle="promedio mensual"
          icon="💼"
          color="orange"
        />
        <MetricCard
          title="Envíos Marítimos"
          value={formatNumber(transportData.find(t => t.medio_transporte?.includes('MARITIMO'))?.total_operaciones || 0)}
          subtitle="operaciones marítimas"
          icon="🚢"
          color="teal"
        />
        <MetricCard
          title="Envíos Terrestres"
          value={formatNumber(transportData.find(t => t.medio_transporte?.includes('TERRESTRE'))?.total_operaciones || 0)}
          subtitle="operaciones terrestres"
          icon="🚛"
          color="brown"
        />
        <MetricCard
          title="Tiempo de Entrega"
          value="98.7%"
          subtitle="cumplimiento"
          icon="⏱️"
          color="red"
        />
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-row">
          <div className="chart-container">
            <h3>🌍 Top Países de Destino</h3>
            <TopCountriesChart data={countryData} />
          </div>
          <div className="chart-container">
            <h3>🚚 Distribución por Transporte</h3>
            <TransportDistributionChart data={transportData} />
          </div>
        </div>

        <div className="chart-row">
          <div className="chart-container large">
            <h3>📈 Tendencia Comercial Trimestral</h3>
            <ExportChart data={exportData} />
          </div>
          <div className="chart-container">
            <h3>🎯 Principales Mercados</h3>
            <div className="markets-summary">
              {countryData.slice(0, 6).map((country, index) => (
                <div key={index} className="market-item">
                  <span className="market-name">{country.nombre_del_pais_de_destino}</span>
                  <span className="market-value">{formatCurrency(country.valor_total_usd)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Operations */}
      <div className="recent-operations">
        <h3>🕒 Operaciones Recientes</h3>
        <RecentOperations data={recentOps} />
      </div>

      {/* Market Insights */}
      <div className="insights-section">
        <h3>💡 Insights del Mercado</h3>
        <div className="insights-grid">
          <div className="insight-card blue">
            <div className="insight-icon">💡</div>
            <div className="insight-content">
              <h4>Tendencia Alcista</h4>
              <p>El sector tecnológico muestra un crecimiento del 23% en exportaciones este trimestre.</p>
            </div>
          </div>
          <div className="insight-card yellow">
            <div className="insight-icon">⚠️</div>
            <div className="insight-content">
              <h4>Mercado Emergente</h4>
              <p>Vietnam se posiciona como nuevo destino estratégico para textiles y manufactura.</p>
            </div>
          </div>
          <div className="insight-card green">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Oportunidad</h4>
              <p>Demanda creciente de productos orgánicos en mercados europeos.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Limited Access Banner */}
      <div className="limited-access">
        <div className="access-content">
          <div className="access-icon">🔒</div>
          <div className="access-text">
            <h4>Acceso Limitado!</h4>
            <p>Esta es una versión demo. Inicia sesión para acceder a datos completos, análisis avanzados y reportes personalizados.</p>
          </div>
          <button className="login-button">Iniciar Sesión Ahora</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
