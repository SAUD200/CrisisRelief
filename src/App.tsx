import { useState } from 'react';
import { useSimulationStore } from './state/store';
import ControlCenter from './components/ControlCenter/ControlCenter';
import CityMap from './components/CityMap/CityMap';
import ResourceAllocation from './components/ResourceAllocation/ResourceAllocation';
import AlgorithmsLab from './components/AlgorithmsLab/AlgorithmsLab';
import ComplexityDashboard from './components/ComplexityDashboard/ComplexityDashboard';
import ScenariosReplay from './components/ScenariosReplay/ScenariosReplay';
import GuidedTour from './components/GuidedTour/GuidedTour';
import { useDispatchManager } from './hooks/useDispatchManager';

function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [showTour, setShowTour] = useState(false);
  const dispatchesCount = useSimulationStore((s) => s.dispatches.length);
  const isRunning = useSimulationStore((s) => s.isRunning);

  // Mount global dispatch timer and auto-dispatch engine
  useDispatchManager();

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      {/* Header Navigation */}
      <header className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-red-500 tracking-tight">CrisisRelief</h1>
            {isRunning && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <button 
            onClick={() => setShowTour(true)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded"
          >
            Take Tour
          </button>
        </div>
        <nav className="flex space-x-2 overflow-x-auto pb-1 md:pb-0">
          {['map', 'control', 'resources', 'algorithms', 'scenarios', 'complexity'].map((tab) => {
            const hasDispatches = (tab === 'control' || tab === 'map') && dispatchesCount > 0;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-3 py-1.5 md:px-4 md:py-2 rounded text-sm md:text-base font-medium transition-colors flex items-center space-x-1.5 ${
                  activeTab === tab
                    ? 'bg-red-900/30 text-red-400 border border-red-800/50'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                {hasDispatches && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                    {dispatchesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-4 relative">
        {activeTab === 'map' && <CityMap />}
        {activeTab === 'control' && <ControlCenter />}
        {activeTab === 'resources' && <ResourceAllocation />}
        {activeTab === 'algorithms' && <AlgorithmsLab />}
        {activeTab === 'scenarios' && <ScenariosReplay />}
        {activeTab === 'complexity' && <ComplexityDashboard />}
      </main>

      {/* Tour Overlay */}
      {showTour && <GuidedTour onClose={() => setShowTour(false)} />}
    </div>
  );
}

export default App;
