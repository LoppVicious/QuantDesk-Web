import React, { useEffect, useState, useMemo } from 'react';
import { getAssetDetails } from '../services/api';
import { 
  ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Line, Cell, Legend 
} from 'recharts';
import { AlertCircle } from 'lucide-react';

const CandleStick = (props) => {
  const { x, width, low, high, open, close } = props;
  const isUp = close > open;
  const color = isUp ? '#00D4AA' : '#EF4444';
  const yAxis = props.yAxis;
  
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
    getAssetDetails(ticker)
      .then(setData)
      .catch(() => setError("Error cargando datos"))
      .finally(() => setLoading(false));
  }, [ticker]);

  const { chartData, gexData, minPrice, maxPrice } = useMemo(() => {
    if (!data || !data.history) return { chartData: [], gexData: [], minPrice: 0, maxPrice: 0 };
    
    // Simulamos OHLC basándonos en el cierre anterior para poder dibujar velas
    const simData = data.history.map((item, i, arr) => {
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

    const vals = simData.flatMap(d => [d.low, d.high].filter(v => v));
    const minP = Math.min(...vals) * 0.98;
    const maxP = Math.max(...vals) * 1.02;

    const gex = (data.gex_profile || []).sort((a,b) => b.strike - a.strike);
    return { chartData: simData, gexData: gex, minPrice: minP, maxPrice: maxP };
  }, [data]);

  const toggleLine = (e) => {
    const { dataKey } = e;
    setVisibleLines(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  if (!ticker) return <div className="text-center p-10 text-gray-500">Selecciona un activo</div>;
  if (loading) return <div className="text-center p-10 text-primary animate-pulse">Cargando...</div>;
  if (error) return <div className="text-center p-10 text-red-400"><AlertCircle className="inline"/> {error}</div>;

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in">
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
        {/* GRÁFICO PRECIO */}
        <div className="lg:col-span-3 bg-[#131722] rounded-xl border border-white/5 p-4 flex flex-col">
          <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Estructura de Precio</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis domain={[minPrice, maxPrice]} orientation="right" tick={{fill:'#666', fontSize:11}} width={40} />
                <Tooltip contentStyle={{backgroundColor:'#0f111a', borderColor:'#333'}} />
                <Legend onClick={toggleLine} wrapperStyle={{cursor:'pointer'}}/>
                
                <Bar dataKey="close" shape={<CandleStick />} isAnimationActive={false} name="Precio (Velas)" />
                
                {visibleLines.sma20 && <Line type="monotone" dataKey="sma20" stroke="#fbbf24" dot={false} strokeWidth={1} name="sma20" />}
                {visibleLines.sma50 && <Line type="monotone" dataKey="sma50" stroke="#60a5fa" dot={false} strokeWidth={1} name="sma50" />}
                
                {data.call_wall && <ReferenceLine y={data.call_wall} stroke="#3b82f6" strokeDasharray="3 3" />}
                {data.put_wall && <ReferenceLine y={data.put_wall} stroke="#ef4444" strokeDasharray="3 3" />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO GEX */}
        <div className="lg:col-span-1 bg-[#131722] rounded-xl border border-white/5 p-4 flex flex-col">
          <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Perfil Gamma</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gexData} layout="vertical" margin={{left:0, right:20}}>
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