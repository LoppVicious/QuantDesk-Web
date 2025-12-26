// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, List, CalendarDays, ArrowRight, Star, Activity, AlertCircle } from 'lucide-react';
import { getAssetDetails } from '../services/api';

// --- DATOS DE EJEMPLO PARA EL CALENDARIO ---
const MOCK_CALENDAR = [
  { time: '08:30', currency: 'USD', impact: 'high', event: 'Non-Farm Payrolls (NFP)', forecast: '180K', previous: '216K' },
  { time: '10:00', currency: 'USD', impact: 'medium', event: 'ISM Services PMI', forecast: '52.5', previous: '52.7' },
  { time: '14:00', currency: 'USD', impact: 'high', event: 'FOMC Meeting Minutes', forecast: '-', previous: '-' },
  { time: '16:30', currency: 'USD', impact: 'low', event: 'Crude Oil Inventories', forecast: '1.2M', previous: '-2.5M' },
];

// --- COMPONENTE DEL GRÁFICO SPY ---
const MarketOverviewChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargamos datos del SPY para el gráfico general
    getAssetDetails("SPY")
      .then(res => {
        if(res && res.history) {
            const cleanData = res.history.map(d => ({
                date: d.date,
                close: d.close
            })).slice(-90); // Últimos 3 meses
            setData(cleanData);
        }
      })
      .catch(err => console.error("Error cargando mercado", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center text-primary animate-pulse">Cargando mercado...</div>;
  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-500">Datos no disponibles</div>;

  const minPrice = Math.min(...data.map(d => d.close)) * 0.99;
  const maxPrice = Math.max(...data.map(d => d.close)) * 1.01;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSpy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis domain={[minPrice, maxPrice]} orientation="right" tick={{fill:'#666', fontSize:10}} tickFormatter={v => v.toFixed(0)} width={35}/>
          <Tooltip contentStyle={{backgroundColor:'#0f111a', borderColor:'#333'}} itemStyle={{color:'#fff'}} formatter={v => v.toFixed(2)} />
          <Area type="monotone" dataKey="close" stroke="#00D4AA" fillOpacity={1} fill="url(#colorSpy)" strokeWidth={2} name="SPY" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DASHBOARD ---
const Dashboard = ({ watchlist, onSelectTicker }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-white">Market Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Visión general del mercado y seguimiento de activos.</p>
        </div>
        <div className="text-right hidden md:block">
            <div className="flex items-center gap-2 text-primary font-bold bg-primary/10 px-3 py-1 rounded-full">
                <Activity className="w-4 h-4" /> Mercado Abierto
            </div>
        </div>
      </header>

      {/* GRID LAYOUT PRINCIPAL */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA (2/3 ancho): Gráfico SPY */}
        <div className="xl:col-span-2 space-y-6">
            <div className="bg-[#131722] rounded-2xl border border-white/5 p-6 shadow-xl relative group hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">S&P 500 (SPY)</h2>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Índice de Referencia</p>
                        </div>
                    </div>
                    <button onClick={() => onSelectTicker("SPY")} className="p-2 bg-white/5 rounded-lg hover:bg-primary hover:text-black transition-colors" title="Analizar SPY">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
                <MarketOverviewChart />
            </div>
        </div>

        {/* COLUMNA DERECHA (1/3 ancho): Widgets */}
        <div className="space-y-6 flex flex-col h-full">
            
            {/* WIDGET 1: WATCHLIST (Tus favoritos) */}
            <div className="bg-[#131722] rounded-2xl border border-white/5 p-6 shadow-xl flex-1 min-h-[300px]">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
                    <List className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-bold text-white">Tu Watchlist</h2>
                    <span className="text-xs text-gray-500 ml-auto">{watchlist.length} activos</span>
                </div>
                
                {watchlist.length > 0 ? (
                    <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                        {watchlist.map(ticker => (
                            <div key={ticker} className="flex items-center justify-between p-3 bg-[#0b0e14] rounded-xl border border-white/5 hover:border-yellow-400/50 transition-colors group cursor-pointer" onClick={() => onSelectTicker(ticker)}>
                                <div className="flex items-center gap-3">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="font-bold text-white">{ticker}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-white">
                                    Ver <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500 border border-dashed border-white/5 rounded-xl bg-[#0b0e14]/50">
                        <Star className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-sm">Lista vacía</p>
                        <p className="text-xs mt-1 text-gray-600">Marca ⭐ en el Screener</p>
                    </div>
                )}
            </div>

            {/* WIDGET 2: CALENDARIO ECONÓMICO */}
            <div className="bg-[#131722] rounded-2xl border border-white/5 p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
                    <CalendarDays className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-bold text-white">Calendario</h2>
                </div>
                <div className="space-y-3">
                    {MOCK_CALENDAR.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#0b0e14] rounded-lg border border-white/5 text-sm hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-gray-400 text-xs w-10">{item.time}</span>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.impact === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-yellow-500'}`}></div>
                                <div className="flex flex-col">
                                    <span className="text-white font-medium text-xs truncate max-w-[140px]">{item.event}</span>
                                    <span className="text-[10px] text-gray-600">{item.currency}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-white font-bold text-xs">{item.forecast}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-center text-[10px] text-gray-600 mt-4 flex items-center justify-center gap-1 opacity-50">
                    <AlertCircle className="w-3 h-3"/> Datos simulados
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;