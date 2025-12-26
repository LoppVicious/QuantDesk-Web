import React from 'react';
import { LayoutGrid, Search, BookOpen, BarChart2 } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid }, // PRIMERA POSICIÓN
    { id: 'screener', label: 'Scanner', icon: Search },
    { id: 'playbook', label: 'Playbook', icon: BookOpen },
    { id: 'analysis', label: 'Analysis', icon: BarChart2 },
    // { id: 'glossary', label: 'Glosario', icon: FileText } // Opcional si quieres enlace directo
  ];

  return (
    <div className="w-20 lg:w-64 bg-[#0b0e14] border-r border-white/5 flex flex-col h-screen transition-all duration-300">
      
      {/* LOGO */}
      <div className="h-16 flex items-center justify-center lg:justify-start px-6 border-b border-white/5">
        <div className="p-2 bg-primary/10 rounded-xl mr-3">
          <LayoutGrid className="w-6 h-6 text-primary" />
        </div>
        <span className="hidden lg:block text-xl font-bold tracking-tight text-white">
          Quant<span className="text-primary">Desk</span>
        </span>
      </div>

      {/* MENÚ */}
      <nav className="flex-1 py-6 space-y-2 px-3">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary text-black shadow-[0_0_15px_rgba(0,212,170,0.3)] font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
              <span className="hidden lg:block">{item.label}</span>
              
              {isActive && (
                <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-black/50" />
              )}
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-white/5">
        <div className="bg-gradient-to-br from-[#131722] to-black p-4 rounded-xl border border-white/5 hidden lg:block">
          <p className="text-xs text-gray-500 mb-2">Estado del Sistema</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-green-400">Conectado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;