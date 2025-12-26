import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { TrendingUp, List, CalendarDays, ArrowRight, Star, Activity, AlertCircle, BarChart2, LineChart } from 'lucide-react';
import { getAssetDetails } from '../services/api';

// MOCKUP CALENDARIO
const MOCK_CALENDAR = [
  { time: '08:30', currency: 'USD', impact: 'high', event: 'Non-Farm Payrolls', actual: '190K', forecast: '180K', prev: '216K' },
  { time: '14:00', currency: 'USD', impact: 'high', event: 'FOMC Meeting', actual: '-', forecast: '-', prev: '-' },
  { time: '16:30', currency: 'USD', impact: 'low', event: 'Crude Oil Inv.', actual: '1.2M', forecast: '-0.5M', prev: '-2.5M' },
];

// WIDGET PEQUEÑO
const MarketStatCard = ({ title, value, subtext, trend, color }) => (
    <div className="bg-[#131722] p-3 rounded-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors h-24">
        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{title}</span>
        <div>
            <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${color}`}>{value}</span>
                {trend && <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-300">{trend}</span>}
            </div>
            <p className="text-[10px] text-gray-600 mt-1">{subtext}</p>
        </div>
    </div>
);

const MarketChart = ({ onPriceChange }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('area'); 
  const [timeRange, setTimeRange] = useState(30); 

  useEffect(() => {
    setLoading(true);
    getAssetDetails("SPY")
      .then(res => {
        if(res && res.history && res.history.length > 0) {
            // Calcular cambio diario real para el widget
            const last = res.history[res.history.length - 1];
            const prev = res.history[res.history.length - 2];
            if (last && prev && onPriceChange) {
                const change = ((last.close - prev.close) / prev.close) * 100;
                onPriceChange(change);
            }

            // Procesar datos para velas
            const processed = res.history.map((d, i, arr) => {
                const prevClose = i > 0 ? arr[i-1].close : d.close;
                return {
                    date: d.date,
                    close: d.close,
                    open: d.open || prevClose, // Fallback si open es 0
                    high: d.high || Math.max(d.close, prevClose) * 1.001,
                    low: d.low || Math.min(d.close, prevClose) * 0.999
                };
            });
            setData(processed);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredData = data.slice(-timeRange);
  // Calcular min/max dinámico para que el gráfico se vea bien
  const allValues = filteredData.flatMap(d => [d.low, d.high, d.close].filter(v => v));
  const minPrice = allValues.length ? Math.min(...allValues) * 0.995 : 0;
  const maxPrice = allValues.length ? Math.max(...allValues) * 1.005 : 100;

  return (
    <div className="h-full flex flex-col">
        {/* CONTROLES */}
        <div className="flex justify-between items-center mb-2 px-1">
            <div className="flex bg-black/30 rounded-lg p-0.5 gap-0.5">
                <button onClick={()=>setChartType('area')} className={`p-1.5 rounded ${chartType==='area'?'bg-white/10 text-primary':'text-gray-500'}`}><LineChart size={14}/></button>
                <button onClick={()=>setChartType('candles')} className={`p-1.5 rounded ${chartType==='candles'?'bg-white/10 text-primary':'text-gray-500'}`}><BarChart2 size={14}/></button>
            </div>
            <div className="flex bg-black/30 rounded-lg p-0.5 gap-1 text-[10px] font-bold text-gray-500">
                {[5, 30, 90, 180].map(days => (
                    <button key={days} onClick={()=>setTimeRange(days)} className={`px-2 py-1 rounded hover:text-white ${timeRange===days?'bg-white/10 text-white':''}`}>
                        {days === 5 ? '5D' : days === 30 ? '1M' : `${days/30}M`}
                    </button>
                ))}
            </div>
        </div>

        {/* AREA GRAFICA */}
        <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                    <AreaChart data={filteredData}>
                        <defs>
                            <linearGradient id="colorSpy" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/><stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[minPrice, maxPrice]} orientation="right" tick={{fill:'#666', fontSize:10}} width={35} tickFormatter={v=>v.toFixed(0)}/>
                        <Tooltip contentStyle={{backgroundColor:'#0f111a', borderColor:'#333'}} itemStyle={{color:'#fff'}} formatter={v=>v.toFixed(2)}/>
                        <Area type="monotone" dataKey="close" stroke="#00D4AA" fillOpacity={1} fill="url(#colorSpy)" strokeWidth={2} />
                    </AreaChart>
                ) : (
                    <BarChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[minPrice, maxPrice]} orientation="right" tick={{fill:'#666', fontSize:10}} width={35} tickFormatter={v=>v.toFixed(0)}/>
                        <Tooltip contentStyle={{backgroundColor:'#0f111a', borderColor:'#333'}} itemStyle={{color:'#fff'}} cursor={{fill:'transparent'}}/>
                        <Bar dataKey="close" shape={(props) => {
                            const { x, y, width, payload, yAxis } = props;
                            // Protección contra crash
                            if (!yAxis || !payload) return null;
                            const open = payload.open;
                            const close = payload.close;
                            
                            const yOpen = yAxis.scale(open);
                            const yClose = yAxis.scale(close);
                            if (!isFinite(yOpen) || !isFinite(yClose)) return null;

                            const isUp = close > open;
                            const color = isUp ? '#00D4AA' : '#EF4444';
                            const height = Math.max(1, Math.abs(yOpen - yClose));
                            const yTop = Math.min(yOpen, yClose);

                            return <rect x={x} y={yTop} width={width} height={height} fill={color} />;
                        }} />
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
    </div>
  );
};

const Dashboard = ({ watchlist, onSelectTicker }) => {
  const [spxChange, setSpxChange] = useState(0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* 1. WIDGETS HEADER (Datos simulados excepto SPX Daily que se calcula) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MarketStatCard 
            title="SPX Daily" 
            value={`${spxChange > 0 ? '+' : ''}${spxChange.toFixed(2)}%`} 
            color={spxChange >= 0 ? "text-green-400" : "text-red-400"} 
            subtext="Calculado sobre cierre previo"
        />
        <MarketStatCard title="Gamma Regime" value="Positiva" subtext="Baja Volatilidad (Simulado)" color="text-green-400" />
        <MarketStatCard title="0DTE Volume" value="42%" trend="Alta" subtext="Ratio Volumen (Simulado)" color="text-blue-400" />
        <MarketStatCard title="VIX Index" value="13.20" subtext="Zona Complacencia (Simulado)" color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* GRÁFICO SPY */}
        <div className="xl:col-span-2 space-y-6">
            <div className="bg-[#131722] rounded-2xl border border-white/5 p-6 shadow-xl h-[450px] flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg"><TrendingUp className="w-5 h-5 text-primary" /></div>
                        <h2 className="text-lg font-bold text-white">S&P 500 (SPY)</h2>
                    </div>
                    <button onClick={() => onSelectTicker("SPY")} className="p-2 bg-white/5 rounded-lg hover:bg-primary hover:text-black transition-colors">
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                <MarketChart onPriceChange={setSpxChange} />
            </div>
        </div>

        {/* SIDEBAR WIDGETS */}
        <div className="space-y-6 flex flex-col h-full">
            
            {/* WATCHLIST */}
            <div className="bg-[#131722] rounded-2xl border border-white/5 p-6 shadow-xl flex-1 max-h-[300px] flex flex-col">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                    <List className="w-4 h-4 text-yellow-400" />
                    <h2 className="text-md font-bold text-white">Watchlist</h2>
                </div>
                {watchlist.length > 0 ? (
                    <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {watchlist.map(ticker => (
                            <div key={ticker} className="flex items-center justify-between p-2 bg-[#0b0e14] rounded hover:bg-white/5 cursor-pointer group" onClick={() => onSelectTicker(ticker)}>
                                <div className="flex items-center gap-2">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="font-bold text-white text-sm">{ticker}</span>
                                </div>
                                <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-white" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-500 text-xs">
                        <Star className="w-6 h-6 opacity-20 mb-2" /> Sin favoritos
                    </div>
                )}
            </div>

            {/* CALENDARIO */}
            <div className="bg-[#131722] rounded-2xl border border-white/5 p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                    <CalendarDays className="w-4 h-4 text-blue-400" />
                    <h2 className="text-md font-bold text-white">Agenda</h2>
                </div>
                <div className="space-y-2">
                    <div className="grid grid-cols-4 text-[10px] text-gray-500 uppercase font-bold mb-1 px-2">
                        <span className="col-span-2">Evento</span>
                        <span className="text-right">Est.</span>
                        <span className="text-right">Real</span>
                    </div>
                    {MOCK_CALENDAR.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-4 items-center p-2 bg-[#0b0e14] rounded border border-white/5 text-xs hover:bg-white/5">
                            <div className="col-span-2 flex flex-col">
                                <span className="text-white font-medium truncate">{item.event}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-gray-500 font-mono text-[10px]">{item.time}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${item.impact==='high'?'bg-red-500':'bg-yellow-500'}`}></div>
                                </div>
                            </div>
                            <div className="text-right text-gray-400 font-mono">{item.forecast}</div>
                            <div className={`text-right font-mono font-bold ${item.actual==='-'?'text-gray-600':'text-white'}`}>{item.actual}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-gray-600">
                    <AlertCircle className="w-3 h-3"/> Datos de ejemplo
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;