import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../UI/Card';
import './InternationalTradePanel.css';

const InternationalTradePanel = () => {
  // Datos para las métricas KPI
  const kpiData = [
    {
      title: "Exportaciones Totales",
      value: "$2.5B",
      icon: "📈",
      gradient: "from-pink-500 to-purple-600",
      change: "+12.8%",
      changeType: "positive"
    },
    {
      title: "Crecimiento Anual",
      value: "+12.8%",
      icon: "📊",
      gradient: "from-pink-500 to-purple-600",
      change: "+2.1%",
      changeType: "positive"
    },
    {
      title: "Países Socios",
      value: "156",
      icon: "🏳️",
      gradient: "from-blue-500 to-blue-600",
      change: "+5",
      changeType: "positive"
    },
    {
      title: "Transacciones Mensuales",
      value: "24.3K",
      icon: "↔️",
      gradient: "from-green-500 to-green-600",
      change: "+8.2%",
      changeType: "positive"
    },
    {
      title: "Envíos Marítimos",
      value: "1,847",
      icon: "🚢",
      gradient: "from-orange-400 to-pink-500",
      change: "+3.1%",
      changeType: "positive"
    },
    {
      title: "Envíos Terrestres",
      value: "3,456",
      icon: "🚛",
      gradient: "from-orange-400 to-orange-500",
      change: "+5.7%",
      changeType: "positive"
    },
    {
      title: "Envíos Aéreos",
      value: "892",
      icon: "✈️",
      gradient: "from-pink-400 to-orange-500",
      change: "+12.3%",
      changeType: "positive"
    },
    {
      title: "Tiempo de Entrega",
      value: "98.7%",
      icon: "⏰",
      gradient: "from-red-500 to-pink-600",
      change: "+0.3%",
      changeType: "positive"
    }
  ];

  // Datos para el gráfico de dona - Exportaciones por Región
  const regionData = [
    { name: 'América', value: 42, color: '#60A5FA' },
    { name: 'Europa', value: 28, color: '#34D399' },
    { name: 'Asia', value: 18, color: '#FB923C' },
    { name: 'África', value: 8, color: '#F87171' },
    { name: 'Oceanía', value: 4, color: '#A78BFA' }
  ];

  // Datos para el gráfico de líneas - Tendencia Comercial Trimestral
  const quarterlyData = [
    { quarter: 'Q1 2023', exportaciones: 120, importaciones: 110 },
    { quarter: 'Q2 2023', exportaciones: 135, importaciones: 125 },
    { quarter: 'Q3 2023', exportaciones: 150, importaciones: 140 },
    { quarter: 'Q4 2023', exportaciones: 165, importaciones: 155 },
    { quarter: 'Q1 2024', exportaciones: 180, importaciones: 170 },
    { quarter: 'Q2 2024', exportaciones: 195, importaciones: 185 },
    { quarter: 'Q3 2024', exportaciones: 210, importaciones: 200 },
    { quarter: 'Q4 2024', exportaciones: 230, importaciones: 215 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-lg">
          <p className="text-gray-800 font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="international-trade-panel">
      {/* Header */}
      <div className="panel-header">
        <h1 className="panel-title">
          🌍 Panel de Comercio Internacional
        </h1>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            className={`kpi-card bg-gradient-to-br ${kpi.gradient} animate-slide-up`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="kpi-content">
              <div className="kpi-icon">{kpi.icon}</div>
              <div className="kpi-text">
                <div className="kpi-value">{kpi.value}</div>
                <div className="kpi-title">{kpi.title}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Exportaciones por Región - Donut Chart */}
        <Card className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              🌍 Exportaciones por Región
            </h3>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {regionData.map((region, index) => (
                <div key={index} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: region.color }}
                  ></div>
                  <span className="legend-label">{region.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Tendencia Comercial Trimestral - Line Chart */}
        <Card className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              📈 Tendencia Comercial Trimestral
            </h3>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={quarterlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="quarter" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  domain={[100, 240]}
                  tickCount={8}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="exportaciones" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  name="Exportaciones"
                />
                <Line 
                  type="monotone" 
                  dataKey="importaciones" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  name="Importaciones"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InternationalTradePanel;
