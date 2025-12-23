import React from 'react';
import { BookOpen, Activity, TrendingUp, BarChart2, Zap, Clock, Anchor } from 'lucide-react';

const GlossaryItem = ({ title, icon: Icon, color, children }) => (
  <div className="bg-[#131722] p-6 rounded-xl border border-white/5 hover:border-white/10 transition-all">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
    </div>
    <div className="text-gray-400 text-sm space-y-2 leading-relaxed">
      {children}
    </div>
  </div>
);

const Glossary = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold text-white">Glosario Financiero QuantDesk</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Conceptos avanzados utilizados por nuestros algoritmos para detectar oportunidades.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <GlossaryItem title="VRP (Risk Premium)" icon={Activity} color="text-green-400">
          <p>
            <strong>Volatility Risk Premium</strong>. Es la diferencia entre la Volatilidad Implícita (lo que el mercado espera) y la Realizada (lo que realmente ocurre).
          </p>
          <p className="text-xs mt-2 text-gray-500">Un VRP alto indica opciones caras (bueno para vender). Un VRP bajo indica opciones baratas.</p>
        </GlossaryItem>

        <GlossaryItem title="Gamma Exposure (GEX)" icon={TrendingUp} color="text-blue-400">
          <p>
            Mide cómo deben reaccionar los Market Makers ante cambios de precio.
          </p>
          <ul className="list-disc list-inside mt-2 text-xs text-gray-500">
            <li><strong>Positivo:</strong> Estabiliza el mercado (compran caídas).</li>
            <li><strong>Negativo:</strong> Acelera la volatilidad (venden caídas).</li>
          </ul>
        </GlossaryItem>

        <GlossaryItem title="Call & Put Walls" icon={BarChart2} color="text-yellow-400">
          <p>
            Niveles de precio con la mayor concentración de contratos abiertos (Open Interest).
          </p>
          <p className="text-xs mt-2 text-gray-500">Actúan como "imanes" o barreras de soporte y resistencia muy fuertes debido a la cobertura de los grandes actores.</p>
        </GlossaryItem>

        <GlossaryItem title="Implied Volatility (IV)" icon={Zap} color="text-purple-400">
          <p>
            La previsión del mercado sobre cuánto se moverá el precio en el futuro. No indica dirección, solo magnitud esperada.
          </p>
        </GlossaryItem>

        <GlossaryItem title="Theta Decay" icon={Clock} color="text-red-400">
          <p>
            La pérdida de valor de una opción por el simple paso del tiempo. Nuestras estrategias de venta (Iron Condor) se benefician de esto.
          </p>
        </GlossaryItem>

        <GlossaryItem title="Delta" icon={Anchor} color="text-orange-400">
          <p>
            La sensibilidad del precio de la opción respecto al movimiento de la acción. También se usa como una aproximación de la probabilidad de que la opción expire "In The Money".
          </p>
        </GlossaryItem>

      </div>
    </div>
  );
};

export default Glossary;