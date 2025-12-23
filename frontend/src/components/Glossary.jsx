import React from 'react';
import { BookOpen } from 'lucide-react';

const Glossary = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in zoom-in duration-500">
      <div className="bg-[#1b2030] p-6 rounded-full">
        <BookOpen className="w-12 h-12 text-primary opacity-80" />
      </div>
      <h2 className="text-2xl font-bold text-white">Glosario de Conceptos</h2>
      <p className="text-gray-400 max-w-md">
        Aquí encontrarás explicaciones detalladas sobre VRP, Gamma Exposure y los distintos tipos de Muros.
      </p>
      <div className="px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg text-sm font-bold">
        🚧 Sección en Construcción
      </div>
    </div>
  );
};

export default Glossary;