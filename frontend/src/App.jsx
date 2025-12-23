import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Screener from './components/Screener';
import Playbook from './components/Playbook';
import SingleAsset from './components/SingleAsset'; // Asegúrate de tener este componente

const App = () => {
  const [activeTab, setActiveTab] = useState('screener');
  const [selectedTicker, setSelectedTicker] = useState(null);
  
  // ESTADO COMPARTIDO: Aquí guardamos los resultados del escáner
  const [scanResults, setScanResults] = useState([]);

  // Función que llama el Screener cuando termina
  const handleScanComplete = (data) => {
    console.log("App: Recibidos datos del escáner:", data.length);
    setScanResults(data);
  };

  // Función para ir al análisis de un activo
  const handleSelectTicker = (ticker) => {
    setSelectedTicker(ticker);
    setActiveTab('analysis');
  };

  return (
    <div className="flex min-h-screen bg-[#0e1117] text-gray-100 font-sans">
      {/* Sidebar de navegación */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col">
        <Navbar />
        
        <main className="p-6 flex-1 overflow-y-auto">
          {/* VISTA ESCÁNER */}
          {activeTab === 'screener' && (
            <Screener 
              onSelectTicker={handleSelectTicker} 
              onScanComplete={handleScanComplete} // ¡Esta es la conexión clave!
            />
          )}

          {/* VISTA PLAYBOOK */}
          {activeTab === 'playbook' && (
            <div className="space-y-6">
              <header>
                <h1 className="text-3xl font-bold text-white mb-2">Estrategias Automáticas</h1>
                <p className="text-gray-400">Oportunidades generadas por el último escaneo.</p>
              </header>
              {/* Le pasamos los datos guardados */}
              <Playbook data={scanResults} />
            </div>
          )}

          {/* VISTA ANÁLISIS INDIVIDUAL */}
          {activeTab === 'analysis' && (
             <SingleAsset ticker={selectedTicker} />
          )}

          {/* VISTA GLOSARIO (Opcional) */}
          {activeTab === 'glossary' && <Glossary />}
          
        </main>
      </div>
    </div>
  );
};

export default App;