import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Screener from './components/Screener';
import Playbook from './components/Playbook';
import SingleAsset from './components/SingleAsset';
import Glossary from './components/Glossary';

const App = () => {
  const [activeTab, setActiveTab] = useState('screener');
  const [selectedTicker, setSelectedTicker] = useState(null);
  
  // ESTADO PERSISTENTE: Aquí se guardan los resultados aunque cambies de pestaña
  const [scanResults, setScanResults] = useState([]);

  const handleScanComplete = (data) => {
    console.log("App: Datos recibidos", data.length);
    setScanResults(data);
  };

  const handleSelectTicker = (ticker) => {
    setSelectedTicker(ticker);
    setActiveTab('analysis');
  };

  return (
    <div className="flex min-h-screen bg-[#0e1117] text-gray-100 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden"> 
        {/* Pasamos la función para poder volver al inicio desde el logo */}
        <Navbar onNavigate={setActiveTab} />
        
        <main className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'screener' && (
            <Screener 
              onSelectTicker={handleSelectTicker} 
              onScanComplete={handleScanComplete}
              initialResults={scanResults} // <--- CLAVE: Pasamos los datos guardados
            />
          )}

          {activeTab === 'playbook' && (
            <div className="space-y-6">
              <header>
                <h1 className="text-3xl font-bold text-white mb-2">Estrategias Automáticas</h1>
                <p className="text-gray-400">Oportunidades generadas por el último escaneo.</p>
              </header>
              <Playbook data={scanResults} />
            </div>
          )}

          {activeTab === 'analysis' && (
             <SingleAsset ticker={selectedTicker} />
          )}

          {activeTab === 'glossary' && <Glossary />}
          
        </main>
      </div>
    </div>
  );
};

export default App;