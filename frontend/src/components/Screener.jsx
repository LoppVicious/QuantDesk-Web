import React, { useState, useEffect } from 'react';
import { startScanner, getScannerStatus } from '../services/api';
import { Play, Loader2, TrendingUp, AlertTriangle, ArrowRight, Filter, Calendar, BarChart3 } from 'lucide-react';

const SECTORS = [
  "Todos",
  "Communication Services",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Financials",
  "Health Care",
  "Industrials",
  "Information Technology",
  "Materials",
  "Real Estate",
  "Utilities"
];

const Screener = ({ onSelectTicker, onScanComplete, initialResults }) => {
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [results, setResults] = useState(initialResults || []);
  const [progress, setProgress] = useState(0);

  // ESTADO DE LOS FILTROS
  const [sector, setSector] = useState("Todos");
  const [maxDte, setMaxDte] = useState(45);
  const [lookback, setLookback] = useState(30);
  const [numTickers, setNumTickers] = useState(50);

  const handleScan = async () => {
    setLoading(true);
    setResults([]);
    setProgress(5);
    
    // Configuración enviada al backend
    const config = {
      sector: sector,
      num_tickers: numTickers,
      max_dte: parseInt(maxDte),
      lookback: parseInt(lookback)
    };

    try {
      const response = await startScanner(config);
      if (response && response.task_id) setTaskId(response.task_id);
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
          setProgress((prev) => Math.min(prev + 5, 95));
          
          if (statusData.status === 'completed') {
            const data = statusData.data;
            setResults(data);
            
            // ¡IMPORTANTE! Enviamos los datos al padre (App.jsx) para el Playbook
            if (onScanComplete) {
                onScanComplete(data);
            }

            setLoading(false);
            setTaskId(null);
            setProgress(100);
          } else if (statusData.status === 'failed') {
            setLoading(false);
            setTaskId(null);
            alert("Error: " + statusData.error);
          }
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [taskId]);

  // Helper para colores de porcentaje
  const getColorClass = (val) => {
    if (!val) return "text-gray-400"; // Protección si es null
    if (val > 0) return "text-green-400";
    if (val < 0) return "text-red-400";
    return "text-gray-400";
  };

  return (
    <div className="max-w-[95%] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* --- ZONA DE FILTROS Y CONTROL --- */}
      <div className="bg-[#131722] p-6 rounded-2xl border border-white/5 shadow-xl">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          
          <div className="space-y-4 w-full xl:w-auto">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary"/> Configuración del Escáner
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Selector de Sector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Sector S&P 500</label>
                <select 
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                >
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Slider DTE */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                  <span>Días Vencimiento (Max)</span>
                  <span className="text-primary">{maxDte}d</span>
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600"/>
                  <input 
                    type="range" min="7" max="180" step="7"
                    value={maxDte} onChange={(e) => setMaxDte(e.target.value)}
                    className="w-full accent-primary h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Slider Lookback */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                  <span>Lookback Volatilidad</span>
                  <span className="text-primary">{lookback}d</span>
                </label>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-600"/>
                  <input 
                    type="range" min="10" max="90" step="5"
                    value={lookback} onChange={(e) => setLookback(e.target.value)}
                    className="w-full accent-primary h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Botón de Acción */}
          <div className="w-full xl:w-auto">
             {!loading ? (
                <button 
                  onClick={handleScan}
                  className="w-full xl:w-auto group flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-primary transition-all duration-300 shadow-lg shadow-white/5 hover:shadow-primary/20"
                >
                  <div className="bg-black/10 p-1.5 rounded-md group-hover:bg-black/20 transition">
                    <Play className="w-5 h-5" fill="currentColor" />
                  </div>
                  <div>
                    <div className="text-sm leading-none">EJECUTAR</div>
                    <div className="text-xs font-normal opacity-70">ANÁLISIS COMPLETO</div>
                  </div>
                </button>
              ) : (
                <div className="w-full xl:w-64 bg-[#0b0e14] border border-primary/30 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-primary text-xs font-bold animate-pulse">
                    <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> PROCESANDO</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* --- TABLA DE RESULTADOS --- */}
      {results.length > 0 ? (
        <div className="bg-[#131722] rounded-2xl border border-white/5 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-black/30 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-white/5">
                  <th className="p-4 sticky left-0 bg-[#131722] z-10">Ticker</th>
                  <th className="p-4">Sector</th>
                  <th className="p-4 text-right">Precio</th>
                  <th className="p-4 text-right">Dist SMA20</th>
                  <th className="p-4 text-right">Dist SMA50</th>
                  <th className="p-4 text-right text-primary">VRP (IV-RV)</th>
                  <th className="p-4 text-right border-l border-white/5">Call Wall</th>
                  <th className="p-4 text-right">Dist Call</th>
                  <th className="p-4 text-right border-l border-white/5">Put Wall</th>
                  <th className="p-4 text-right">Dist Put</th>
                  <th className="p-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {results.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                    
                    {/* TICKER */}
                    <td className="p-4 sticky left-0 bg-[#131722] group-hover:bg-[#1a1f2e] transition-colors z-10">
                      <div className="font-bold text-white text-base">{row.Ticker}</div>
                    </td>

                    {/* SECTOR */}
                    <td className="p-4 text-xs text-gray-500 truncate max-w-[150px]">{row.Sector}</td>

                    {/* PRECIO (Con protección || 0) */}
                    <td className="p-4 text-right font-mono text-gray-300">${(row.Price || 0).toFixed(2)}</td>

                    {/* SMAs (Con protección || 0) */}
                    <td className={`p-4 text-right font-mono ${getColorClass(row['Dist SMA20 %'])}`}>
                      {(row['Dist SMA20 %'] || 0) > 0 ? '+' : ''}{(row['Dist SMA20 %'] || 0).toFixed(2)}%
                    </td>
                    <td className={`p-4 text-right font-mono ${getColorClass(row['Dist SMA50 %'])}`}>
                      {(row['Dist SMA50 %'] || 0) > 0 ? '+' : ''}{(row['Dist SMA50 %'] || 0).toFixed(2)}%
                    </td>

                    {/* VRP */}
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        (row.VRP || 0) < 0 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {(row.VRP || 0).toFixed(2)}
                      </span>
                    </td>

                    {/* CALL WALL */}
                    <td className="p-4 text-right font-mono border-l border-white/5 text-blue-300">
                      {(row['Call Wall'] || 0).toFixed(0)}
                    </td>
                    <td className="p-4 text-right text-gray-400 text-xs">
                      {(row['Dist Call Wall %'] || 0).toFixed(1)}%
                    </td>

                    {/* PUT WALL */}
                    <td className="p-4 text-right font-mono border-l border-white/5 text-red-300">
                      {(row['Put Wall'] || 0).toFixed(0)}
                    </td>
                    <td className="p-4 text-right text-gray-400 text-xs">
                      {(row['Dist Put Wall %'] || 0).toFixed(1)}%
                    </td>

                    {/* ACTION */}
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => onSelectTicker(row.Ticker)}
                        className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg group-hover:text-white"
                        title="Ver Análisis Detallado"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600 border border-dashed border-white/5 rounded-2xl bg-[#131722]/30">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm">Configura los filtros y pulsa <span className="text-white font-bold">EJECUTAR</span></p>
          </div>
        )
      )}
    </div>
  );
};

export default Screener;