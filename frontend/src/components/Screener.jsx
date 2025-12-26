import React, { useState, useEffect } from 'react';
import { startScanner, getScannerStatus } from '../services/api';
import { Play, Loader2, TrendingUp, ArrowRight, Filter, Calendar, BarChart3, Star, ArrowUp, ArrowDown } from 'lucide-react';

const SECTORS = [
  "Todos", "Communication Services", "Consumer Discretionary", "Consumer Staples",
  "Energy", "Financials", "Health Care", "Industrials", "Information Technology",
  "Materials", "Real Estate", "Utilities"
];

const Screener = ({ onSelectTicker, onScanComplete, initialResults, watchlist, onToggleWatchlist }) => {
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [results, setResults] = useState(initialResults || []);
  const [progress, setProgress] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'default' });

  // Filtros
  const [sector, setSector] = useState("Todos");
  const [maxDte, setMaxDte] = useState(45); 
  const [lookback, setLookback] = useState(30);
  const [numTickers] = useState(600); 

  const handleScan = async () => {
    setLoading(true);
    setResults([]);
    setProgress(1);
    try {
      const response = await startScanner({
        sector, num_tickers: numTickers, max_dte: parseInt(maxDte), lookback: parseInt(lookback)
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
          setProgress((prev) => Math.max(prev, statusData.progress || 0));
          if (statusData.status === 'completed') {
            setResults(statusData.data);
            if (onScanComplete) onScanComplete(statusData.data);
            setLoading(false);
            setTaskId(null);
            setProgress(100);
          } else if (statusData.status === 'failed') {
            setLoading(false);
            setTaskId(null);
            alert("Error: " + statusData.error);
          }
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [taskId]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'default';
    setSortConfig({ key, direction });
  };

  const sortedResults = React.useMemo(() => {
    if (sortConfig.direction === 'default' || !sortConfig.key) return results;
    return [...results].sort((a, b) => {
        const valA = a[sortConfig.key] || 0;
        const valB = b[sortConfig.key] || 0;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [results, sortConfig]);

  // COMPONENTE HEADER ORDENABLE (FLECHAS PEGADAS)
  const SortableHeader = ({ label, colKey, align = "right" }) => (
      <th 
        className={`p-4 cursor-pointer hover:text-white transition-colors select-none text-${align}`} 
        onClick={() => handleSort(colKey)}
      >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
            {label}
            <div className="flex flex-col w-3">
                {sortConfig.key === colKey && sortConfig.direction === 'asc' && <ArrowUp className="w-3 h-3 text-primary" />}
                {sortConfig.key === colKey && sortConfig.direction === 'desc' && <ArrowDown className="w-3 h-3 text-primary" />}
            </div>
        </div>
      </th>
  );

  const getColorClass = (val) => (!val) ? "text-gray-400" : (val > 0 ? "text-green-400" : "text-red-400");

  return (
    <div className="max-w-[95%] mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      {/* PANEL DE FILTROS */}
      <div className="bg-[#131722] p-6 rounded-2xl border border-white/5 shadow-xl">
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary"/> Configuración
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Sector</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full bg-[#0b0e14] border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:border-primary focus:outline-none">
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex justify-between"><span>Max DTE</span> <span className="text-primary font-mono">{maxDte}d</span></label>
              <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-gray-600"/><input type="range" min="7" max="364" step="7" value={maxDte} onChange={(e) => setMaxDte(e.target.value)} className="w-full accent-primary h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"/></div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex justify-between"><span>Lookback</span> <span className="text-primary font-mono">{lookback}d</span></label>
              <div className="flex items-center gap-3"><BarChart3 className="w-4 h-4 text-gray-600"/><input type="range" min="10" max="90" step="5" value={lookback} onChange={(e) => setLookback(e.target.value)} className="w-full accent-primary h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"/></div>
            </div>
            <div>
               {!loading ? (
                  <button onClick={handleScan} className="w-full bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-primary hover:text-black transition-all shadow-lg flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" /> EJECUTAR
                  </button>
                ) : (
                  <div className="w-full bg-[#0b0e14] border border-primary/30 rounded-xl p-3 flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                    <div className="flex items-center gap-2 text-primary text-xs font-bold z-10"><Loader2 className="w-4 h-4 animate-spin" /> {progress}%</div>
                    <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300" style={{width: `${progress}%`}}></div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE RESULTADOS */}
      {sortedResults.length > 0 ? (
        <div className="bg-[#131722] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left whitespace-nowrap relative">
              <thead className="sticky top-0 z-20 bg-[#131722] shadow-sm">
                <tr className="text-gray-500 text-[11px] font-bold uppercase border-b border-white/5">
                  <th className="p-4 sticky left-0 bg-[#131722]">Ticker</th>
                  <th className="p-4">Sector</th>
                  <SortableHeader label="Precio" colKey="Price" />
                  <SortableHeader label="Dist SMA20" colKey="Dist SMA20 %" />
                  <SortableHeader label="Dist SMA50" colKey="Dist SMA50 %" />
                  <SortableHeader label="VRP" colKey="VRP" />
                  <th className="p-4 text-right border-l border-white/5">Call Wall</th>
                  <th className="p-4 text-right border-l border-white/5">Put Wall</th>
                  <th className="p-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {sortedResults.map((row, idx) => {
                  const isWatched = watchlist && watchlist.includes(row.Ticker);
                  return (
                  <tr key={idx} className="hover:bg-white/[0.02] group transition-colors">
                    {/* TICKER SIN SOMBRA, ESTRELLA PEGADA */}
                    <td className="p-4 font-bold text-white sticky left-0 bg-[#131722] group-hover:bg-[#1a1f2e] transition-colors border-r border-white/5 flex items-center gap-3">
                        <button onClick={() => onToggleWatchlist(row.Ticker)} className="hover:scale-110 transition-transform">
                            <Star className={`w-4 h-4 ${isWatched ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700 hover:text-yellow-400'}`} />
                        </button>
                        <span>{row.Ticker}</span>
                    </td>
                    <td className="p-4 text-xs text-gray-500 truncate max-w-[150px]">{row.Sector}</td>
                    <td className="p-4 text-right font-mono text-gray-300">${(row.Price || 0).toFixed(2)}</td>
                    <td className={`p-4 text-right font-mono ${getColorClass(row['Dist SMA20 %'])}`}>{(row['Dist SMA20 %'] || 0).toFixed(2)}%</td>
                    <td className={`p-4 text-right font-mono ${getColorClass(row['Dist SMA50 %'])}`}>{(row['Dist SMA50 %'] || 0).toFixed(2)}%</td>
                    <td className={`p-4 text-right font-bold ${getColorClass(row.VRP)}`}>{(row.VRP || 0).toFixed(2)}</td>
                    <td className="p-4 text-right font-mono border-l border-white/5 text-blue-300">{(row['Call Wall'] || 0).toFixed(0)}</td>
                    <td className="p-4 text-right font-mono border-l border-white/5 text-red-300">{(row['Put Wall'] || 0).toFixed(0)}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => onSelectTicker(row.Ticker)} className="text-gray-400 hover:text-white hover:bg-primary/20 p-2 rounded-lg transition-all"><ArrowRight className="w-5 h-5" /></button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-[#0b0e14] border-t border-white/5 text-xs text-center text-gray-600">Mostrando {sortedResults.length} activos</div>
        </div>
      ) : (
        !loading && <div className="text-center py-20 text-gray-600 border border-dashed border-white/5 rounded-2xl bg-[#131722]/50"><TrendingUp className="w-12 h-12 mx-auto opacity-20 mb-4" /><p>Sin resultados.</p></div>
      )}
    </div>
  );
};

export default Screener;