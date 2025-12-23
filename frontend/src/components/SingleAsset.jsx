import React, { useEffect, useState, useMemo } from 'react';
import { getAssetDetails } from '../services/api';
import { 
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Line, Cell, Legend, BarChart 
} from 'recharts';
import { AlertCircle, Loader2, Bug } from 'lucide-react';

// --- VELA JAPONESA ROBUSTA ---
const CandleStick = (props) => {
  // Recibimos x, y, width, height ya calculados por Recharts gracias al dataKey tipo array
  const { x, y, width, height, payload, yAxis } = props;
  
  if (!payload || !yAxis) return null;

  const { low, high, open, close } = payload;

  // Si falta algún dato, no pintamos
  if ([low, high, open, close].some(v => v === null || v === undefined || isNaN(v))) return null;

  const isUp = close > open;
  const color = isUp ? '#00D4AA' : '#EF4444'; // Verde : Rojo

  // Calculamos solo las mechas (el cuerpo ya viene en y/height)
  // Usamos el eje Y para escalar los puntos alto y bajo
  let yHigh, yLow;
  try {
      yHigh = yAxis.scale(high);
      yLow = yAxis.scale(low);
  } catch(e) {
      return null; // Si el eje no está listo, abortamos
  }

  // Centramos la línea de la mecha
  const xCenter = x + width / 2;

  return (
    <g stroke={color} strokeWidth="1.5">
      {/* Mecha Superior e Inferior */}
      <line x1={xCenter} y1={yHigh} x2={xCenter} y2={yLow} />
      {/* Cuerpo (usamos las coordenadas nativas de la barra) */}
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={Math.max(1, height)} // Mínimo 1px
        fill={color} 
        stroke="none" 
      />
    </g>
  );
};

const SingleAsset = ({ ticker }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [visibleLines, setVisibleLines] = useState({ sma20: true, sma50: true });

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    
    getAssetDetails(ticker)
      .then((res) => {
          if(!res || res.price === undefined) throw new Error("Datos incompletos");
          setData(res);
      })
      .catch((err) => {
        console.error(err);
        setError("Error cargando datos. Intenta otro activo.");
      })
      .finally(() => setLoading(false));
  }, [ticker]);

  const { chartData, gexData, minPrice, maxPrice } = useMemo(() => {
    if (!data || !data.history || data.history.length === 0) {
        return { chartData: [], gexData: [], minPrice: 0, maxPrice: 100 };
    }
    
    const simData = data.history.map((item, i, arr) => {
        const prev = i > 0 ? arr[i-1].close : item.close;
        const open = prev;
        const close = item.close;
        // Simulamos high/low con un pequeño margen si la API no los trae
        const high = Math.max(open, close) * 1.002;
        const low = Math.min(open, close) * 0.998;

        return {
            date: item.date,
            open, close, high, low,
            // Pre-calculamos el rango del cuerpo para que Recharts sepa dónde pintar la barra
            body: [Math.min(open, close), Math.max(open, close)], 
            sma20: item.sma20, 
            sma50: item.sma50
        };
    });

    const vals = simData.flatMap(d => [d.low, d.high, d.sma20, d.sma50].filter(v => Number.isFinite(v)));
    let minP = 0, maxP = 100;
    
    if (vals.length > 0) {
        minP = Math.min(...vals) * 0.995;
        maxP = Math.max(...vals) * 1.005;
    }

    const gex = (data.gex_profile || []).sort((a,b) => b.strike - a.strike);
    return { chartData: simData, gexData: gex, minPrice: minP, maxPrice: maxP };
  }, [data]);

  const toggleLine = (e) => {
      if (e && e.dataKey) {
          setVisibleLines(prev => ({ ...prev, [e.dataKey]: !prev[e.dataKey] }));
      }
  };

  // Renderizado Seguro
  try {
      if (!ticker) return <div className="text-center p-10 text-gray-500">Selecciona un activo</div>;
      
      if (loading) return (
        <div className="flex flex-col items-center justify-center h-full text-primary gap-4 p-10">
            <Loader2 className="w-8 h-8 animate-spin"/> 
            <p>Cargando {ticker}...</p>
        </div>
      );

      if (error) return (
        <div className="flex flex-col items-center justify-center h-full text-red-400 gap-4 p-10">
            <AlertCircle className="w-10 h-10"/> 
            <p>{error}</p>
        </div>
      );

      return (
        <div className="flex flex-col space-y-4 animate-in fade-in duration-300 pb-10 h-full">
          
          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-white/10 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                {data.ticker} 
                <span className="text-2xl font-normal text-primary">
                    ${(data.price || 0).toFixed(2)}
                </span>
              </h1>
              <div className="flex gap-4 mt-2 text-xs font-mono text-gray-400">
                <span>Call Wall: <span className="text-blue-400">${(data.call_wall||0).toFixed(2)}</span></span>
                <span>Put Wall: <span className="text-red-400">${(data.put_wall||0).toFixed(2)}</span></span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full min-h-[500px]">
            
            {/* GRÁFICO PRECIO */}
            <div className="lg:col-span-3 bg-[#131722] rounded-xl border border-white/5 p-4 flex flex-col">
              <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Acción de Precio</h3>
              
              <div className="w-full h-[500px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{top:10, right:10, left:0, bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="date" hide />
                        
                        <YAxis 
                            yAxisId={0} // ID explícito
                            domain={[minPrice, maxPrice]} 
                            orientation="right" 
                            tick={{fill:'#666', fontSize:11}} 
                            width={50}
                            tickFormatter={(val) => val.toFixed(2)} // DECIMALES EN EJE
                        />
                        
                        <Tooltip 
                            contentStyle={{backgroundColor:'#0f111a', borderColor:'#333'}} 
                            itemStyle={{color:'#fff'}}
                            formatter={(val) => val ? Number(val).toFixed(2) : ''} // DECIMALES EN TOOLTIP
                            labelFormatter={(label) => `Fecha: ${label}`}
                        />
                        
                        <Legend onClick={toggleLine} wrapperStyle={{cursor:'pointer'}} />
                        
                        {/* VELAS: Usamos 'body' (array) para que Recharts calcule la barra base */}
                        <Bar 
                            yAxisId={0}
                            dataKey="body" 
                            shape={<CandleStick />} 
                            isAnimationActive={false} 
                            name="Precio" 
                            legendType="rect"
                        />
                        
                        <Line 
                            yAxisId={0}
                            type="monotone" dataKey="sma20" stroke="#fbbf24" dot={false} strokeWidth={1} 
                            name="SMA 20" hide={!visibleLines.sma20} isAnimationActive={false} 
                        />
                        <Line 
                            yAxisId={0}
                            type="monotone" dataKey="sma50" stroke="#60a5fa" dot={false} strokeWidth={1} 
                            name="SMA 50" hide={!visibleLines.sma50} isAnimationActive={false} 
                        />
                        
                        {data.call_wall && <ReferenceLine yAxisId={0} y={data.call_wall} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5}/>}
                        {data.put_wall && <ReferenceLine yAxisId={0} y={data.put_wall} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5}/>}
                      </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No hay historial suficiente.
                    </div>
                )}
              </div>
            </div>

            {/* GRÁFICO GEX */}
            <div className="lg:col-span-1 bg-[#131722] rounded-xl border border-white/5 p-4 flex flex-col">
              <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Perfil GEX</h3>
              <div className="w-full h-[500px]">
                {gexData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gexData} layout="vertical" margin={{left:0, right:10}}>
                        <CartesianGrid stroke="#ffffff05" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="strike" type="category" width={40} tick={{fill:'#666', fontSize:10}} interval={0} />
                        <Tooltip 
                            cursor={{fill:'#ffffff05'}} 
                            contentStyle={{backgroundColor:'#0f111a', borderColor:'#333'}} 
                            formatter={(val) => val.toFixed(2)}
                        />
                        <ReferenceLine x={0} stroke="#444" />
                        <Bar dataKey="gex" name="GEX">
                          {gexData.map((e, i) => <Cell key={i} fill={e.gex > 0 ? '#00D4AA' : '#EF4444'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                        Sin datos de opciones
                    </div>
                )}
              </div>
            </div>

          </div>
        </div>
      );
  } catch (renderError) {
      console.error("CRASH RENDER:", renderError);
      return (
          <div className="flex flex-col items-center justify-center h-full text-red-500 p-10">
              <Bug className="w-12 h-12 mb-4"/>
              <h2 className="text-xl font-bold">Error de Visualización</h2>
              <p className="text-sm mt-2 font-mono">{renderError.toString()}</p>
          </div>
      );
  }
};

export default SingleAsset;