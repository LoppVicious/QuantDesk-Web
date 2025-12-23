import React, { useState, useEffect } from 'react';
import { startScanner, getScannerStatus } from '../services/api';
import { Play, Loader2, TrendingUp, ArrowRight, Filter, Calendar, BarChart3 } from 'lucide-react';

const SECTORS = [
  "Todos", "Communication Services", "Consumer Discretionary", "Consumer Staples",
  "Energy", "Financials", "Health Care", "Industrials", "Information Technology",
  "Materials", "Real Estate", "Utilities"
];

const Screener = ({ onSelectTicker, onScanComplete, initialResults }) => {
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [results, setResults] = useState(initialResults || []);
  const [progress, setProgress] = useState(0);

  // Filtros
  const [sector, setSector] = useState("Todos");
  // AHORA LLEGA HASTA 364
  const [maxDte, setMaxDte] = useState(45); 
  const [lookback, setLookback] = useState(30);
  
  // Por defecto 600 para asegurar que descargue TODO el SP500 si no se filtra
  const [numTickers] = useState(600); 

  const handleScan = async () => {
    setLoading(true);
    setResults([]);
    setProgress(1); // Empezamos en 1%
    
    try {
      const response = await startScanner({
        sector, 
        num_tickers: numTickers, 
        max_dte: parseInt(maxDte), 
        lookback: parseInt(lookback)
      });
      if (response?.task_id) setTaskId(response.task_id);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (taskId) {
      interval = setInterval(async () => {
        const statusData = await getScannerStatus(taskId);
        if (statusData) {
          // Actualizamos progreso real del backend si viene, o incrementamos visualmente suave
          const backendProgress = statusData.progress || 0;
          setProgress((prev) => Math.max(prev, backendProgress));
          
          if (statusData.status === 'completed') {
            const data = statusData.data;
            setResults(data);
            if (onScanComplete) onScanComplete(data);
            setLoading(false);
            setTaskId(null);
            setProgress(100);
          } else if (statusData.status === 'failed') {
            setLoading(false);
            setTaskId(null);
            alert("Error durante el escaneo: " + statusData.error);
          }
        }
      }, 1500); // Polling cada 1.5s
    }
    return () => clearInterval(interval);
  }, [taskId]);

  const getColorClass = (val) => {
    if (val === undefined || val === null) return "text-gray-400";
    return val > 0 ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="max-w-[95%] mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      {/* PANEL DE CONTROL */}
      <div className="bg-[#131722] p-6 rounded-2xl border border-white/5 shadow-xl">
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary"/> Configuración del Escáner
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            {/* SECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sector</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full bg-[#0b0e14] border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:border-primary focus:outline-none transition-colors">
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* DTE SLIDER (HASTA 364) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                <span>Max DTE</span> <span className="text-primary font-mono">{maxDte}d</span>
              </label>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-600"/>
                <input 
                  type="range" min="7" max="364" step="7" 
                  value={maxDte} onChange={(e) => setMaxDte(e.target.value)} 
                  className="w-full accent-primary h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer hover:bg-gray-700 transition-colors"
                />
              </div>
            </div>

            {/* LOOKBACK SLIDER */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                <span>Lookback</span> <span className="text-primary font-mono">{lookback}d</span>
              </label>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-gray-600"/>
                <input 
                  type="range" min="10" max="90" step="5" 
                  value={lookback} onChange={(e) => setLookback(e.target.value)} 
                  className="w-full accent-primary h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer hover:bg-gray-700 transition-colors"
                />
              </div>
            </div>

            {/* BOTÓN EJECUTAR */}
            <div>
               {!loading ? (
                  <button onClick={handleScan} className="w-full bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-primary hover:text-black transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" /> EJECUTAR ESCÁNER
                  </button>
                ) : (
                  <div className="w-full bg-[#0b0e14] border border-primary/30 rounded-xl p-3 flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                    <div className="flex items-center gap-2 text-primary text-xs font-bold z-10">
                       <Loader2 className="w-4 h-4 animate-spin" /> PROCESANDO {progress}%
                    </div>
                    {/* Barra de progreso visual */}
                    <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300" style={{width: `${progress}%`}}></div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE RESULTADOS */}
      {results.length > 0 ? (
        <div className="bg-[#131722] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left whitespace-nowrap relative">
              <thead className="sticky top-0 z-20 bg-[#131722] shadow-sm">
                <tr className="text-gray-500 text-[11px] font-bold uppercase border-b border-white/5">
                  <th className="p-4 bg-[#131722]">Ticker</th>
                  <th className="p-4">Sector</th>
                  <th className="p-4 text-right">Precio</th>
                  <th className="p-4 text-right">Dist SMA20</th>
                  <th className="p-4 text-right">Dist SMA50</th>
                  <th className="p-4 text-right text-primary">VRP</th>
                  <th className="p-4 text-right border-l border-white/5">Call Wall</th>
                  <th className="p-4 text-right border-l border-white/5">Put Wall</th>
                  <th className="p-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {results.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] group transition-colors">
                    <td className="p-4 font-bold text-white sticky left-0 bg-[#131722] group-hover:bg-[#1a1f2e] transition-colors shadow-lg shadow-black/20 border-r border-white/5">
                      {row.Ticker}
                    </td>
                    <td className="p-4 text-xs text-gray-500 truncate max-w-[150px]">{row.Sector}</td>
                    <td className="p-4 text-right font-mono text-gray-300">${(row.Price || 0).toFixed(2)}</td>
                    <td className={`p-4 text-right font-mono ${getColorClass(row['Dist SMA20 %'])}`}>
                        {(row['Dist SMA20 %'] || 0).toFixed(2)}%
                    </td>
                    <td className={`p-4 text-right font-mono ${getColorClass(row['Dist SMA50 %'])}`}>
                        {(row['Dist SMA50 %'] || 0).toFixed(2)}%
                    </td>
                    <td className={`p-4 text-right font-bold ${getColorClass(row.VRP)}`}>
                        {(row.VRP || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-mono border-l border-white/5 text-blue-300">
                        {(row['Call Wall'] || 0).toFixed(0)}
                    </td>
                    <td className="p-4 text-right font-mono border-l border-white/5 text-red-300">
                        {(row['Put Wall'] || 0).toFixed(0)}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => onSelectTicker(row.Ticker)} className="text-gray-400 hover:text-white hover:bg-primary/20 p-2 rounded-lg transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-[#0b0e14] border-t border-white/5 text-xs text-center text-gray-600">
            Mostrando {results.length} activos
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center py-20 text-gray-600 border border-dashed border-white/5 rounded-2xl bg-[#131722]/50">
            <TrendingUp className="w-12 h-12 mx-auto opacity-20 mb-4" />
            <p>Selecciona filtros y pulsa <span className="text-white font-bold">EJECUTAR</span> para escanear el mercado.</p>
          </div>
        )
      )}
    </div>
  );
};

export default Screener;