import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Activity, Target, Shield } from 'lucide-react';

const StrategyCard = ({ row, type }) => {
  // --- BLINDAJE DE DATOS (Evita pantalla blanca) ---
  const price = row.Price || 0;
  const sma20 = row['Dist SMA20 %'] ? price / (1 + row['Dist SMA20 %'] / 100) : price;
  const sma50 = row['Dist SMA50 %'] ? price / (1 + row['Dist SMA50 %'] / 100) : price;
  const vrp = row.VRP || 0;
  const iv = row.IV || 0;
  const callWall = row['Call Wall'] || 0;
  const putWall = row['Put Wall'] || 0;
  const distCall = row['Dist Call Wall %'] || 0;
  const distPut = row['Dist Put Wall %'] || 0;

  // Lógica de Estrategia (Ported from Python)
  let spotStrat = "Neutral / Watch";
  let reason = "Sin señal clara.";
  let optStrat = "Wait";

  if (type === 'long') {
    // LÓGICA BULLISH
    if (Math.abs(distCall) < 2) {
      spotStrat = "Accumulate (Gamma Breakout)";
      reason = "Spot comprimido contra Call Wall.";
    } else if (price > sma20) {
      spotStrat = "Momentum Buy";
      reason = "Tendencia fuerte sobre SMA20.";
    } else if (price < sma20 && price > sma50) {
      spotStrat = "Buy the Dip (Technical)";
      reason = "Corrección saludable hacia SMA50.";
    } else {
      spotStrat = "Value Reversal Watch";
      reason = "Precio bajo SMA50 (posible rebote).";
    }
    optStrat = vrp < -5 ? "Long Call / Straddle" : "Bull Call Spread";
  } else {
    // LÓGICA BEARISH
    if (Math.abs(distPut) < 2) {
      spotStrat = "Breakdown Watch";
      reason = "Spot presionando soporte Put Wall.";
    } else if (price > sma20 * 1.05) {
      spotStrat = "Mean Reversion Short";
      reason = "Precio extendido (Overbought).";
    } else {
      spotStrat = "Fade the Rally";
      reason = "Resistencia técnica.";
    }
    optStrat = vrp > 5 ? "Iron Condor / Credit Spread" : "Put Debit Spread";
  }

  const cardColor = type === 'long' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500';
  const badgeColor = type === 'long' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';

  return (
    <div className={`bg-[#131722] rounded-xl p-5 border border-white/5 shadow-lg ${cardColor} hover:bg-white/[0.02] transition-colors`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {row.Ticker}
            <span className="text-sm font-normal text-gray-500">${price.toFixed(2)}</span>
          </h3>
          <span className="text-xs text-gray-500">{row.Sector}</span>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold border ${badgeColor}`}>
          VRP {vrp.toFixed(1)}
        </span>
      </div>

      <div className="space-y-3">
        <div className={`text-sm font-medium ${type === 'long' ? 'text-green-200' : 'text-red-200'}`}>
          <span className="opacity-70">Señal:</span> {reason}
        </div>
        
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-400 bg-black/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-primary" />
            <strong className="text-gray-300">Estrategia Spot:</strong> {spotStrat}
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary" />
            <strong className="text-gray-300">Opciones:</strong> {optStrat} (IV {iv.toFixed(1)}%)
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-primary" />
            <strong className="text-gray-300">Vigilancia:</strong> {type === 'long' ? `Call Wall $${callWall.toFixed(0)}` : `Put Wall $${putWall.toFixed(0)}`}
          </div>
        </div>
      </div>
    </div>
  );
};

const Playbook = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-600 border border-dashed border-white/5 rounded-2xl bg-[#131722]/30">
        <Activity className="w-12 h-12 mb-4 opacity-20" />
        <p>Ejecuta el escáner para generar oportunidades.</p>
      </div>
    );
  }

  // Filtrar y Ordenar
  const validData = data.filter(r => r.VRP !== undefined && r.VRP !== null);
  const topLongs = [...validData].sort((a, b) => (a.VRP || 0) - (b.VRP || 0)).slice(0, 6);
  const topShorts = [...validData].sort((a, b) => (b.VRP || 0) - (a.VRP || 0)).slice(0, 6);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* COLUMNA BULLISH */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-400 font-bold text-lg mb-2">
          <TrendingUp className="w-5 h-5" />
          <h2>Top Long Candidates (Value / Cheap Vol)</h2>
        </div>
        <div className="grid gap-4">
          {topLongs.map((row, idx) => (
            <StrategyCard key={`${row.Ticker}-long-${idx}`} row={row} type="long" />
          ))}
        </div>
      </div>

      {/* COLUMNA BEARISH */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-red-400 font-bold text-lg mb-2">
          <TrendingDown className="w-5 h-5" />
          <h2>Top Short Candidates (Overextended / Expensive Vol)</h2>
        </div>
        <div className="grid gap-4">
          {topShorts.map((row, idx) => (
            <StrategyCard key={`${row.Ticker}-short-${idx}`} row={row} type="short" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Playbook;