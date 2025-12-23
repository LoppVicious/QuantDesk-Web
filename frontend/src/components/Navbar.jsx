import React from 'react';
import { LayoutGrid } from 'lucide-react';

const Navbar = ({ onNavigate }) => {
  return (
    <nav className="h-16 border-b border-white/5 bg-[#0e1117] flex items-center justify-between px-6 sticky top-0 z-20">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onNavigate && onNavigate('screener')}
      >
        <div className="bg-primary/20 p-2 rounded-lg">
           <LayoutGrid className="w-5 h-5 text-primary" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          Quant<span className="text-primary">Desk</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-bold text-white">Usuario Pro</span>
        </div>
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full border border-white/10"></div>
      </div>
    </nav>
  );
};
export default Navbar;