import React, { useEffect, useState, useMemo } from 'react';
import { getAssetDetails } from '../services/api';
import { 
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Line, Cell, Legend, BarChart 
} from 'recharts';
import { AlertCircle, Loader2, Star, Bug } from 'lucide-react';

const CandleStick = (props) => {
  const { x, width, yAxis, payload } = props;
  
  // VALIDACIÓN EXTREMA: Si algo falta, no pintar nada (retornar null)
  if (!yAxis || !payload) return null;
  const { low, high, open, close } = payload;
  
  // Si los datos no son números válidos, abortar
  if ([low, high, open, close].some(v => typeof v !== 'number' || !isFinite(v))) return null;

  const isUp = close > open;
  const color = isUp ? '#00D4AA' : '#EF4444';
  
  try {
      const yHigh = yAxis.scale(high);
      const yLow = yAxis.scale(low);
      const yOpen = yAxis.scale(open);
      const yClose = yAxis.scale(close);
      
      // Si la escala devuelve algo inválido
      if (!isFinite(yHigh) || !isFinite(yLow)) return null;

      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));

      return (
        <g stroke={color} strokeWidth="1.5">
          <line x1={x + width / 2} y1={yHigh} x2={x + width / 2} y2={yLow} />
          <rect x={x} y={bodyTop} width={width} height={bodyHeight} fill={color} stroke="none" />
        </g>
      );
  } catch (e) {
      return null;
  }
};

const SingleAsset = ({ ticker, watchlist, onToggleWatchlist }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleLines, setVisibleLines] = useState({ sma20: true, sma50: true });

  const isWatched = watchlist && watchlist.includes(ticker);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    getAssetDetails(ticker)
      .then((res) => {
          if(!res || res.price === undefined) throw new Error("Datos incompletos");
          setData(res);
      })
      .catch((err) => setError("Error cargando datos."))
      .finally(() => setLoading(false));
  }, [ticker]);

  const { chartData, gexData, minPrice, maxPrice } = useMemo(() => {
    if (!data || !data.history || !data.history.length) return { chartData: [], gexData: [], minPrice: 0, maxPrice: 100 };
    
    const simData = data.history.map((item, i, arr) => {
        const prev = i > 0 ? arr[i-1].close : item.close;
        return {
            date: item.date,
            open: item.open || prev,
            close: item.close,
            high: item.high || Math.max(prev, item.close) * 1.002,
            low: item.low || Math.min(prev, item.close) * 0.998,
            sma20: item.sma20, sma50: item.sma50
        };
    });

    const vals = simData.flatMap(d => [d.low, d.high].filter(Number.isFinite));
    let minP = vals.length ? Math.min(...vals) * 0.99 : 0;
    let maxP = vals.length ? Math.max(...vals) * 1.01 : 100;

    const gex = (data.gex_profile || []).sort((a,b) => b.strike - a.strike);
    return { chartData: simData, gexData: gex, minPrice: minP, maxPrice: maxP };
  }, [data]);

  const toggleLine = (e) => {
    if(e && e.dataKey) setVisibleLines(prev => ({ ...prev, [e.dataKey]: !prev[e.dataKey] }));
  };

  if (!ticker) return <div className="text-center p-10 text-gray-500">Selecciona un activo</div>;
  if (loading) return <div className="flex flex-col items-center justify-center h-full text-primary gap-3"><Loader2 className="w-8 h-8 animate-spin"/> Analizando...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-400 gap-2"><AlertCircle/> {error}</div>;

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
      <header className="flex justify-between items-start border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">{data.ticker}</h1>
            <span className="text-lg text-gray-400 font-normal truncate max-w-[300px]">{data.name || data.ticker}</span>
            <button onClick={() => onToggleWatchlist(data.ticker)} className="hover:scale-110 transition-transform ml-2">
                <Star className={`w-6 h-6 ${isWatched ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`} />
            </button>
          </div>
          <span className="text-2xl font-normal text-primary">${(data.price || 0).toFixed(2)}</span>
          <div className="flex gap-4 mt-2 text-xs font-mono text-gray-400">
            <span>Call Wall: <span className="text-blue-400">${(data.call_wall||0).toFixed(2)}</span></span>
            <span>Put Wall: <span className="text-red-400">${(data.put_wall||0).toFixed(2)}</span></span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[500px]">
        <div className="lg:col-span-3 bg-[#131722] rounded-xl border border-white/5 p-4 flex flex-col">
          <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Acción de Precio</h3>
          <div className="w-full h-[500px]">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{top:10, right:10, left:0, bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[minPrice, maxPrice]} orientation="right" tick={{fill:'#666', fontSize:11}} width={40} tickFormatter={(v)=>v.toFixed(2)}/>
                    <Tooltip contentStyle={{backgroundColor:'#0f111a', borderColor:'#333'}} itemStyle={{color:'#fff'}} formatter={(v)=>Number(v).toFixed(2)}/>
                    <Legend onClick={toggleLine} wrapperStyle={{cursor:'pointer'}} />
                    <Bar dataKey="close" shape={<CandleStick />} isAnimationActive={false} name="Precio" legendType="rect" />
                    <Line type="monotone" dataKey="sma20" stroke="#fbbf24" dot={false} strokeWidth={1} name="SMA 20" hide={!visibleLines.sma20} isAnimationActive={false}/>
                    <Line type="monotone" dataKey="sma50" stroke="#60a5fa" dot={false} strokeWidth={1} name="SMA 50" hide={!visibleLines.sma50} isAnimationActive={false}/>
                    {data.call_wall && <ReferenceLine y={data.call_wall} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5}/>}
                    {data.put_wall && <ReferenceLine y={data.put_wall} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5}/>}
                  </ComposedChart>
                </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-500">Sin historial</div>}
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#131722] rounded-xl border border-white/5 p-4 flex flex-col">
          <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Perfil GEX</h3>
          <div className="w-full h-[500px]">
            {gexData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gexData} layout="vertical" margin={{left:0, right:10}}>
                    <CartesianGrid stroke="#ffffff05" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="strike" type="category" width={40} tick={{fill:'#666', fontSize:10}} interval={0} />
                    <Tooltip cursor={{fill:'#ffffff05'}} contentStyle={{backgroundColor:'#0f111a', borderColor:'#333'}} formatter={(v)=>v.toFixed(2)}/>
                    <ReferenceLine x={0} stroke="#444" />
                    <Bar dataKey="gex" name="GEX">
                      {gexData.map((e, i) => <Cell key={i} fill={e.gex > 0 ? '#00D4AA' : '#EF4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-500">Sin datos</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleAsset;