import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Screener from './components/Screener';
import Playbook from './components/Playbook';
import SingleAsset from './components/SingleAsset';
import Glossary from './components/Glossary';
// IMPORTAMOS EL NUEVO DASHBOARD
import Dashboard from './components/Dashboard';

const App = () => {
  // 'dashboard' será ahora la pestaña por defecto
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [scanResults, setScanResults] = useState([]);

  // --- NUEVO: ESTADO DE LA WATCHLIST (CON PERSISTENCIA) ---
  const [watchlist, setWatchlist] = useState(() => {
    // Al iniciar, intentamos leer de localStorage
    const saved = localStorage.getItem('quantdeskWatchlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Guardamos en localStorage cada vez que cambia la watchlist
  useEffect(() => {
    localStorage.setItem('quantdeskWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Función para añadir/quitar favoritos (la pasaremos a los hijos)
  const toggleWatchlist = (ticker) => {
    setWatchlist((prev) => {
      if (prev.includes(ticker)) {
        return prev.filter(t => t !== ticker); // Quitar
      } else {
        return [...prev, ticker]; // Añadir
      }
    });
  };
  // -------------------------------------------------------

  const handleScanComplete = (data) => {
    setScanResults(data);
  };

  const handleSelectTicker = (ticker) => {
    setSelectedTicker(ticker);
    setActiveTab('analysis');
  };

  return (
    <div className="flex min-h-screen bg-[#0e1117] text-gray-100 font-sans">
      {/* Pasamos la navegación al Sidebar también si quieres que el icono funcione */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden"> 
        <Navbar onNavigate={setActiveTab} />
        
        <main className="p-6 flex-1 overflow-y-auto bg-[#0e1117]">
          
          {/* --- NUEVA PESTAÑA DASHBOARD --- */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              watchlist={watchlist}
              onSelectTicker={handleSelectTicker}
            />
          )}

          {activeTab === 'screener' && (
            <Screener 
              onSelectTicker={handleSelectTicker} 
              onScanComplete={handleScanComplete}
              initialResults={scanResults}
              // PASAMOS LAS PROPS DE LA WATCHLIST
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
            />
          )}

          {activeTab === 'playbook' && (
            <div className="space-y-6 animate-in fade-in">
              <header>
                <h1 className="text-3xl font-bold text-white mb-2">Estrategias Automáticas</h1>
                <p className="text-gray-400">Oportunidades generadas por el último escaneo.</p>
              </header>
              <Playbook data={scanResults} />
            </div>
          )}

          {activeTab === 'analysis' && (
             <SingleAsset 
                ticker={selectedTicker} 
                // PASAMOS LAS PROPS DE LA WATCHLIST
                watchlist={watchlist}
                onToggleWatchlist={toggleWatchlist}
             />
          )}

          {activeTab === 'glossary' && <Glossary />}
          
        </main>
      </div>
    </div>
  );
};

export default App;