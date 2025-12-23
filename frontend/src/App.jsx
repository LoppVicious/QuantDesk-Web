import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Screener from './components/Screener';
import Playbook from './components/Playbook';
import SingleAsset from './components/SingleAsset';

const App = () => {
  const [activeTab, setActiveTab] = useState('screener');
  const [selectedTicker, setSelectedTicker] = useState(null);
  
  // ESTADO COMPARTIDO: Aquí persisten los resultados
  const [scanResults, setScanResults] = useState([]);

  const handleScanComplete = (data) => {
    console.log("App: Recibidos datos del escáner:", data.length);
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
        {/* CAMBIO: Pasamos setActiveTab al Navbar */}
        <Navbar onNavigate={setActiveTab} />
        
        <main className="p-6 flex-1 overflow-y-auto">
          {/* ... (resto del contenido main igual que en mi respuesta anterior) ... */}
          {activeTab === 'screener' && (
            <Screener 
              onSelectTicker={handleSelectTicker} 
              onScanComplete={handleScanComplete}
              initialResults={scanResults} 
            />
          )}

          {activeTab === 'glossary' && <Glossary />} {/* Asegúrate de importar Glossary arriba si falla */}
          
        </main>
      </div>
    </div>
  );
};

export default App;