import React from 'react';
import { LayoutGrid, Home } from 'lucide-react'; // Importamos icono Home

const Navbar = ({ onNavigate }) => {
  return (
    <nav className="h-16 border-b border-white/5 bg-[#0e1117] flex items-center justify-between px-6 sticky top-0 z-20">
      
      {/* LOGO REDIRIGE AL DASHBOARD AHORA */}
      <div 
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onNavigate && onNavigate('dashboard')}
        title="Ir al Dashboard"
      >
        <div className="p-2 bg-primary/10 rounded-xl">
          <LayoutGrid className="w-6 h-6 text-primary" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          Quant<span className="text-primary">Desk</span>
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* NUEVO ENLACE AL DASHBOARD */}
        <button 
            onClick={() => onNavigate('dashboard')}
            className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold"
        >
            <Home className="w-4 h-4" /> Dashboard
        </button>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-bold text-white">Admin User</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Pro License</span>
        </div>
        <div className="w-9 h-9 bg-gradient-to-br from-primary to-purple-600 rounded-full border-2 border-[#0e1117] shadow-lg"></div>
      </div>
    </nav>
  );
};
export default Navbar;