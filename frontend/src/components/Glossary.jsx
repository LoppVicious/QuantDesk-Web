import React from 'react';
import { BookOpen, Activity, TrendingUp, BarChart2 } from 'lucide-react';

const Glossary = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="text-center py-10 space-y-4">
        <div className="inline-flex p-4 bg-[#1b2030] rounded-full mb-4 border border-white/5">
           <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-white">Glosario Financiero</h1>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-[#131722] p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-primary w-5 h-5"/>
            <h3 className="text-xl font-bold text-white">VRP</h3>
          </div>
          <p className="text-gray-400 text-sm">Diferencia entre Volatilidad Implícita y Realizada.</p>
        </div>
        <div className="bg-[#131722] p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-blue-400 w-5 h-5"/>
            <h3 className="text-xl font-bold text-white">GEX (Gamma Exposure)</h3>
          </div>
          <p className="text-gray-400 text-sm">Exposición total de los Market Makers.</p>
        </div>
      </div>
    </div>
  );
};
export default Glossary;