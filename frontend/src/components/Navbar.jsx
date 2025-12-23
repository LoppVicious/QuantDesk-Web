import React from 'react';
import { Bell, Settings, User } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="h-16 bg-[#131722] border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Lado Izquierdo (Breadcrumbs o Título) */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-sm font-medium text-gray-400">Sistema Conectado</span>
      </div>

      {/* Lado Derecho (Iconos) */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold text-xs">
          QP
        </div>
      </div>
    </header>
  );
};

export default Navbar;