import React from 'react';
import TickerTape from './TickerTape';

const Navbar = () => {
  return (
    <nav className="h-16 border-b border-white/5 bg-[#0e1117] flex items-center justify-between px-4 sticky top-0 z-20 overflow-hidden">
      
      {/* ZONA CENTRAL: CINTA DE COTIZACIONES */}
      {/* Usamos flex-1 para que ocupe todo el espacio disponible menos el del perfil */}
      <div className="flex-1 h-full flex items-center overflow-hidden mr-4 mask-fade-sides">
         <TickerTape />
      </div>

      {/* ZONA DERECHA: PERFIL DE USUARIO */}
      <div className="flex items-center gap-4 flex-shrink-0 bg-[#0e1117] pl-4 border-l border-white/5 z-10 h-10">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-bold text-white">Admin User</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Pro License</span>
        </div>
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full border border-white/10 shadow-lg"></div>
      </div>
    </nav>
  );
};
export default Navbar;