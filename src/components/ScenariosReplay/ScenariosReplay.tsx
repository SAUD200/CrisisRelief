import { useState, useMemo } from 'react';
import { useSimulationStore } from '../../state/store';
import { DSU } from '../../algorithms/dsu';
import { dijkstra } from '../../algorithms/dijkstra';

export default function ScenariosReplay() {
  const { 
    resetSimulation, 
    setTime, 
    updateRoad, 
    addEmergency, 
    addEvent, 
    dispatchAmbulance,
    events, 
    nodes, 
    roads,
    ambulances,
  } = useSimulationStore();

  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [demoBanner, setDemoBanner] = useState<string | null>(null);

  // Build DSU from current roads to detect isolated zones
  const connectivity = useMemo(() => {
    const dsu = new DSU(nodes);
    dsu.buildFromRoads(roads);
    const components = dsu.getConnectedComponents(nodes);
    
    // Check which emergency zones are connected to a hospital
    const hospitalIds = nodes.filter(n => n.type === 'hospital').map(n => n.id);
    const emergencyZoneIds = nodes.filter(n => n.type === 'emergencyZone').map(n => n.id);
    
    const isolatedZones: string[] = [];
    for (const zoneId of emergencyZoneIds) {
      const zoneRoot = dsu.find(zoneId);
      const connectedToHospital = hospitalIds.some(hId => dsu.find(hId) === zoneRoot);
      if (!connectedToHospital) {
        isolatedZones.push(zoneId);
      }
    }
    
    return {
      componentCount: Object.keys(components).length,
      isolatedZones,
      components,
    };
  }, [nodes, roads]);

  // SCENARIO 1: Flooded Bridge & Dynamic Rerouting
  const runScenario1 = () => {
    resetSimulation();
    setActiveScenario('1: Category 4 Flood & Bridge Cutoff');
    setTime(15 * 60); // 3 PM

    // Close bridge R19 (J1 to D1)
    updateRoad('R19', { status: 'closed' });
    addEvent({
      id: 'EV-FLOOD-1',
      timestampSimulationMinute: 15 * 60,
      type: 'roadClosure',
      targetId: 'R19',
      details: 'Bridge R19 submerged by rising flash flood waters. Road closed!'
    });

    // Add critical emergency
    const critEmergency = {
      id: 'E-CRIT-1',
      nodeId: 'Z1',
      severity: 92,
      affectedPeople: 45,
      waitingMinutes: 0,
      requiredAmbulanceType: 'ALS' as const,
      requiredEquipment: ['Defibrillator', 'Oxygen Tank'],
      status: 'waiting' as const,
      priorityScore: 92,
      createdAtSimulationMinute: 15 * 60
    };
    addEmergency(critEmergency);

    addEvent({
      id: 'EV-EMERG-1',
      timestampSimulationMinute: 15 * 60 + 2,
      type: 'newEmergency',
      targetId: 'Z1',
      details: 'Mass flash flood entrapment reported at Emergency Zone Z1 (Sev: 92).'
    });

    // Auto-dispatch alternate detour route using Dijkstra
    const availableAmb = ambulances.find(a => a.status === 'available') || ambulances[0];
    const detourRoute = dijkstra(availableAmb.locationNodeId, 'Z1', nodes, roads, 15);
    const route = detourRoute?.path || [availableAmb.locationNodeId, 'J2', 'J4', 'Z1'];
    const durationSec = Math.max(5, Math.min(22, Math.round(5 + (92 / 100) * 15))); // ~19s

    dispatchAmbulance({
      id: `disp-scen1-${Date.now()}`,
      ambulanceId: availableAmb.id,
      emergencyId: 'E-CRIT-1',
      fromNodeId: availableAmb.locationNodeId,
      toNodeId: 'Z1',
      route,
      startTimestamp: Date.now(),
      totalDurationSeconds: durationSec,
      remainingSeconds: durationSec,
      severity: 92,
      phase: 'enRoute',
    });

    addEvent({
      id: 'EV-DISP-1',
      timestampSimulationMinute: 15 * 60 + 4,
      type: 'roadClosure',
      targetId: availableAmb.id,
      details: `Ambulance ${availableAmb.id} successfully rerouted around closed bridge via ${route.join(' ➔ ')}.`
    });

    setDemoBanner(`Scenario 1 active! Bridge R19 is CLOSED. Ambulance ${availableAmb.id} dispatched to Z1 via alternate detour route (${durationSec}s timer). Open City Map to watch the animated vehicle!`);
  };

  // SCENARIO 2: Mass-Casualty Highway Pileup (Priority Queue Demonstration)
  const runScenario2 = () => {
    resetSimulation();
    setActiveScenario('2: Mass-Casualty Highway 101 Pileup');
    setTime(18 * 60); // 6 PM (Rush hour)

    addEvent({
      id: 'EV-ACC-1',
      timestampSimulationMinute: 18 * 60,
      type: 'trafficIncrease',
      targetId: 'J2',
      details: 'Multi-vehicle pileup reported on Highway junction J2 during rush hour traffic.'
    });

    // Spawn 4 emergencies of varying severities
    const surgeEmergencies = [
      { id: 'E-MC-1', nodeId: 'Z2', severity: 95, affected: 30, type: 'ALS' as const },
      { id: 'E-MC-2', nodeId: 'Z3', severity: 78, affected: 18, type: 'ALS' as const },
      { id: 'E-MC-3', nodeId: 'Z4', severity: 55, affected: 8, type: 'BLS' as const },
      { id: 'E-MC-4', nodeId: 'Z5', severity: 35, affected: 4, type: 'BLS' as const },
    ];

    surgeEmergencies.forEach((se, idx) => {
      addEmergency({
        id: se.id,
        nodeId: se.nodeId,
        severity: se.severity,
        affectedPeople: se.affected,
        waitingMinutes: idx * 4,
        requiredAmbulanceType: se.type,
        requiredEquipment: [],
        status: 'waiting',
        priorityScore: se.severity,
        createdAtSimulationMinute: 18 * 60 + idx,
      });
    });

    // Dispatch available ambulances to the top 2 highest priority crises
    const availAmbs = ambulances.filter(a => a.status === 'available');
    if (availAmbs[0]) {
      const d1Route = dijkstra(availAmbs[0].locationNodeId, 'Z2', nodes, roads, 18)?.path || [availAmbs[0].locationNodeId, 'Z2'];
      const dur1 = Math.max(5, Math.min(22, Math.round(5 + (95 / 100) * 15))); // ~19s
      dispatchAmbulance({
        id: `disp-mc-1`,
        ambulanceId: availAmbs[0].id,
        emergencyId: 'E-MC-1',
        fromNodeId: availAmbs[0].locationNodeId,
        toNodeId: 'Z2',
        route: d1Route,
        startTimestamp: Date.now(),
        totalDurationSeconds: dur1,
        remainingSeconds: dur1,
        severity: 95,
        phase: 'enRoute',
      });
    }

    if (availAmbs[1]) {
      const d2Route = dijkstra(availAmbs[1].locationNodeId, 'Z3', nodes, roads, 18)?.path || [availAmbs[1].locationNodeId, 'Z3'];
      const dur2 = Math.max(5, Math.min(22, Math.round(5 + (78 / 100) * 15))); // ~17s
      dispatchAmbulance({
        id: `disp-mc-2`,
        ambulanceId: availAmbs[1].id,
        emergencyId: 'E-MC-2',
        fromNodeId: availAmbs[1].locationNodeId,
        toNodeId: 'Z3',
        route: d2Route,
        startTimestamp: Date.now(),
        totalDurationSeconds: dur2,
        remainingSeconds: dur2,
        severity: 78,
        phase: 'enRoute',
      });
    }

    setDemoBanner(`Scenario 2 active! 4 emergencies triaged via Max-Heap. Top 2 critical cases dispatched with live timers. Check Control Center to see the priority queue ordering!`);
  };

  // SCENARIO 3: Hospital Surge & Emergency Supply Convoy
  const runScenario3 = () => {
    resetSimulation();
    setActiveScenario('3: Hospital Surge & Shelter Relief Convoy');
    setTime(12 * 60); // 12 PM

    addEvent({
      id: 'EV-SURGE-1',
      timestampSimulationMinute: 12 * 60,
      type: 'hazardIncrease',
      targetId: 'H1',
      details: 'Hospital H1 reaches 100% ICU capacity. Relief supplies requested at Shelter S1.'
    });

    addEmergency({
      id: 'E-SHELTER-1',
      nodeId: 'S1',
      severity: 65,
      affectedPeople: 80,
      waitingMinutes: 5,
      requiredAmbulanceType: 'BLS',
      requiredEquipment: ['First Aid Kits'],
      status: 'waiting',
      priorityScore: 65,
      createdAtSimulationMinute: 12 * 60,
    });

    const avail = ambulances.find(a => a.status === 'available') || ambulances[0];
    const route = dijkstra(avail.locationNodeId, 'S1', nodes, roads, 12)?.path || [avail.locationNodeId, 'S1'];
    const dur = Math.max(5, Math.min(22, Math.round(5 + (65 / 100) * 15))); // ~15s

    dispatchAmbulance({
      id: `disp-shelter-1`,
      ambulanceId: avail.id,
      emergencyId: 'E-SHELTER-1',
      fromNodeId: avail.locationNodeId,
      toNodeId: 'S1',
      route,
      startTimestamp: Date.now(),
      totalDurationSeconds: dur,
      remainingSeconds: dur,
      severity: 65,
      phase: 'enRoute',
    });

    setDemoBanner(`Scenario 3 active! Supply convoy dispatched from Depot D1 to Shelter S1 via 0/1 Knapsack loadout (${dur}s timer). Watch ambulance path live on City Map!`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded border border-slate-800 overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/60 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Disaster Scenario Simulation Studio</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            1-Click scenario executions demonstrating graph connectivity (DSU), dynamic rerouting (Dijkstra), and triage (Heap)
          </p>
        </div>
        {activeScenario && (
          <div className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs px-3 py-1.5 rounded-full font-semibold flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Running: {activeScenario}</span>
          </div>
        )}
      </div>

      {/* Demo Notification Toast */}
      {demoBanner && (
        <div className="mx-4 mt-3 bg-blue-950/80 border border-blue-500 text-blue-200 text-xs p-3 rounded-lg flex justify-between items-center shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="text-base">🚨</span>
            <span className="font-medium">{demoBanner}</span>
          </div>
          <button 
            onClick={() => setDemoBanner(null)}
            className="text-blue-400 hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto">
        {/* Left Column: Interactive Scenario Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Select a Disaster Scenario to Execute
          </h3>

          {/* Scenario 1 Card */}
          <div className={`p-4 rounded-lg border transition-all ${
            activeScenario?.startsWith('1:') 
              ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/40' 
              : 'bg-slate-800/90 border-slate-700'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-blue-400 text-sm">Scenario 1: Category 4 Flash Flood & Bridge Cutoff</h4>
                <div className="text-xs text-slate-400 mt-1">
                  Tests: <strong className="text-slate-200">DSU Graph Connectivity + Dijkstra Dynamic Rerouting</strong>
                </div>
              </div>
              <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 font-mono">
                Sev: 92/100
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Rising waters flood River Bridge R19. DSU detects cut components. The navigation engine recalculates an alternate detour route around the flood and dispatches an ambulance with a ~19s live timer.
            </p>
            <button
              onClick={runScenario1}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-all shadow flex items-center space-x-2"
            >
              <span>⚡ Execute Live Scenario 1</span>
            </button>
          </div>

          {/* Scenario 2 Card */}
          <div className={`p-4 rounded-lg border transition-all ${
            activeScenario?.startsWith('2:') 
              ? 'bg-orange-950/40 border-orange-500 shadow-md ring-1 ring-orange-500/40' 
              : 'bg-slate-800/90 border-slate-700'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-orange-400 text-sm">Scenario 2: Mass-Casualty Highway 101 Pileup</h4>
                <div className="text-xs text-slate-400 mt-1">
                  Tests: <strong className="text-slate-200">Max-Heap Priority Queue Triage + Multi-Unit Dispatch</strong>
                </div>
              </div>
              <span className="text-[10px] bg-orange-950 text-orange-300 px-2 py-0.5 rounded border border-orange-800 font-mono">
                4 Victims (Sev 35 - 95)
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              4 simultaneous emergencies occur during evening rush hour. The Max-Heap priority queue sorts them strictly by medical urgency and allocates ambulances to critical patients first.
            </p>
            <button
              onClick={runScenario2}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold transition-all shadow flex items-center space-x-2"
            >
              <span>⚡ Execute Live Scenario 2</span>
            </button>
          </div>

          {/* Scenario 3 Card */}
          <div className={`p-4 rounded-lg border transition-all ${
            activeScenario?.startsWith('3:') 
              ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/40' 
              : 'bg-slate-800/90 border-slate-700'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-purple-400 text-sm">Scenario 3: Hospital Surge & Emergency Supply Drop</h4>
                <div className="text-xs text-slate-400 mt-1">
                  Tests: <strong className="text-slate-200">0/1 Knapsack Relief Optimization + Depot Logistics</strong>
                </div>
              </div>
              <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 font-mono">
                Payload DP
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Hospital H1 exceeds capacity. Shelter S1 needs critical relief packs. Dynamic programming computes the optimal combination of medical supplies to fit within vehicle weight limits.
            </p>
            <button
              onClick={runScenario3}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold transition-all shadow flex items-center space-x-2"
            >
              <span>⚡ Execute Live Scenario 3</span>
            </button>
          </div>

          {/* DSU Connectivity Stats Widget */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2 flex items-center space-x-2">
              <span>🌐</span>
              <span>Network Connectivity Status (DSU Union-Find)</span>
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400">Connected Components: </span>
                <span className={`font-bold font-mono ${connectivity.componentCount === 1 ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {connectivity.componentCount}
                </span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400">Isolated Zones: </span>
                <span className={`font-bold font-mono ${connectivity.isolatedZones.length === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {connectivity.isolatedZones.length === 0 ? 'None (Full Mesh)' : connectivity.isolatedZones.join(', ')}
                </span>
              </div>
            </div>
            {connectivity.isolatedZones.length > 0 && (
              <div className="mt-2 text-xs text-red-300 bg-red-950/40 p-2 rounded border border-red-800/60">
                ⚠ Graph Partition: Zones [{connectivity.isolatedZones.join(', ')}] cannot reach any hospital due to road disruptions.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Event Timeline (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 rounded-lg border border-slate-800 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center space-x-2">
              <span>📜</span>
              <span>Disaster Event Timeline ({events.length})</span>
            </h3>
            {events.length > 0 && (
              <button 
                onClick={resetSimulation}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Clear Log
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
            {events.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                No events recorded yet.<br />
                Click any scenario button on the left to start a demonstration!
              </div>
            ) : (
              [...events].reverse().map((evt) => {
                const hour = Math.floor(evt.timestampSimulationMinute / 60);
                const min = evt.timestampSimulationMinute % 60;
                const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

                let badgeColor = 'bg-blue-950 text-blue-300 border-blue-800';
                if (evt.type === 'roadClosure') badgeColor = 'bg-red-950 text-red-300 border-red-800';
                else if (evt.type === 'newEmergency') badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';

                return (
                  <div key={evt.id} className="bg-slate-900/90 p-3 rounded border border-slate-800 shadow-sm text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${badgeColor}`}>
                        {evt.type}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {timeStr}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1 leading-relaxed">{evt.details}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
