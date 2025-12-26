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
    </nav>
  );
};
export default Navbar;