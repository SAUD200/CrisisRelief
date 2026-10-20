import { useState, useMemo } from 'react';
import { useSimulationStore } from '../../state/store';
import { solveKnapsack } from '../../algorithms/knapsack';
import { solveBinPackingFFD } from '../../algorithms/binPacking';
import { dijkstra } from '../../algorithms/dijkstra';
import type { Ambulance, Emergency, SupplyItem } from '../../types';

export default function ResourceAllocation() {
  const { 
    ambulances, 
    emergencies, 
    supplies, 
    nodes, 
    roads, 
    timeHour, 
    dispatchAmbulance,
    addSupply,
    addAmbulance,
    removeAmbulance,
    defaultAmbulanceCapacity,
    setDefaultAmbulanceCapacity,
  } = useSimulationStore();

  // Mode: Single Match Knapsack vs Multi-Ambulance Bin Packing
  const [allocationMode, setAllocationMode] = useState<'single' | 'multi'>('single');

  // Single Ambulance Dispatch State
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(null);
  const [lastAssignedMsg, setLastAssignedMsg] = useState<string | null>(null);

  // Multi-Ambulance Bin Packing State
  const [multiTargetNodeId, setMultiTargetNodeId] = useState('Z1');
  const [requestedCounts, setRequestedCounts] = useState<Record<string, number>>({
    M1: 4,
    M2: 2,
    F1: 8,
    W1: 15,
  });

  // Add Supply Modal State
  const [isAddSupplyOpen, setIsAddSupplyOpen] = useState(false);
  const [newSupplyName, setNewSupplyName] = useState('');
  const [newSupplyCategory, setNewSupplyCategory] = useState<'medicine' | 'food' | 'water' | 'shelter'>('medicine');
  const [newSupplyWeight, setNewSupplyWeight] = useState(3);
  const [newSupplyValue, setNewSupplyValue] = useState(90);
  const [newSupplyQty, setNewSupplyQty] = useState(50);

  const activeEmergencies = emergencies.filter(e => e.status === 'waiting');
  const selectedEmergency = emergencies.find(e => e.id === selectedEmergencyId);
  const availableAmbulances = ambulances.filter(a => a.status === 'available');

  // Single Vehicle 0/1 Knapsack Result
  const knapsackResult = solveKnapsack(supplies, defaultAmbulanceCapacity);

  // Multi-Vehicle Bin Packing Result
  const requestedList = useMemo(() => {
    return supplies
      .map(item => ({ item, count: requestedCounts[item.id] || 0 }))
      .filter(entry => entry.count > 0);
  }, [supplies, requestedCounts]);

  const binPackingResult = useMemo(() => {
    return solveBinPackingFFD(requestedList, defaultAmbulanceCapacity);
  }, [requestedList, defaultAmbulanceCapacity]);

  // Ambulance matching scores
  const ambulanceScores = useMemo(() => {
    if (!selectedEmergency) return {};
    const scores: Record<string, string> = {};
    ambulances.forEach(a => {
      let score = 0;
      if (a.type === selectedEmergency.requiredAmbulanceType) score += 30;
      else if (a.type === 'ALS' && selectedEmergency.requiredAmbulanceType === 'BLS') score += 15;
      const hasEq = selectedEmergency.requiredEquipment.every((eq: string) => a.equipment.includes(eq));
      if (hasEq) score += 20;
      if (a.status === 'available') score += 20;
      score += (a.fuelPercent / 100) * 10;
      scores[a.id] = score.toFixed(1);
    });
    return scores;
  }, [ambulances, selectedEmergency]);

  // Handle single ambulance dispatch
  const handleAssign = (ambulance: Ambulance, emergency: Emergency) => {
    const routeRes = dijkstra(
      ambulance.locationNodeId,
      emergency.nodeId,
      nodes,
      roads,
      timeHour
    );
    const route = routeRes && routeRes.path.length > 0
      ? routeRes.path
      : [ambulance.locationNodeId, emergency.nodeId];

    const durationSec = Math.max(5, Math.min(22, Math.round(5 + (emergency.severity / 100) * 15)));

    dispatchAmbulance({
      id: `disp-${Date.now()}-${ambulance.id}`,
      ambulanceId: ambulance.id,
      emergencyId: emergency.id,
      fromNodeId: ambulance.locationNodeId,
      toNodeId: emergency.nodeId,
      route,
      startTimestamp: Date.now(),
      totalDurationSeconds: durationSec,
      remainingSeconds: durationSec,
      severity: emergency.severity,
      phase: 'enRoute',
    });

    setLastAssignedMsg(
      `✓ Dispatched ${ambulance.id} to Emergency ${emergency.id} (${durationSec}s countdown started). Watch it live in Control Center or on the City Map!`
    );
    setSelectedEmergencyId(null);
  };

  // Handle Multi-Ambulance Convoy Dispatch (Bin Packing)
  const handleDispatchConvoy = () => {
    const requiredUnits = binPackingResult.bins.length;
    if (availableAmbulances.length < requiredUnits) {
      alert(`Need ${requiredUnits} ambulances for this convoy, but only ${availableAmbulances.length} are currently available. Scale your fleet using the "+ Add Ambulance" button above!`);
      return;
    }

    // Dispatch each assigned bin to the target zone
    binPackingResult.bins.forEach((bin, idx) => {
      const amb = availableAmbulances[idx];
      const routeRes = dijkstra(amb.locationNodeId, multiTargetNodeId, nodes, roads, timeHour);
      const route = routeRes?.path || [amb.locationNodeId, multiTargetNodeId];
      const durationSec = Math.max(8, Math.min(24, Math.round(10 + (bin.utilizationPercent / 100) * 10)));

      dispatchAmbulance({
        id: `disp-convoy-${Date.now()}-${amb.id}`,
        ambulanceId: amb.id,
        emergencyId: `RELIEF-${multiTargetNodeId}-B${bin.binId}`,
        fromNodeId: amb.locationNodeId,
        toNodeId: multiTargetNodeId,
        route,
        startTimestamp: Date.now() + idx * 300,
        totalDurationSeconds: durationSec,
        remainingSeconds: durationSec,
        severity: 75,
        phase: 'enRoute',
      });
    });

    setLastAssignedMsg(
      `🚀 Multi-Ambulance Convoy Dispatched! ${requiredUnits} ambulances loaded with ${binPackingResult.totalWeight}kg supplies en route to ${multiTargetNodeId}. Check Control Center or Map!`
    );
  };

  // Add Supply Item Handler
  const handleCreateSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplyName.trim()) return;

    const newId = `RES-${Date.now().toString().slice(-4)}`;
    const newItem: SupplyItem = {
      id: newId,
      name: newSupplyName,
      category: newSupplyCategory,
      weightKg: Math.max(0.5, newSupplyWeight),
      reliefValue: Math.max(1, newSupplyValue),
      availableQuantity: Math.max(1, newSupplyQty),
    };

    addSupply(newItem);
    setIsAddSupplyOpen(false);
    setNewSupplyName('');
    setLastAssignedMsg(`📦 Added new resource: ${newItem.name} (${newItem.weightKg}kg, +${newItem.reliefValue} value).`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded border border-slate-800 overflow-hidden relative">
      {/* Top Header Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/60 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Resource Allocation & Fleet Logistics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            0/1 Knapsack Optimization & Multi-Ambulance Bin Packing for relief supply division
          </p>
        </div>

        {/* Global Controls & Mode Switch */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-700/80 flex space-x-1">
            <button
              onClick={() => setAllocationMode('single')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                allocationMode === 'single'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single Match & Knapsack
            </button>
            <button
              onClick={() => setAllocationMode('multi')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                allocationMode === 'multi'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Multi-Ambulance Division (Bin Packing)</span>
              <span className="bg-purple-950 text-purple-300 text-[10px] px-1.5 py-0.2 rounded border border-purple-800">
                Least Bins
              </span>
            </button>
          </div>

          {/* Add Resource Button */}
          <button
            onClick={() => setIsAddSupplyOpen(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-all shadow flex items-center space-x-1"
          >
            <span>+</span>
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Fleet & Capacity Config Bar */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Ambulance Fleet Size Stepper */}
        <div className="flex items-center space-x-3">
          <span className="text-slate-400 font-semibold">Active Fleet Size:</span>
          <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
            <span className="font-mono font-bold text-emerald-400 text-sm">{ambulances.length} Units</span>
            <span className="text-slate-500">|</span>
            <span className="text-[11px] text-slate-300">{availableAmbulances.length} Available</span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => {
                if (ambulances.length <= 1) return;
                const avail = [...ambulances].reverse().find(a => a.status === 'available');
                if (avail) removeAmbulance(avail.id);
              }}
              title="Remove an available ambulance"
              className="w-6 h-6 bg-slate-800 hover:bg-red-900 border border-slate-700 rounded text-slate-300 font-bold flex items-center justify-center"
            >
              -
            </button>
            <button
              onClick={() => {
                const nextId = `A${ambulances.length + 1}`;
                addAmbulance({
                  id: nextId,
                  locationNodeId: 'H1',
                  status: 'available',
                  type: ambulances.length % 2 === 0 ? 'ALS' : 'BLS',
                  equipment: ['Defibrillator', 'Oxygen', 'Ventilator'],
                  capacity: 2,
                  fuelPercent: 100,
                });
              }}
              title="Add an ambulance to fleet"
              className="w-6 h-6 bg-slate-800 hover:bg-emerald-600 border border-slate-700 rounded text-slate-300 hover:text-white font-bold flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Vehicle Payload Capacity Slider */}
        <div className="flex items-center space-x-3">
          <span className="text-slate-400 font-semibold">Vehicle Payload Capacity:</span>
          <input
            type="range"
            min="5"
            max="30"
            value={defaultAmbulanceCapacity}
            onChange={e => setDefaultAmbulanceCapacity(+e.target.value)}
            className="w-32 accent-purple-500 cursor-pointer"
          />
          <span className="font-mono font-bold text-purple-400 text-sm bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
            {defaultAmbulanceCapacity} kg / vehicle
          </span>
        </div>
      </div>

      {/* Confirmation Toast */}
      {lastAssignedMsg && (
        <div className="mx-4 mt-3 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs px-4 py-2.5 rounded-lg flex justify-between items-center shadow-lg">
          <div className="flex items-center space-x-2">
            <span>🚀</span>
            <span>{lastAssignedMsg}</span>
          </div>
          <button onClick={() => setLastAssignedMsg(null)} className="text-emerald-400 hover:text-white ml-4">✕</button>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 1: SINGLE AMBULANCE MATCH & 0/1 KNAPSACK */}
      {/* ========================================================= */}
      {allocationMode === 'single' ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Col: Ambulance Dispatch */}
          <div className="w-1/2 p-4 border-r border-slate-800 overflow-y-auto">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
              <h3 className="font-semibold text-slate-200 flex items-center space-x-2">
                <span>🚑</span>
                <span>Match Ambulance to Waiting Crisis</span>
              </h3>
              <span className="text-xs text-slate-400">{activeEmergencies.length} Waiting</span>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs text-slate-300 mb-1 font-medium">Select Waiting Crisis</label>
              <select 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:border-blue-500 outline-none"
                value={selectedEmergencyId || ''}
                onChange={(e) => setSelectedEmergencyId(e.target.value || null)}
              >
                <option value="">-- Choose an Emergency to Dispatch to --</option>
                {activeEmergencies.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.id} — Severity: {e.severity} | Zone: {e.nodeId} | Req: {e.requiredAmbulanceType}
                  </option>
                ))}
              </select>
            </div>

            {selectedEmergency ? (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 bg-slate-800/60 p-2.5 rounded border border-slate-700">
                  Target: <strong className="text-red-400">{selectedEmergency.id}</strong> (Severity: {selectedEmergency.severity}, Zone: {selectedEmergency.nodeId})
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Estimated duration: ~{Math.max(5, Math.min(22, Math.round(5 + (selectedEmergency.severity / 100) * 15)))}s based on severity
                  </div>
                </div>

                {ambulances.map(a => {
                  const score = ambulanceScores[a.id] || '0';
                  const isMatch = a.type === selectedEmergency.requiredAmbulanceType || a.type === 'ALS';
                  const canAssign = isMatch && a.status === 'available';
                  
                  return (
                    <div key={a.id} className="bg-slate-800/90 p-3 rounded border border-slate-700 shadow-sm">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="font-bold text-slate-200 flex items-center space-x-2">
                          <span>{a.id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{a.type}</span>
                          <span className="text-xs text-slate-400">@ {a.locationNodeId}</span>
                        </div>
                        <div className="text-xs font-mono bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                          Match Score: {score}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center space-x-3">
                        <span>Status: <strong className={a.status === 'available' ? 'text-emerald-400' : 'text-amber-400'}>{a.status}</strong></span>
                        <span>Fuel: {a.fuelPercent}%</span>
                        <span>Equip: {a.equipment.join(', ') || 'Standard'}</span>
                      </div>
                      <div className="mt-3">
                        <button 
                          disabled={!canAssign}
                          onClick={() => canAssign && handleAssign(a, selectedEmergency)}
                          className={`w-full py-2 rounded text-xs font-semibold transition-all shadow ${
                            canAssign
                              ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer' 
                              : 'bg-slate-700/60 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {a.status !== 'available' 
                            ? `${a.id} Busy (${a.status})` 
                            : `Assign ${a.id} to ${selectedEmergency.id}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-950/40 rounded border border-dashed border-slate-800 p-6 text-center text-slate-500 text-xs">
                Please select a waiting emergency above to inspect ambulance suitability.
              </div>
            )}
          </div>

          {/* Right Col: Supply Knapsack */}
          <div className="w-1/2 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
              <h3 className="font-semibold text-slate-200 flex items-center space-x-2">
                <span>📦</span>
                <span>Single-Vehicle 0/1 Knapsack Loadout</span>
              </h3>
              <span className="text-xs font-mono text-purple-400 font-bold">Max Value: +{knapsackResult.maxValue}</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded border border-slate-700 mb-4 text-xs text-slate-300">
              <div className="font-semibold text-purple-300 mb-1">Knapsack Optimization (Payload: {defaultAmbulanceCapacity} kg):</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Algorithm selected <strong className="text-slate-200">{knapsackResult.selectedItems.length} relief packs</strong> maximizing emergency relief value to <strong className="text-purple-400 font-bold">+{knapsackResult.maxValue}</strong> within the vehicle's capacity.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">
                Selected Loadout Items:
              </div>
              {knapsackResult.selectedItems.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-200 font-medium">{item.name}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded capitalize">{item.category}</span>
                  </div>
                  <div className="flex space-x-3 text-slate-400">
                    <span>{item.weightKg} kg</span>
                    <span className="text-emerald-400 font-mono font-semibold">+{item.reliefValue} val</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* VIEW 2: MULTI-AMBULANCE RESOURCE DIVISION (BIN PACKING)  */
        /* ========================================================= */
        <div className="flex flex-1 overflow-hidden p-4 gap-4">
          {/* Left Sub-Col: Resource Demand Request Builder */}
          <div className="w-5/12 bg-slate-950 rounded-lg border border-slate-800 p-4 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <span>📋</span>
                  <span>1. Configure Resource Demand for Crisis Zone</span>
                </h3>
              </div>

              <div className="mb-4">
                <label className="block text-xs text-slate-400 mb-1">Target Emergency / Shelter Zone:</label>
                <select
                  value={multiTargetNodeId}
                  onChange={e => setMultiTargetNodeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.id} - {n.label} ({n.type})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-slate-300 mb-1">Specify Quantity Needed per Resource:</div>
                {supplies.map(item => {
                  const currentCount = requestedCounts[item.id] || 0;
                  return (
                    <div key={item.id} className="bg-slate-900 p-2.5 rounded border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-200">{item.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.weightKg}kg/unit • +{item.reliefValue} val
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setRequestedCounts(prev => ({
                            ...prev,
                            [item.id]: Math.max(0, (prev[item.id] || 0) - 1)
                          }))}
                          className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-cyan-400">
                          {currentCount}
                        </span>
                        <button
                          onClick={() => setRequestedCounts(prev => ({
                            ...prev,
                            [item.id]: (prev[item.id] || 0) + 1
                          }))}
                          className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Demand Summary KPI */}
            <div className="mt-4 pt-3 border-t border-slate-800 bg-slate-900/60 p-3 rounded border border-slate-800/80">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Requested Weight:</span>
                <span className={`font-mono font-bold text-sm ${binPackingResult.totalWeight > defaultAmbulanceCapacity ? 'text-red-400' : 'text-emerald-400'}`}>
                  {binPackingResult.totalWeight} kg
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>Vehicle Payload Capacity:</span>
                <span className="font-mono text-purple-400 font-semibold">{defaultAmbulanceCapacity} kg</span>
              </div>
              {binPackingResult.totalWeight > defaultAmbulanceCapacity && (
                <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-800/50">
                  ⚡ Demand exceeds 1 vehicle capacity! Automatically partitioned into least possible ambulances via Bin Packing (FFD).
                </div>
              )}
            </div>
          </div>

          {/* Right Sub-Col: Bin Packing Allocation Breakdown */}
          <div className="w-7/12 bg-slate-950 rounded-lg border border-slate-800 p-4 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center space-x-2">
                    <span>🧮</span>
                    <span>2. Automatic Division Across Minimum Ambulances (Bin Packing)</span>
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">Algorithm: First-Fit Decreasing (FFD) • Theoretical Lower Bound: {binPackingResult.theoreticalLowerBound}</div>
                </div>
                <div className="bg-purple-950 text-purple-300 px-2.5 py-1 rounded border border-purple-800 text-xs font-mono font-bold">
                  {binPackingResult.minAmbulancesRequired} Ambulances Needed
                </div>
              </div>

              {/* Bins List */}
              <div className="space-y-3">
                {binPackingResult.bins.map((bin) => {
                  return (
                    <div key={bin.binId} className="bg-slate-900 p-3 rounded-lg border border-slate-700/80 shadow-md">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-xs">🚑 Ambulance #{bin.binId}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                            Payload Limit: {bin.maxCapacity}kg
                          </span>
                        </div>
                        <div className="text-xs font-mono font-bold text-purple-400">
                          {bin.currentWeight} / {bin.maxCapacity} kg ({bin.utilizationPercent}%)
                        </div>
                      </div>

                      {/* Capacity Utilization Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            bin.utilizationPercent > 90 ? 'bg-emerald-400' : 'bg-purple-500'
                          }`}
                          style={{ width: `${bin.utilizationPercent}%` }}
                        />
                      </div>

                      {/* Items packed inside this vehicle */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {bin.items.map((itemGroup, gIdx) => (
                          <span 
                            key={gIdx}
                            className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded flex items-center space-x-1"
                          >
                            <span className="font-bold text-cyan-300">{itemGroup.quantity}x</span>
                            <span>{itemGroup.item.name}</span>
                            <span className="text-slate-500 font-mono">({itemGroup.totalWeight}kg)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {binPackingResult.bins.length === 0 && (
                  <div className="text-slate-500 text-xs py-8 text-center italic">
                    No resources selected. Increase item quantities on the left to compute bin packing.
                  </div>
                )}
              </div>
            </div>

            {/* Convoy Dispatch Action Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
              <div className="text-xs text-slate-400">
                Fleet Status: <strong className="text-emerald-400 font-mono">{availableAmbulances.length}</strong> available / <strong className="text-slate-200 font-mono">{binPackingResult.minAmbulancesRequired}</strong> required
              </div>
              <button
                onClick={handleDispatchConvoy}
                disabled={binPackingResult.bins.length === 0}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg flex items-center space-x-2"
              >
                <span>🚀</span>
                <span>Dispatch {binPackingResult.minAmbulancesRequired}-Ambulance Convoy to {multiTargetNodeId}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD NEW SUPPLY RESOURCE ITEM */}
      {/* ========================================================= */}
      {isAddSupplyOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/60 rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📦</span>
                <h3 className="text-lg font-bold text-white">Add New Relief Supply Resource</h3>
              </div>
              <button 
                onClick={() => setIsAddSupplyOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupply} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resource Name</label>
                <input
                  type="text"
                  placeholder="e.g. Portable Ventilator, Blood Plasma Unit"
                  value={newSupplyName}
                  onChange={e => setNewSupplyName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newSupplyCategory}
                    onChange={e => setNewSupplyCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-emerald-500 outline-none"
                  >
                    <option value="medicine">Medicine & Trauma</option>
                    <option value="food">Food & Rations</option>
                    <option value="water">Clean Water</option>
                    <option value="shelter">Shelter & Warmth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Weight per Unit (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={newSupplyWeight}
                    onChange={e => setNewSupplyWeight(+e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Relief Value (Points)</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={newSupplyValue}
                    onChange={e => setNewSupplyValue(+e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Stock Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={newSupplyQty}
                    onChange={e => setNewSupplyQty(+e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplyOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg transition-all"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
