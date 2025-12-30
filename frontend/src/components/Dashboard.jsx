import React, { useEffect, useRef } from 'react';
import { List, CalendarDays, ArrowRight, Star, Activity, AlertCircle } from 'lucide-react';

// MOCKUP CALENDARIO
const MOCK_CALENDAR = [
  { time: '08:30', currency: 'USD', impact: 'high', event: 'Non-Farm Payrolls', actual: '190K', forecast: '180K', prev: '216K' },
  { time: '14:00', currency: 'USD', impact: 'high', event: 'FOMC Meeting', actual: '-', forecast: '-', prev: '-' },
  { time: '16:30', currency: 'USD', impact: 'low', event: 'Crude Oil Inv.', actual: '1.2M', forecast: '-0.5M', prev: '-2.5M' },
];

// WIDGET ESTADÍSTICAS
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

// --- COMPONENTE TRADINGVIEW PERSONALIZADO ---
const TradingViewWidget = () => {
  const container = useRef();

  useEffect(() => {
    if (container.current) {
        container.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": "AMEX:SPY", // <--- CORRECCIÓN: SPY por defecto
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1", // 1 = Velas
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true, // <--- Permite cambiar el ticker
      "backgroundColor": "rgba(19, 23, 34, 1)", // <--- Fondo exacto de tu App (#131722)
      "gridColor": "rgba(255, 255, 255, 0.02)", // Rejilla muy sutil
      "hide_top_toolbar": false, // Muestra herramientas de tiempo y ticker
      "hide_legend": false,
      "save_image": false,
      "calendar": false,
      "hide_volume": true,
      "support_host": "https://www.tradingview.com",
      // --- TUS COLORES CORPORATIVOS ---
      "overrides": {
          "mainSeriesProperties.candleStyle.upColor": "#00D4AA",
          "mainSeriesProperties.candleStyle.downColor": "#EF4444",
          "mainSeriesProperties.candleStyle.borderUpColor": "#00D4AA",
          "mainSeriesProperties.candleStyle.borderDownColor": "#EF4444",
          "mainSeriesProperties.candleStyle.wickUpColor": "#00D4AA",
          "mainSeriesProperties.candleStyle.wickDownColor": "#EF4444"
      }
    });
    
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%", borderRadius: "1rem", overflow: "hidden" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
    </div>
  );
};

const Dashboard = ({ watchlist, onSelectTicker }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* 1. WIDGETS HEADER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MarketStatCard 
            title="SPX Daily" 
            value="+0.45%" 
            color="text-green-400" 
            subtext="En tiempo real (TV)"
        />
        <MarketStatCard title="Gamma Regime" value="Positiva" subtext="Baja Volatilidad (Simulado)" color="text-green-400" />
        <MarketStatCard title="0DTE Volume" value="42%" trend="Alta" subtext="Ratio Volumen (Simulado)" color="text-blue-400" />
        <MarketStatCard title="VIX Index" value="13.20" subtext="Zona Complacencia (Simulado)" color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA (2/3): Gráfico TradingView */}
        <div className="xl:col-span-2 space-y-6">
            <div className="bg-[#131722] rounded-2xl border border-white/5 shadow-xl h-[500px] overflow-hidden relative">
                {/* WIDGET TRADINGVIEW */}
                <TradingViewWidget />
            </div>
        </div>

        {/* COLUMNA DERECHA (1/3): Sidebar Widgets */}
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