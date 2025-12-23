import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Activity, ArrowUpCircle, ArrowDownCircle, Zap, Layers, BarChart3 } from 'lucide-react';

// --- UTILIDAD: CALCULAR MEDIAS MÓVILES (SMA) ---
// Calculamos esto en el navegador para no sobrecargar el backend
const calculateSMA = (data, period) => {
  if (!data || data.length < period) return [];
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null); // No hay datos suficientes al principio
      continue;
    }
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((a, b) => a + b.Close, 0);
    sma.push(sum / period);
  }
  return sma;
};

const AssetDashboard = ({ data }) => {
  if (!data) return null;

  // Preparamos los datos para el gráfico (Memoizamos para rendimiento)
  const chartConfig = useMemo(() => {
    if (!data.chart_data || data.chart_data.length === 0) return null;

    const dates = data.chart_data.map(d => d.Date);
    // Calcular SMAs
    const sma20 = calculateSMA(data.chart_data, 20);
    const sma50 = calculateSMA(data.chart_data, 50);

    // Calcular rango del eje Y para que se vea bien (Zoom automático cerca del precio)
    const prices = data.chart_data.map(d => d.Close);
    const minPrice = Math.min(...prices.slice(-60)) * 0.95; // Zoom últimos 60 días
    const maxPrice = Math.max(...prices.slice(-60)) * 1.05;

    return { dates, sma20, sma50, minPrice, maxPrice };
  }, [data]);

  if (!chartConfig) return <div className="text-white">Faltan datos históricos...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500 pb-10">
      
      {/* 1. KPI CARDS (COLUMNA IZQUIERDA) */}
      <div className="lg:col-span-1 space-y-4">
        
        {/* Tarjeta Principal: Precio */}
        <div className="bg-[#131722] p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
                <div className="text-5xl font-black mb-1 text-white tracking-tighter">{data.ticker}</div>
                <div className="flex items-baseline gap-3">
                    <div className="text-4xl text-primary font-bold tracking-tight">${data.price.toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase">Spot Price</div>
                </div>
            </div>
        </div>

        {/* Tarjeta de Niveles Clave (Walls) */}
        <div className="bg-[#131722] rounded-2xl border border-white/5 shadow-lg overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                    <Layers className="w-4 h-4"/> NIVELES ESTRUCTURALES
                </h3>
            </div>
            
            <div className="p-4 space-y-4">
                {/* Call Wall */}
                <div className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition">
                            <ArrowUpCircle className="w-5 h-5 text-blue-400"/>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 font-bold uppercase">Resistencia (Call Wall)</div>
                            <div className="text-lg font-mono font-bold text-blue-400">${data.call_wall}</div>
                        </div>
                    </div>
                </div>

                {/* Put Wall */}
                <div className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition">
                            <ArrowDownCircle className="w-5 h-5 text-red-400"/>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 font-bold uppercase">Soporte (Put Wall)</div>
                            <div className="text-lg font-mono font-bold text-red-400">${data.put_wall}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Tarjeta de Volatilidad */}
        <div className="bg-[#131722] rounded-2xl border border-white/5 shadow-lg overflow-hidden">
             <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                    <Activity className="w-4 h-4"/> VOLATILIDAD
                </h3>
            </div>
            <div className="p-6">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-400 text-sm font-medium">Gamma Flip</span>
                    <span className="text-2xl font-bold text-purple-400 font-mono">${data.gamma_flip.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    {/* Barra visual indicando dónde está el precio respecto al Flip */}
                    <div 
                        className={`h-full ${data.price > data.gamma_flip ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: '100%' }}
                    ></div>
                </div>
                <div className="mt-2 text-xs text-center text-gray-500">
                    {data.price > data.gamma_flip ? "Régimen de Volatilidad Positiva (Long Gamma)" : "Régimen de Volatilidad Negativa (Short Gamma)"}
                </div>
            </div>
        </div>
      </div>

      {/* 2. GRÁFICO PROFESIONAL (COLUMNA DERECHA) */}
      <div className="lg:col-span-3 bg-[#131722] rounded-2xl border border-white/5 shadow-xl p-1 relative min-h-[600px]">
          
          <div className="absolute top-4 left-4 z-10 flex gap-2">
             <span className="bg-[#0b0e14]/80 backdrop-blur border border-white/10 px-3 py-1 rounded text-xs font-bold text-gray-400">
                D1
             </span>
             <span className="bg-[#0b0e14]/80 backdrop-blur border border-white/10 px-3 py-1 rounded text-xs font-bold text-cyan-400 border-cyan-500/30">
                SMA 20
             </span>
             <span className="bg-[#0b0e14]/80 backdrop-blur border border-white/10 px-3 py-1 rounded text-xs font-bold text-yellow-400 border-yellow-500/30">
                SMA 50
             </span>
          </div>

          <Plot
            data={[
                // 1. VELAS JAPONESAS (CANDLESTICK)
                {
                    x: chartConfig.dates,
                    close: data.chart_data.map(d => d.Close),
                    decreasing: { line: { color: '#ef5350' }, fillcolor: '#ef5350' },
                    increasing: { line: { color: '#26a69a' }, fillcolor: '#26a69a' },
                    high: data.chart_data.map(d => d.High),
                    low: data.chart_data.map(d => d.Low),
                    open: data.chart_data.map(d => d.Open),
                    type: 'candlestick',
                    xaxis: 'x',
                    yaxis: 'y',
                    name: 'Precio'
                },
                // 2. SMA 20 (Línea Cyan)
                {
                    x: chartConfig.dates,
                    y: chartConfig.sma20,
                    type: 'scatter',
                    mode: 'lines',
                    line: { color: '#22d3ee', width: 1.5 },
                    name: 'SMA 20',
                    xaxis: 'x',
                    yaxis: 'y'
                },
                // 3. SMA 50 (Línea Amarilla)
                {
                    x: chartConfig.dates,
                    y: chartConfig.sma50,
                    type: 'scatter',
                    mode: 'lines',
                    line: { color: '#facc15', width: 1.5 },
                    name: 'SMA 50',
                    xaxis: 'x',
                    yaxis: 'y'
                },
                // 4. PERFIL DE GAMMA (BARRAS HORIZONTALES A LA DERECHA)
                {
                    x: data.gex_profile.map(p => p.NetGEX),
                    y: data.gex_profile.map(p => p.strike),
                    orientation: 'h',
                    type: 'bar',
                    name: 'Gamma Profile',
                    marker: {
                        color: data.gex_profile.map(p => p.NetGEX > 0 ? '#00D4AA' : '#FF4B4B'),
                        opacity: 0.6,
                        line: { width: 0 }
                    },
                    xaxis: 'x2', // Eje X secundario (arriba)
                    yaxis: 'y',  // Comparte eje Y (Precio/Strike) con las velas
                }
            ]}
            layout={{
                autosize: true,
                height: 600,
                paper_bgcolor: '#131722',
                plot_bgcolor: '#131722',
                font: { family: 'Inter, sans-serif', color: '#64748b' },
                showlegend: false,
                dragmode: 'pan', // Navegación estilo TradingView
                
                // CONFIGURACIÓN DE EJES (LAYOUT HÍBRIDO)
                grid: { rows: 1, columns: 2, pattern: 'independent' },
                
                // Eje X1: Tiempo (Velas) - Ocupa el 75% del ancho
                xaxis: { 
                    domain: [0, 0.74], 
                    rangeslider: { visible: false }, 
                    type: 'date',
                    gridcolor: '#1e293b',
                    zeroline: false,
                    showline: true,
                    linecolor: '#334155'
                },
                
                // Eje X2: Gamma (Barras) - Ocupa el 25% restante a la derecha
                xaxis2: { 
                    domain: [0.75, 1], 
                    showgrid: false, 
                    zeroline: true, 
                    zerolinecolor: '#475569',
                    side: 'top', // Etiquetas arriba
                    title: { text: 'GAMMA EXPOSURE', font: { size: 10 } }
                },
                
                // Eje Y: Precio (Compartido)
                yaxis: { 
                    autorange: false, // Manual para controlar el zoom
                    range: [chartConfig.minPrice, chartConfig.maxPrice],
                    gridcolor: '#1e293b',
                    zeroline: false,
                    showline: true,
                    linecolor: '#334155',
                    tickprefix: '$'
                },
                
                margin: { l: 50, r: 20, t: 30, b: 40 },
                hovermode: 'y unified', // Hover profesional
                
                // Líneas horizontales para niveles clave (Annotations)
                shapes: [
                    // Spot Price Line (Punteada blanca)
                    {
                        type: 'line', x0: 0, x1: 1, xref: 'paper',
                        y0: data.price, y1: data.price,
                        line: { color: 'white', width: 1, dash: 'dot' },
                        opacity: 0.5
                    },
                    // Call Wall Line (Azul)
                    {
                        type: 'line', x0: 0, x1: 1, xref: 'paper',
                        y0: data.call_wall, y1: data.call_wall,
                        line: { color: '#3b82f6', width: 1, dash: 'dash' },
                        opacity: 0.4
                    },
                    // Put Wall Line (Roja)
                    {
                        type: 'line', x0: 0, x1: 1, xref: 'paper',
                        y0: data.put_wall, y1: data.put_wall,
                        line: { color: '#ef4444', width: 1, dash: 'dash' },
                        opacity: 0.4
                    }
                ]
            }}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
            config={{ 
                displayModeBar: true, 
                displaylogo: false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d']
            }}
          />
      </div>
    </div>
  );
};

export default AssetDashboard;