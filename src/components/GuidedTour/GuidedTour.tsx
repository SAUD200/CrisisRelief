import { useState } from 'react';

const steps = [
  {
    target: "Control Center",
    text: "This panel manages incoming emergencies and prioritizes them dynamically using a Max-Heap Priority Queue based on severity and waiting time."
  },
  {
    target: "Live City Map",
    text: "The graph representation of the city. We use A* and Dijkstra algorithms to find the safest routes avoiding closures and heavy traffic."
  },
  {
    target: "Algorithm Race Mode",
    text: "Toggle this to visibly pit Dijkstra against A* on the same route to see how the A* heuristic explores fewer nodes to find the same optimal path."
  },
  {
    target: "Resource Allocation",
    text: "Matches the best ambulance to a critical zone and uses the 0/1 Knapsack dynamic programming algorithm to pack relief supplies efficiently."
  },
  {
    target: "Algorithms Lab",
    text: "An interactive breakdown of the core data structures used, like visualizing the Segment Tree for road hazards or comparing Hash Map vs Linear Scan lookups."
  },
  {
    target: "Scenarios & Replay",
    text: "Use this to load deterministic disaster events (e.g. a flooded bridge) to see how the system dynamically reroutes traffic using DSU connectivity and safe-route recomputation."
  }
];

export default function GuidedTour({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-lg max-w-lg w-full p-6 relative">
        <div className="text-xs font-bold text-blue-400 tracking-wider uppercase mb-2">
          Guided Tour • Step {currentStep + 1} of {steps.length}
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-3">{steps[currentStep].target}</h2>
        <p className="text-slate-300 mb-8 leading-relaxed">
          {steps[currentStep].text}
        </p>

        <div className="flex justify-between items-center border-t border-slate-800 pt-4">
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-medium"
          >
            Skip Tour
          </button>
          
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm font-medium transition-colors"
              >
                Previous
              </button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <button 
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors shadow-lg shadow-blue-900/50"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors shadow-lg shadow-green-900/50"
              >
                Finish Tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
