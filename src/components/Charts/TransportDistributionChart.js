import React from 'react';

const TransportDistributionChart = ({ data }) => {
  // Procesar datos para el gráfico de transporte
  const processData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];
    
    return rawData.map(item => ({
      name: item.medio_transporte || 'Sin especificar',
      operations: parseInt(item.total_operaciones || 0),
      value: parseFloat(item.valor_total_usd || 0)
    }));
  };

  const chartData = processData(data);

  // Función para obtener el icono según el tipo de transporte
  const getTransportIcon = (transport) => {
    if (!transport) return '🚚';
    const transportLower = transport.toLowerCase();
    
    if (transportLower.includes('aereo') || transportLower.includes('aéreo') || transportLower.includes('aerea')) {
      return '✈️';
    } else if (transportLower.includes('maritimo') || transportLower.includes('marítimo') || transportLower.includes('maritima')) {
      return '🚢';
    } else if (transportLower.includes('terrestre') || transportLower.includes('carretero') || transportLower.includes('carretera')) {
      return '🚛';
    } else if (transportLower.includes('ferroviario') || transportLower.includes('ferroviaria')) {
      return '🚂';
    } else if (transportLower.includes('ductos')) {
      return '🛢️';
    } else if (transportLower.includes('fluvial')) {
      return '🚤';
    } else if (transportLower.includes('intermodal')) {
      return '🚛';
    }
    return '🚚';
  };

  // Función para formatear el nombre del transporte
  const formatTransportName = (name) => {
    if (!name) return 'Sin especificar';
    
    // Convertir a formato más legible
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  };

  if (chartData.length === 0) {
    return (
      <div className="chart-placeholder">
        <p>No hay datos disponibles para mostrar</p>
      </div>
    );
  }

  // Calcular porcentajes
  const totalOperations = chartData.reduce((sum, item) => sum + item.operations, 0);
  const chartDataWithPercentages = chartData.map(item => ({
    ...item,
    percentage: totalOperations > 0 ? (item.operations / totalOperations) * 100 : 0
  }));

  return (
    <div className="transport-distribution-chart">
      <div className="transport-list">
        {chartDataWithPercentages.map((transport, index) => (
          <div key={index} className="transport-item">
            <div className="transport-icon">
              {getTransportIcon(transport.name)}
            </div>
            <div className="transport-info">
              <div className="transport-name">
                {formatTransportName(transport.name)}
              </div>
              <div className="transport-stats">
                <span className="transport-count">
                  {transport.operations.toLocaleString()} operaciones
                </span>
                <span className="transport-percentage">
                  {transport.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransportDistributionChart;
