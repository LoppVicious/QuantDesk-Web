import React, { useEffect, useState, useMemo } from 'react';
import { getAssetDetails } from '../services/api';
import { 
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Line, Cell, Legend, BarChart 
} from 'recharts';
import { AlertCircle } from 'lucide-react';

const CandleStick = (props) => {
  const { x, width, low, high, open, close, yAxis } = props;
  // Protección crítica: Si no hay eje Y o datos, no renderizamos nada
  if (!yAxis || low == null || high == null) return null;

  const isUp = close > open;
  const color = isUp ? '#00D4AA' : '#EF4444';
  
  const yHigh = yAxis.scale(high);
  const yLow = yAxis.scale(low);
  const yOpen = yAxis.scale(open);
  const yClose = yAxis.scale(close);
  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));

  return (
    <g stroke={color} strokeWidth="1.5">
      <line x1={x + width / 2} y1={yHigh} x2={x + width / 2} y2={yLow} />
      <rect x={x} y={bodyTop} width={width} height={bodyHeight} fill={color} stroke="none" />
    </g>
  );
};

const SingleAsset = ({ ticker }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visibleLines, setVisibleLines] = useState({ sma20: true, sma50: true });

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    getAssetDetails(ticker)
      .then(setData)
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar los datos del activo.");
      })
      .finally(() => setLoading(false));
  }, [ticker]);

  const { chartData, gexData, minPrice, maxPrice } = useMemo(() => {
    if (!data || !data.history || data.history.length === 0) {
        return { chartData: [], gexData: [], minPrice: 0, maxPrice: 100 };
    }
    
    // Simulación de velas basada en el cierre (porque la API a veces solo da Close)
    const simData = data.history.map((item, i, arr) => {
        const prev = i > 0 ? arr[i-1].close : item.close;
        return {
            date: item.date,
            open: prev, 
            close: item.close,
            // Simulamos mechas pequeñas si no tenemos datos reales OHLC
            high: Math.max(prev, item.close) * 1.005,
            low: Math.min(prev, item.close) * 0.995,
            sma20: item.sma20, 
            sma50: item.sma50
        };
    });

    // Calcular escala Y evitando Infinity
    const validValues = simData.flatMap(d => [d.low, d.high, d.sma20, d.sma50].filter(v => v != null && !isNaN(v)));
    let minP = 0, maxP = 100;
    
    if (validValues.length > 0) {
        minP = Math.min(...validValues) * 0.95;
        maxP = Math.max(...validValues) * 1.05;
    }

    const gex = (data.gex_profile || []).sort((a,b) => b.strike - a.strike);
    return { chartData: simData, gexData: gex, minPrice: minP, maxPrice: maxP };
  }, [data]);

  const toggleLine = (e) => setVisibleLines(prev => ({ ...prev, [e.dataKey]: !prev[e.dataKey] }));

  if (!ticker) return <div className="flex items-center justify-center h-full text-gray-500">Selecciona un activo del Escáner</div>;
  if (loading) return <div className="flex items-center justify-center h-full text-primary animate-pulse">Cargando análisis de {ticker}...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-400 gap-2"><AlertCircle/> {error}</div>;

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {data.ticker} <span className="text-2xl font-normal text-primary">${data.price.toFixed(2)}</span>
          </h1>
          <div className="flex gap-4 mt-2 text-xs font-mono text-gray-400">
            <span>Call Wall: <span className="text-blue-400">${data.call_wall}</span></span>
            <span>Put Wall: <span className="text-red-400">${data.put_wall}</span></span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[500px]">
        {/* GRÁFICO VELAS */}
        <div className="lg:col-span-3 bg-[#131722] rounded-xl border border-white/5 p-4 flex flex-col">
          <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Acción de Precio (6 Meses)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{top:10, right:10, left:0, bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis domain={[minPrice, maxPrice]} orientation="right" tick={{fill:'#666', fontSize:11}} width={40} />
                <Tooltip contentStyle={{backgroundColor:'#0f111a', borderColor:'#333'}} itemStyle={{color:'#fff'}} />
                <Legend onClick={toggleLine} wrapperStyle={{cursor:'pointer', fontSize:'12px'}}/>
                
                <Bar dataKey="close" shape={<CandleStick />} isAnimationActive={false} name="Precio" />
                
                {visibleLines.sma20 && <Line type="monotone" dataKey="sma20" stroke="#fbbf24" dot={false} strokeWidth={1} name="SMA 20" isAnimationActive={false} />}
                {visibleLines.sma50 && <Line type="monotone" dataKey="sma50" stroke="#60a5fa" dot={false} strokeWidth={1} name="SMA 50" isAnimationActive={false} />}
                
                {data.call_wall && <ReferenceLine y={data.call_wall} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5}/>}
                {data.put_wall && <ReferenceLine y={data.put_wall} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5}/>}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO GEX */}
        <div className="lg:col-span-1 bg-[#131722] rounded-xl border border-white/5 p-4 flex flex-col">
          <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Perfil Gamma (GEX)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gexData} layout="vertical" margin={{left:0, right:10}}>
                <CartesianGrid stroke="#ffffff05" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="strike" type="category" width={40} tick={{fill:'#666', fontSize:10}} interval={0} />
                <Tooltip cursor={{fill:'#ffffff05'}} contentStyle={{backgroundColor:'#0f111a', borderColor:'#333'}} />
                <ReferenceLine x={0} stroke="#444" />
                <Bar dataKey="gex" name="GEX">
                  {gexData.map((e, i) => <Cell key={i} fill={e.gex > 0 ? '#00D4AA' : '#EF4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SingleAsset;