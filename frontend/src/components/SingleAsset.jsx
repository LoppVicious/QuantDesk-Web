import React, { useEffect, useState, useMemo } from 'react';
import { getAssetDetails } from '../services/api';
import { 
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Line, Cell, Legend, BarChart 
} from 'recharts';
import { AlertCircle, Loader2, Bug } from 'lucide-react';

// --- COMPONENTE VELA JAPONESA (FIX CRÍTICO) ---
const CandleStick = (props) => {
  // Leemos 'payload' que es donde Recharts guarda los datos reales
  const { x, width, yAxis, payload } = props;
  
  if (!yAxis || !payload) return null;

  const { low, high, open, close } = payload;

  // Validación: Si falta algún dato, no dibujamos
  if ([low, high, open, close].some(v => v === null || v === undefined || isNaN(v))) {
      return null;
  }

  const isUp = close > open;
  const color = isUp ? '#00D4AA' : '#EF4444'; // Verde : Rojo
  
  try {
      // Usamos el eje Y para convertir precio a píxeles
      const yHigh = yAxis.scale(high);
      const yLow = yAxis.scale(low);
      const yOpen = yAxis.scale(open);
      const yClose = yAxis.scale(close);
      
      // Si el eje no devuelve números válidos, no dibujamos
      if(!Number.isFinite(yHigh) || !Number.isFinite(yLow)) return null;

      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));

      return (
        <g stroke={color} strokeWidth="1.5">
          {/* Mecha (Línea High-Low) */}
          <line x1={x + width / 2} y1={yHigh} x2={x + width / 2} y2={yLow} />
          {/* Cuerpo (Rectángulo Open-Close) */}
          <rect x={x} y={bodyTop} width={width} height={bodyHeight} fill={color} stroke="none" />
        </g>
      );
  } catch (e) {
      return null;
  }
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
          if(!res || !res.price) throw new Error("Datos incompletos");
          setData(res);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar los datos.");
      })
      .finally(() => setLoading(false));
  }, [ticker]);

  const { chartData, gexData, minPrice, maxPrice } = useMemo(() => {
    if (!data || !data.history || data.history.length === 0) {
        return { chartData: [], gexData: [], minPrice: 0, maxPrice: 100 };
    }
    
    const simData = data.history.map((item, i, arr) => {
        // Usamos el cierre anterior como apertura para simular velas si no hay OHLC real
        const prev = i > 0 ? arr[i-1].close : item.close;
        return {
            date: item.date,
            open: prev, 
            close: item.close,
            high: Math.max(prev, item.close) * 1.005,
            low: Math.min(prev, item.close) * 0.995,
            sma20: item.sma20, 
            sma50: item.sma50
        };
    });

    const vals = simData.flatMap(d => [d.low, d.high].filter(v => Number.isFinite(v)));
    let minP = 0, maxP = 100;
    
    if (vals.length > 0) {
        minP = Math.min(...vals) * 0.99;
        maxP = Math.max(...vals) * 1.01;
    }

    const gex = (data.gex_profile || []).sort((a,b) => b.strike - a.strike);
    return { chartData: simData, gexData: gex, minPrice: minP, maxPrice: maxP };
  }, [data]);

  // Handler para alternar visibilidad sin borrar el item de la leyenda
  const toggleLine = (e) => {
    if(e && e.dataKey) setVisibleLines(prev => ({ ...prev, [e.dataKey]: !prev[e.dataKey] }));
  };

  if (!ticker) return <div className="flex items-center justify-center h-full text-gray-500">Selecciona un activo</div>;
  if (loading) return <div className="flex flex-col items-center justify-center h-full text-primary gap-3"><Loader2 className="w-8 h-8 animate-spin"/> Analizando {ticker}...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-400 gap-2"><AlertCircle/> {error}</div>;

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
      <header className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {data.ticker} <span className="text-2xl font-normal text-primary">${data.price.toFixed(2)}</span>
          </h1>
          <div className="flex gap-4 mt-2 text-xs font-mono text-gray-400">
            <span>Call Wall: <span className="text-blue-400">${(data.call_wall||0).toFixed(2)}</span></span>
            <span>Put Wall: <span className="text-red-400">${(data.put_wall||0).toFixed(2)}</span></span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[500px]">
        {/* GRÁFICO PRECIO */}
        <div className="lg:col-span-3 bg-[#131722] rounded-xl border border-white/5 p-4 flex flex-col relative">
          <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Acción de Precio</h3>
          <div className="flex-1 w-full min-h-0">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{top:10, right:10, left:0, bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis 
                        domain={[minPrice, maxPrice]} 
                        orientation="right" 
                        tick={{fill:'#666', fontSize:11}} 
                        width={40} 
                        tickFormatter={(val) => val.toFixed(2)} 
                    />
                    <Tooltip 
                        contentStyle={{backgroundColor:'#0f111a', borderColor:'#333'}} 
                        itemStyle={{color:'#fff'}} 
                        formatter={(val) => Number(val).toFixed(2)}
                    />
                    <Legend onClick={toggleLine} wrapperStyle={{cursor:'pointer'}} />
                    
                    {/* VELA JAPONESA */}
                    <Bar 
                        dataKey="close" 
                        shape={<CandleStick />} 
                        isAnimationActive={false} 
                        name="Precio" 
                        legendType="rect" 
                    />
                    
                    {/* MEDIAS MÓVILES (USAMOS 'hide' PARA QUE NO DESAPAREZCAN DE LEYENDA) */}
                    <Line 
                        type="monotone" 
                        dataKey="sma20" 
                        stroke="#fbbf24" 
                        dot={false} 
                        strokeWidth={1} 
                        name="SMA 20" 
                        hide={!visibleLines.sma20} 
                        isAnimationActive={false}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="sma50" 
                        stroke="#60a5fa" 
                        dot={false} 
                        strokeWidth={1} 
                        name="SMA 50" 
                        hide={!visibleLines.sma50} 
                        isAnimationActive={false}
                    />
                    
                    {data.call_wall && <ReferenceLine y={data.call_wall} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5}/>}
                    {data.put_wall && <ReferenceLine y={data.put_wall} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5}/>}
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
          <div className="flex-1 w-full min-h-0">
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
};

export default SingleAsset;