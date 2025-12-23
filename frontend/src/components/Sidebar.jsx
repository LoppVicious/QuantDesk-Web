import React from 'react';
import { LayoutDashboard, BookOpen, BarChart2, HelpCircle } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  
  const menuItems = [
    { id: 'screener', label: 'Escáner de Mercado', icon: LayoutDashboard, desc: 'Busca oportunidades' },
    { id: 'playbook', label: 'Playbook', icon: BookOpen, desc: 'Estrategias Top' },
    { id: 'analysis', label: 'Análisis Individual', icon: BarChart2, desc: 'GEX, Muros y Volatilidad' },
    { id: 'glossary', label: 'Glosario / Ayuda', icon: HelpCircle, desc: 'Conceptos Clave' },
  ];

  return (
    <aside className="w-64 bg-[#0b0e14] border-r border-white/5 flex flex-col h-screen sticky top-0">
      {/* LOGO */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg mr-3 shadow-lg shadow-primary/20"></div>
        <h1 className="text-xl font-bold text-white tracking-tight">QuantDesk</h1>
      </div>

      {/* MENU */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-bold text-gray-600 uppercase tracking-wider">Plataforma</div>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group text-left ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 group-hover:bg-white/10'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className={`font-bold text-sm ${isActive ? 'text-white' : ''}`}>{item.label}</div>
                <div className="text-[10px] opacity-60 font-normal">{item.desc}</div>
              </div>
              {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(0,212,170,0.8)]"></div>}
            </button>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gray-700"></div>
          <div>
            <div className="text-xs font-bold text-white">Usuario Pro</div>
            <div className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Conectado
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;