import { useState } from 'react';
import { useSimulationStore } from '../../state/store';
import { MaxHeap } from '../../algorithms/heap';
import { dijkstra } from '../../algorithms/dijkstra';
import type { Ambulance, Emergency } from '../../types';

export default function ControlCenter() {
  const { 
    timeHour, 
    timeMinute, 
    isRunning, 
    speedMultiplier,
    toggleSimulation, 
    advanceTime,
    resetSimulation,
    emergencies,
    ambulances,
    dispatches,
    dispatchLog,
    completeDispatch,
    dispatchAmbulance,
    addEmergency,
    addAmbulance,
    removeAmbulance,
    nodes,
    roads,
  } = useSimulationStore();

  // State for Add Crisis Modal
  const [isAddCrisisOpen, setIsAddCrisisOpen] = useState(false);
  const [crisisNodeId, setCrisisNodeId] = useState('Z1');
  const [crisisSeverity, setCrisisSeverity] = useState(80);
  const [crisisPeople, setCrisisPeople] = useState(10);
  const [crisisType, setCrisisType] = useState<'ALS' | 'BLS'>('ALS');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['Defibrillator']);

  // State for Add Ambulance Modal
  const [isAddAmbulanceOpen, setIsAddAmbulanceOpen] = useState(false);
  const [newAmbType, setNewAmbType] = useState<'ALS' | 'BLS'>('ALS');
  const [newAmbBase, setNewAmbBase] = useState('H1');

  // Success Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const formattedTime = `${String(timeHour).padStart(2, '0')}:${String(timeMinute % 60).padStart(2, '0')}`;

  // Compute Priority Queue using MaxHeap
  const pq = new MaxHeap<Emergency & { computedPriority: number }>();
  const emergenciesWithScores = emergencies.map(e => {
    const normalizedAffected = Math.min(e.affectedPeople * 5, 100);
    const normalizedWait = Math.min(e.waitingMinutes * 2, 100);
    const priorityScore = (0.45 * e.severity) + (0.25 * normalizedAffected) + (0.15 * normalizedWait);
    const computedPriority = Number(priorityScore.toFixed(2));
    return { ...e, computedPriority };
  });

  emergenciesWithScores.forEach(e => {
    if (e.status === 'waiting') {
      pq.insert(e, e.computedPriority);
    }
  });

  const waitingEmergencies: (Emergency & { computedPriority: number })[] = [];
  while (pq.size() > 0) {
    const next = pq.extractMax();
    if (next) waitingEmergencies.push(next.item);
  }

  const activeEmergencies = emergencies.filter(e => e.status !== 'resolved');
  const availableAmbulances = ambulances.filter(a => a.status === 'available');
  const resolvedCount = emergencies.filter(e => e.status === 'resolved').length;
  const totalEmergencies = emergencies.length;
  const resolutionPercent = totalEmergencies > 0 ? Math.round((resolvedCount / totalEmergencies) * 100) : 0;

  // Manual fast dispatch trigger
  const handleFastDispatch = (targetEmergency?: Emergency) => {
    const emergencyToDispatch = targetEmergency || waitingEmergencies[0];
    if (!emergencyToDispatch) return;

    const available = ambulances.filter(a => a.status === 'available');
    if (available.length === 0) {
      alert('All ambulances are currently busy on active dispatches!');
      return;
    }

    // Match ambulance
    const matchedAmb = available.find(a => 
      emergencyToDispatch.requiredAmbulanceType === 'ALS' ? a.type === 'ALS' : true
    ) || available[0];

    // Compute route via Dijkstra
    const routeRes = dijkstra(
      matchedAmb.locationNodeId,
      emergencyToDispatch.nodeId,
      nodes,
      roads,
      timeHour
    );

    const route = routeRes && routeRes.path.length > 0
      ? routeRes.path
      : [matchedAmb.locationNodeId, emergencyToDispatch.nodeId];

    // Timer strictly based on severity (5s to 20s)
    const durationSec = Math.max(5, Math.min(22, Math.round(5 + (emergencyToDispatch.severity / 100) * 15)));

    dispatchAmbulance({
      id: `disp-${Date.now()}-${matchedAmb.id}`,
      ambulanceId: matchedAmb.id,
      emergencyId: emergencyToDispatch.id,
      fromNodeId: matchedAmb.locationNodeId,
      toNodeId: emergencyToDispatch.nodeId,
      route,
      startTimestamp: Date.now(),
      totalDurationSeconds: durationSec,
      remainingSeconds: durationSec,
      severity: emergencyToDispatch.severity,
      phase: 'enRoute',
    });
  };

  // Handler: Add Custom Crisis
  const handleCreateCrisis = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `E-CUST-${Date.now().toString().slice(-4)}`;
    const newCrisis: Emergency = {
      id: newId,
      nodeId: crisisNodeId,
      severity: crisisSeverity,
      affectedPeople: crisisPeople,
      waitingMinutes: 0,
      requiredAmbulanceType: crisisType,
      requiredEquipment: selectedEquipment,
      status: 'waiting',
      priorityScore: 0,
      createdAtSimulationMinute: timeMinute,
    };

    addEmergency(newCrisis);
    setIsAddCrisisOpen(false);
    setToastMsg(`🚨 Created new Crisis ${newId} at ${crisisNodeId} (Severity: ${crisisSeverity}). Auto-triaged in Priority Queue!`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Handler: Add Ambulance to Fleet
  const handleAddNewAmbulance = () => {
    // Determine next ID
    const nextNum = ambulances.length + 1;
    const newId = `A${nextNum}`;
    const newAmbulance: Ambulance = {
      id: newId,
      locationNodeId: newAmbBase,
      status: 'available',
      type: newAmbType,
      equipment: newAmbType === 'ALS' ? ['Defibrillator', 'Oxygen', 'Ventilator'] : ['Oxygen', 'First Aid'],
      capacity: 2,
      fuelPercent: 100,
    };

    addAmbulance(newAmbulance);
    setIsAddAmbulanceOpen(false);
    setToastMsg(`🚑 Added new Ambulance ${newId} (${newAmbType}) stationed at ${newAmbBase}. Fleet size now ${ambulances.length + 1}!`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Handler: Remove Available Ambulance
  const handleRemoveLastAmbulance = () => {
    if (ambulances.length <= 1) {
      alert('Cannot remove the last ambulance. Fleet must have at least 1 unit.');
      return;
    }
    const avail = [...ambulances].reverse().find(a => a.status === 'available');
    if (!avail) {
      alert('All ambulances are currently busy. Only available ambulances can be removed from service.');
      return;
    }
    removeAmbulance(avail.id);
    setToastMsg(`Decommissioned unit ${avail.id}. Fleet size now ${ambulances.length - 1}.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded border border-slate-800 overflow-hidden relative">
      {/* Top Header Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/60 flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-100">Crisis Control Command</h2>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
              isRunning ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'
            }`}>
              {isRunning ? '● LIVE SIMULATION RUNNING' : '○ SIMULATION PAUSED'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Sim Clock: <span className="text-slate-200 font-mono font-semibold">{formattedTime}</span> | Speed: {speedMultiplier}x
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* New Crisis Button */}
          <button
            onClick={() => setIsAddCrisisOpen(true)}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-semibold transition-all shadow flex items-center space-x-1.5"
          >
            <span>+</span>
            <span>Report New Crisis</span>
          </button>

          <button 
            onClick={toggleSimulation}
            className={`px-4 py-1.5 rounded font-semibold text-sm shadow-md transition-all flex items-center space-x-1.5 ${
              isRunning 
                ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <span>{isRunning ? '⏸ Pause' : '▶ Start Simulation'}</span>
          </button>

          <button 
            onClick={() => handleFastDispatch()}
            disabled={waitingEmergencies.length === 0 || availableAmbulances.length === 0}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-all shadow"
            title="Immediately triage and dispatch the highest priority crisis"
          >
            ⚡ Dispatch Next Priority
          </button>

          <button 
            onClick={() => advanceTime(15)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-sm"
          >
            +15m
          </button>

          <button 
            onClick={resetSimulation}
            className="px-3 py-1.5 bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 border border-slate-700 rounded text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="mx-4 mt-3 bg-blue-950/90 border border-blue-500 text-blue-200 text-xs px-4 py-2.5 rounded-lg flex justify-between items-center shadow-xl animate-fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-blue-400 hover:text-white ml-3">✕</button>
        </div>
      )}

      {/* KPI Stats Grid with FLEET SIZE CONTROLLER */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/40 border-b border-slate-800/80">
        <div className="bg-slate-800/70 p-3 rounded border border-slate-700/80">
          <div className="flex justify-between items-start">
            <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Active Crises</div>
            <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-800">
              {waitingEmergencies.length} waiting
            </span>
          </div>
          <div className="text-2xl font-bold text-red-400 mt-1">{activeEmergencies.length}</div>
        </div>

        <div className="bg-slate-800/70 p-3 rounded border border-slate-700/80">
          <div className="flex justify-between items-start">
            <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Active Dispatches</div>
            {dispatches.length > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{dispatches.length}</div>
        </div>

        {/* FLEET MANAGEMENT CARD (Vary Number of Ambulances) */}
        <div className="bg-slate-800/70 p-3 rounded border border-slate-700/80 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Ambulance Fleet</div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">
              {availableAmbulances.length} Free / {ambulances.length} Total
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold text-emerald-400">{ambulances.length} <span className="text-xs font-normal text-slate-400">units</span></span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleRemoveLastAmbulance}
                title="Decommission an available ambulance"
                className="w-7 h-7 bg-slate-900 hover:bg-red-900/60 border border-slate-700 rounded text-slate-300 hover:text-red-300 font-bold text-sm flex items-center justify-center transition-colors"
              >
                -
              </button>
              <button
                onClick={() => setIsAddAmbulanceOpen(true)}
                title="Add a new ambulance to fleet"
                className="px-2 h-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center space-x-1 transition-all shadow"
              >
                <span>+ Add</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/70 p-3 rounded border border-slate-700/80">
          <div className="flex justify-between items-start">
            <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Resolved Crises</div>
            <span className="text-[10px] text-purple-400 font-mono font-bold">
              {resolutionPercent}%
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* Main Body: Two Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Column: Active Dispatches & Live Timers (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4 overflow-y-auto pr-1">
          {/* Active Dispatches Card */}
          <div className="bg-slate-800/90 rounded border border-slate-700 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3 border-b border-slate-700/80 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🚑</span>
                <h3 className="font-bold text-slate-200">Active Live Dispatches & Auto-Resolutions</h3>
              </div>
              <span className="text-xs font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                {dispatches.length} In Progress
              </span>
            </div>

            {dispatches.length === 0 ? (
              <div className="py-6 text-center bg-slate-900/50 rounded border border-dashed border-slate-700/80">
                <div className="text-slate-400 text-sm font-medium">No ambulances currently dispatched.</div>
                <div className="text-slate-500 text-xs mt-1">
                  Click <strong className="text-emerald-400">"Start Simulation"</strong> or <strong className="text-red-400">"+ Report New Crisis"</strong> to begin triage and dispatch.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {dispatches.map((d) => {
                  const elapsedSec = (Date.now() - d.startTimestamp) / 1000;
                  const percent = Math.min(100, Math.round((elapsedSec / d.totalDurationSeconds) * 100));
                  
                  let phaseLabel = 'En Route to Crisis';
                  let phaseColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
                  if (d.phase === 'atIncident') {
                    phaseLabel = '🩺 At Incident (Stabilizing Patients)';
                    phaseColor = 'text-amber-400 bg-amber-950/60 border-amber-800';
                  } else if (d.phase === 'returning') {
                    phaseLabel = '🏥 Returning to Base Hospital';
                    phaseColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
                  }

                  return (
                    <div key={d.id} className="bg-slate-900/90 rounded border border-slate-700/80 p-3 shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-100">{d.ambulanceId}</span>
                            <span className="text-xs text-slate-400">➔</span>
                            <span className="font-bold text-red-400">{d.emergencyId}</span>
                            <span className="text-xs text-slate-400">(@ {d.toNodeId})</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                            <span>Route: {d.route.join(' ➔ ')}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-1">
                          <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${phaseColor}`}>
                            {phaseLabel}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-300">
                            ⏳ {d.remainingSeconds}s remaining
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden my-2">
                        <div 
                          className="h-2.5 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>Severity: <strong className={d.severity > 70 ? 'text-red-400' : 'text-orange-400'}>{d.severity}/100</strong> (Timer: {d.totalDurationSeconds}s)</span>
                        <button
                          onClick={() => completeDispatch(d.id)}
                          className="text-xs text-slate-400 hover:text-emerald-300 hover:underline"
                        >
                          Resolve Now ⚡
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resolved Emergencies Log */}
          <div className="bg-slate-800/90 rounded border border-slate-700 p-4 shadow-lg flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2 border-b border-slate-700/80 pb-2">
              <h3 className="font-bold text-slate-200 flex items-center space-x-2">
                <span>✓</span>
                <span>Resolved Crises History ({dispatchLog.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Auto-resolved after countdown</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-48">
              {dispatchLog.length === 0 ? (
                <div className="text-slate-500 text-xs py-3 text-center italic">
                  No crises resolved yet. As ambulances complete their missions, resolved crises will appear here.
                </div>
              ) : (
                [...dispatchLog].reverse().map((log) => (
                  <div key={log.id} className="bg-slate-900/80 p-2.5 rounded border border-slate-800 flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="font-semibold text-slate-200">{log.emergencyId}</span>
                      <span className="text-slate-400">via <strong className="text-cyan-300">{log.ambulanceId}</strong></span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-400">
                      <span>Sev: <strong className="text-slate-300">{log.severity}</strong></span>
                      <span className="font-mono text-emerald-400">Resolved in {log.totalSeconds}s</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Emergency Priority Queue (Max-Heap) (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-800/90 rounded border border-slate-700 p-4 shadow-lg overflow-hidden">
          <div className="flex justify-between items-center mb-3 border-b border-slate-700/80 pb-2">
            <div>
              <h3 className="font-bold text-slate-200">Max-Heap Priority Queue</h3>
              <div className="text-[11px] text-slate-400">Formula: 0.45·Sev + 0.25·People + 0.15·Wait</div>
            </div>
            <span className="text-xs font-mono bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-800">
              {waitingEmergencies.length} Waiting
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {waitingEmergencies.map((e, idx) => (
              <div 
                key={e.id} 
                className="bg-slate-900/90 p-3 rounded border border-slate-700/80 hover:border-slate-500 transition-all shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded text-xs border border-slate-700">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-100">{e.id}</span>
                    <span className="text-xs text-slate-400">@ {e.nodeId}</span>
                  </div>
                  <div className="text-xs font-mono bg-red-950/70 text-red-400 px-2 py-0.5 rounded border border-red-800/80">
                    Score: {e.computedPriority}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-400 mt-2">
                  <div>Severity: <span className={e.severity > 70 ? 'text-red-400 font-semibold' : 'text-orange-400'}>{e.severity}/100</span></div>
                  <div>Affected: <span className="text-slate-300">{e.affectedPeople}</span></div>
                  <div>Waiting: <span className="text-slate-300">{e.waitingMinutes}m</span></div>
                  <div>Type Req: <span className="text-cyan-400 font-semibold">{e.requiredAmbulanceType}</span></div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">
                    Est. Duration: ~{Math.max(5, Math.min(22, Math.round(5 + (e.severity / 100) * 15)))}s
                  </span>
                  <button
                    onClick={() => handleFastDispatch(e)}
                    disabled={availableAmbulances.length === 0}
                    className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-medium rounded transition-colors"
                  >
                    Dispatch Now
                  </button>
                </div>
              </div>
            ))}

            {waitingEmergencies.length === 0 && (
              <div className="text-slate-500 text-center py-8 text-xs italic">
                All emergencies have been assigned or resolved!
                <div className="mt-2">
                  <button
                    onClick={() => setIsAddCrisisOpen(true)}
                    className="text-red-400 hover:underline font-semibold"
                  >
                    + Click here to add a new crisis
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: REPORT NEW CRISIS */}
      {/* ========================================================= */}
      {isAddCrisisOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/60 rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🚨</span>
                <h3 className="text-lg font-bold text-white">Report New Crisis Incident</h3>
              </div>
              <button 
                onClick={() => setIsAddCrisisOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCrisis} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Zone / Location</label>
                <select
                  value={crisisNodeId}
                  onChange={e => setCrisisNodeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-red-500 outline-none"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.id} - {n.label} ({n.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Severity Level</span>
                  <span className={`font-mono font-bold ${crisisSeverity > 70 ? 'text-red-400' : 'text-amber-400'}`}>
                    {crisisSeverity}/100 ({crisisSeverity > 70 ? 'Critical' : crisisSeverity > 40 ? 'Moderate' : 'Low'})
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={crisisSeverity}
                  onChange={e => setCrisisSeverity(+e.target.value)}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Affected People</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={crisisPeople}
                    onChange={e => setCrisisPeople(Math.max(1, +e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ambulance Required</label>
                  <select
                    value={crisisType}
                    onChange={e => setCrisisType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-red-500 outline-none"
                  >
                    <option value="ALS">ALS (Advanced Life Support)</option>
                    <option value="BLS">BLS (Basic Life Support)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Required Equipment</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Defibrillator', 'Ventilator', 'Oxygen Tank', 'Trauma Kit'].map(eq => {
                    const isChecked = selectedEquipment.includes(eq);
                    return (
                      <label 
                        key={eq}
                        className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                          isChecked ? 'bg-red-950/40 border-red-500 text-red-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) setSelectedEquipment([...selectedEquipment, eq]);
                            else setSelectedEquipment(selectedEquipment.filter(item => item !== eq));
                          }}
                          className="accent-red-500"
                        />
                        <span className="text-[11px]">{eq}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCrisisOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-lg transition-all"
                >
                  Confirm & Dispatch to PQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD AMBULANCE (VARY FLEET SIZE) */}
      {/* ========================================================= */}
      {isAddAmbulanceOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/60 rounded-xl shadow-2xl max-w-sm w-full p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🚑</span>
                <h3 className="text-lg font-bold text-white">Add Ambulance to Fleet</h3>
              </div>
              <button 
                onClick={() => setIsAddAmbulanceOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ambulance Call Sign</label>
                <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-emerald-400 font-bold">
                  A{ambulances.length + 1} (Auto-assigned)
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vehicle Classification</label>
                <select
                  value={newAmbType}
                  onChange={e => setNewAmbType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-emerald-500 outline-none"
                >
                  <option value="ALS">ALS (Advanced Life Support - Intensive Care)</option>
                  <option value="BLS">BLS (Basic Life Support - Rapid Response)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Base Hospital / Station</label>
                <select
                  value={newAmbBase}
                  onChange={e => setNewAmbBase(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-emerald-500 outline-none"
                >
                  <option value="H1">Hospital H1 (Metro Central Hospital)</option>
                  <option value="H2">Hospital H2 (East General Hospital)</option>
                  <option value="D1">Depot D1 (Main Emergency Depot)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddAmbulanceOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNewAmbulance}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg transition-all"
                >
                  Deploy Ambulance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
