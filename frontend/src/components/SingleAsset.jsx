import React, { useEffect, useState } from 'react';
import { getAssetDetails } from '../services/api'; // Asegúrate de que esta función exista
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, AlertCircle, ArrowLeft } from 'lucide-react';

const SingleAsset = ({ ticker }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Frontend: Solicitando activo", ticker);
        const result = await getAssetDetails(ticker);
        console.log("Frontend: Datos recibidos", result);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error cargando datos. Revisa la consola.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  if (!ticker) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
        <Activity className="w-16 h-16 mb-4 opacity-20" />
        <p>Selecciona un ticker desde el Escáner para ver su análisis.</p>
      </div>
    );
  }

  if (loading) return <div className="text-primary p-10 animate-pulse">Cargando análisis de {ticker}...</div>;
  if (error) return <div className="text-red-400 p-10 flex items-center gap-2"><AlertCircle /> {error}</div>;
  
  // Si no hay historial, mostramos aviso pero no rompemos
  if (!data || !data.history || data.history.length === 0) {
    return <div className="p-10 text-yellow-500">Recibidos datos parciales, pero falta el historial de precios.</div>;
  }

  // Preparamos datos para el gráfico
  const chartData = data.history.map(item => ({
    date: item.date, // Backend envía 'date'
    price: item.close, // Backend envía 'close'
    sma20: item.sma20,
    sma50: item.sma50
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {data.ticker}
            <span className="text-2xl font-normal text-primary">${data.price.toFixed(2)}</span>
          </h1>
        </div>
      </header>

      {/* GRÁFICO DE PRECIOS */}
      <div className="bg-[#131722] p-4 rounded-xl border border-white/5 shadow-lg h-[400px]">
        <h3 className="text-gray-400 text-sm font-bold mb-4 uppercase">Estructura de Precio (6 Meses)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" hide />
            <YAxis domain={['auto', 'auto']} stroke="#ffffff50" fontSize={12} tickFormatter={(val) => `$${val.toFixed(0)}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f111a', borderColor: '#333' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#888' }}
            />
            <Line type="monotone" dataKey="price" stroke="#00D4AA" strokeWidth={2} dot={false} name="Precio" />
            <Line type="monotone" dataKey="sma20" stroke="#fbbf24" strokeWidth={1} dot={false} strokeDasharray="5 5" name="SMA 20" />
            <Line type="monotone" dataKey="sma50" stroke="#60a5fa" strokeWidth={1} dot={false} strokeDasharray="10 10" name="SMA 50" />
            
            {/* LÍNEAS DE MUROS */}
            {data.call_wall > 0 && (
               <ReferenceLine y={data.call_wall} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Call Wall', fill: '#3b82f6', fontSize: 10 }} />
            )}
            {data.put_wall > 0 && (
               <ReferenceLine y={data.put_wall} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Put Wall', fill: '#ef4444', fontSize: 10 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1b2030] p-4 rounded-lg border border-white/5">
           <div className="text-gray-500 text-xs uppercase font-bold">Call Wall</div>
           <div className="text-blue-400 text-xl font-mono">${data.call_wall}</div>
        </div>
        <div className="bg-[#1b2030] p-4 rounded-lg border border-white/5">
           <div className="text-gray-500 text-xs uppercase font-bold">Put Wall</div>
           <div className="text-red-400 text-xl font-mono">${data.put_wall}</div>
        </div>
        <div className="bg-[#1b2030] p-4 rounded-lg border border-white/5">
           <div className="text-gray-500 text-xs uppercase font-bold">Gamma Flip</div>
           <div className="text-yellow-400 text-xl font-mono">${data.gamma_flip.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default SingleAsset;