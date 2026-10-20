import { useState, useMemo, useEffect } from 'react';
import { useSimulationStore } from '../../state/store';
import { AmbulanceIcon, DepotIcon, EmergencyZoneIcon, HospitalIcon, JunctionIcon, ShelterIcon } from './Icons3D';
import { dijkstra } from '../../algorithms/dijkstra';
import { aStar } from '../../algorithms/aStar';
import { Trie } from '../../algorithms/trie';
import { greedySignalAllocation, optimizeSignalsDP } from '../../algorithms/signalOptimizer';
import type { LaneState, Phase } from '../../algorithms/signalOptimizer';
import type { CityNode } from '../../types';

// Interpolate coordinates along a multi-hop route
function getInterpolatedPosition(
  routeNodeIds: string[],
  nodes: CityNode[],
  t: number
): { x: number; y: number } {
  const pts = routeNodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean) as CityNode[];
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1) return { x: pts[0].x, y: pts[0].y };

  const segLengths: number[] = [];
  let totalLen = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dy = pts[i + 1].y - pts[i].y;
    const len = Math.hypot(dx, dy);
    segLengths.push(len);
    totalLen += len;
  }

  if (totalLen === 0) return { x: pts[0].x, y: pts[0].y };

  const targetDist = Math.max(0, Math.min(1, t)) * totalLen;
  let accum = 0;
  for (let i = 0; i < segLengths.length; i++) {
    if (accum + segLengths[i] >= targetDist) {
      const segT = (targetDist - accum) / (segLengths[i] || 1);
      return {
        x: pts[i].x + segT * (pts[i + 1].x - pts[i].x),
        y: pts[i].y + segT * (pts[i + 1].y - pts[i].y),
      };
    }
    accum += segLengths[i];
  }

  return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
}

// Calculate vehicle heading angle in degrees along path
function getHeadingAngle(
  routeNodeIds: string[],
  nodes: CityNode[],
  t: number
): number {
  const delta = 0.03;
  const p1 = getInterpolatedPosition(routeNodeIds, nodes, Math.max(0, t - delta));
  const p2 = getInterpolatedPosition(routeNodeIds, nodes, Math.min(1, t + delta));
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (Math.hypot(dx, dy) < 0.1) return 0;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export default function CityMap() {
  const { nodes, roads, ambulances, emergencies, dispatches, timeHour } = useSimulationStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [raceMode, setRaceMode] = useState(false);
  const [raceResults, setRaceResults] = useState<{ dijkstra: any, aStar: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // High-frequency render tick for smooth 60fps ambulance animations
  const [, setTick] = useState(0);
  useEffect(() => {
    if (dispatches.length === 0) return;
    const anim = requestAnimationFrame(function loop() {
      setTick(t => t + 1);
      if (useSimulationStore.getState().dispatches.length > 0) {
        requestAnimationFrame(loop);
      }
    });
    return () => cancelAnimationFrame(anim);
  }, [dispatches.length]);

  // Traffic Signal UI State
  const [optimizedAllocation, setOptimizedAllocation] = useState<Record<string, number> | null>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Mock Lane data for a selected Junction
  const mockLanes: LaneState[] = [
    { id: 'L1', direction: 'North', queueLength: 82 },
    { id: 'L2', direction: 'South', queueLength: 21 },
    { id: 'L3', direction: 'East', queueLength: 51 },
    { id: 'L4', direction: 'West', queueLength: 13 },
  ];
  const greedyAlloc = greedySignalAllocation(mockLanes);

  const handleOptimizeSignals = () => {
    const phases: Phase[] = [
      { id: 'North/South', lanes: [mockLanes[0], mockLanes[1]] },
      { id: 'East/West', lanes: [mockLanes[2], mockLanes[3]] }
    ];
    const dpAlloc = optimizeSignalsDP(phases, 60, 5);
    setOptimizedAllocation(dpAlloc);
  };

  // Initialize Trie with all city nodes
  const searchTrie = useMemo(() => {
    const trie = new Trie();
    nodes.forEach(n => {
      trie.insert(n.label, n);
    });
    return trie;
  }, [nodes]);

  const searchResults = searchQuery.length > 0 ? searchTrie.searchPrefix(searchQuery) : [];

  // Race Mode setup
  const demoStart = 'H1';
  const demoEnd = selectedNodeId || 'Z5';

  const runRace = () => {
    const resD = dijkstra(demoStart, demoEnd, nodes, roads, timeHour);
    const resA = aStar(demoStart, demoEnd, nodes, roads, timeHour);
    setRaceResults({ dijkstra: resD, aStar: resA });
  };

  // Collect set of road keys active in any dispatch path for highlighting
  const activeDispatchRoadSegments = useMemo(() => {
    const segments = new Set<string>();
    dispatches.forEach(d => {
      for (let i = 0; i < d.route.length - 1; i++) {
        const u = d.route[i];
        const v = d.route[i + 1];
        segments.add(`${u}->${v}`);
        segments.add(`${v}->${u}`);
      }
    });
    return segments;
  }, [dispatches]);

  // SVG viewBox bounds
  const minX = Math.min(...nodes.map((n) => n.x)) - 60;
  const maxX = Math.max(...nodes.map((n) => n.x)) + 60;
  const minY = Math.min(...nodes.map((n) => n.y)) - 60;
  const maxY = Math.max(...nodes.map((n) => n.y)) + 60;

  const renderIcon = (type: string, x: number, y: number) => {
    switch (type) {
      case 'hospital': return <HospitalIcon x={x} y={y} color="" />;
      case 'depot': return <DepotIcon x={x} y={y} color="" />;
      case 'shelter': return <ShelterIcon x={x} y={y} color="" />;
      case 'junction': return <JunctionIcon x={x} y={y} color="" />;
      case 'emergencyZone': return <EmergencyZoneIcon x={x} y={y} color="" />;
      default: return <circle cx={x} cy={y} r={10} fill="#fff" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded border border-slate-800 relative overflow-hidden select-none">
      {/* 1. TOP-LEFT: Trie Search Bar & Time Badge (Dedicated, Clean, High z-index) */}
      <div className="absolute top-4 left-4 z-50 flex flex-col space-y-2 w-72 pointer-events-auto">
        {/* Time HUD */}
        <div className="bg-slate-900/95 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-200">Simulation Clock</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            {String(timeHour).padStart(2, '0')}:00
          </span>
        </div>

        {/* Trie Search Box */}
        <div className="relative">
          <div className="bg-slate-900/95 p-2 rounded-lg border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center space-x-2">
            <span className="text-slate-400 text-sm">🔍</span>
            <input 
              type="text" 
              placeholder="Search node (Trie prefix)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 outline-none focus:border-blue-500 placeholder-slate-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-200 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Trie Search Results Dropdown - Floating with highest z-index */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-1.5 w-full bg-slate-900/98 border border-blue-500/60 rounded-lg shadow-2xl overflow-hidden max-h-56 z-50 backdrop-blur-xl">
              <div className="px-3 py-1.5 bg-blue-950/60 border-b border-blue-900/50 text-[10px] font-bold text-blue-300 uppercase tracking-wider flex justify-between">
                <span>Trie Matches ({searchResults.length})</span>
                <span>O(L) Lookup</span>
              </div>
              <div className="overflow-y-auto max-h-48">
                {searchResults.map((res: any) => (
                  <div 
                    key={res.id} 
                    className="px-3 py-2 text-xs text-slate-200 hover:bg-blue-600/30 hover:text-blue-200 cursor-pointer border-b border-slate-800/60 flex items-center justify-between transition-colors"
                    onClick={() => { 
                      setSelectedNodeId(res.id); 
                      setSearchQuery(''); 
                    }}
                  >
                    <span className="font-medium">{res.label}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded capitalize">
                      {res.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. TOP-RIGHT: Algorithm Race Mode (Separated completely from Trie search) */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto flex flex-col items-end space-y-2">
        <div className="bg-slate-900/95 p-3 rounded-lg border border-slate-700/80 shadow-xl backdrop-blur-md w-64">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-200 cursor-pointer">
            <input 
              type="checkbox" 
              checked={raceMode} 
              onChange={e => setRaceMode(e.target.checked)} 
              className="accent-blue-500 rounded" 
            />
            <span>Algorithm Race (Dijkstra vs A*)</span>
          </label>
          
          {raceMode && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-col space-y-2">
              <div className="text-[11px] text-slate-400">
                Route: <strong className="text-blue-400">H1</strong> ➔ <strong className="text-purple-400">{demoEnd}</strong>
              </div>
              <button 
                onClick={runRace} 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 rounded transition-all shadow"
              >
                Run Race Comparison
              </button>
            </div>
          )}
        </div>

        {raceMode && raceResults && (
          <div className="bg-slate-950/98 p-3 rounded-lg border border-slate-700 shadow-2xl w-64 space-y-2.5 backdrop-blur-md">
            <div className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-1">
              Race Benchmark Results
            </div>
            <div className="bg-blue-950/40 p-2 rounded border border-blue-900/60">
              <div className="text-xs font-bold text-blue-400 flex justify-between">
                <span>Dijkstra Algorithm</span>
                <span className="font-mono text-[10px]">O((V+E)logV)</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">Explored: <strong className="text-white">{raceResults.dijkstra?.nodesExplored || 0}</strong> nodes</div>
              <div className="text-[11px] text-slate-300">Cost: <strong className="text-white">{raceResults.dijkstra?.totalCost?.toFixed(2) || 'N/A'}</strong> min</div>
            </div>
            <div className="bg-purple-950/40 p-2 rounded border border-purple-900/60">
              <div className="text-xs font-bold text-purple-400 flex justify-between">
                <span>A* Search (Heuristic)</span>
                <span className="font-mono text-[10px]">Heuristic h(n)</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">Explored: <strong className="text-white">{raceResults.aStar?.nodesExplored || 0}</strong> nodes</div>
              <div className="text-[11px] text-slate-300">Cost: <strong className="text-white">{raceResults.aStar?.totalCost?.toFixed(2) || 'N/A'}</strong> min</div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM-LEFT: Active Dispatches HUD (Shows ongoing 2-way animated routes) */}
      {dispatches.length > 0 && (
        <div className="absolute bottom-4 left-4 z-30 pointer-events-auto bg-slate-900/95 p-3 rounded-lg border border-cyan-500/50 shadow-2xl backdrop-blur-md max-w-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 mb-2">
            <span className="animate-pulse">🚑</span>
            <span>Live Active Dispatches on Map ({dispatches.length})</span>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {dispatches.map(d => (
              <div key={d.id} className="text-[11px] bg-slate-950/80 p-2 rounded border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white">{d.ambulanceId}</span>
                  <span className="text-slate-400"> ➔ </span>
                  <span className="font-bold text-red-400">{d.emergencyId}</span>
                  <div className="text-[10px] text-slate-400">
                    {d.phase === 'enRoute' && 'En Route to Scene ➔'}
                    {d.phase === 'atIncident' && '🩺 Stabilizing Patients'}
                    {d.phase === 'returning' && '⬅ Returning to Hospital'}
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-300">{d.remainingSeconds}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Junction Signal Optimizer Drawer (if junction clicked) */}
      {selectedNode && selectedNode.type === 'junction' && (
        <div className="absolute bottom-4 right-4 z-30 bg-slate-900/95 p-4 rounded-lg border border-slate-700 shadow-2xl backdrop-blur-md w-80 text-xs pointer-events-auto">
          <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
            <h3 className="font-bold text-slate-100">{selectedNode.label} Signal Controller</h3>
            <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-slate-200">✕</button>
          </div>
          
          <div className="space-y-2 mb-3">
            {mockLanes.map(lane => (
              <div key={lane.id}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">{lane.direction}</span>
                  <span className="text-slate-400">{lane.queueLength} cars</span>
                  <span className="text-emerald-400 font-mono">Greedy: {greedyAlloc[lane.direction]}s</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5">
                  <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, lane.queueLength)}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleOptimizeSignals}
            className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium shadow mb-2"
          >
            Optimize Signals (DP Phase Split)
          </button>

          {optimizedAllocation && (
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 font-semibold mb-1">Optimal DP Split (60s Cycle)</div>
              {Object.entries(optimizedAllocation).map(([phase, seconds]) => (
                <div key={phase} className="flex justify-between items-center text-[11px]">
                  <span className="text-purple-300">{phase} Phase:</span>
                  <span className="text-slate-200 font-mono font-bold">{seconds}s</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. SVG MAP CANVAS */}
      <div className="flex-1 w-full h-full overflow-hidden bg-slate-950">
        <svg
          width="100%"
          height="100%"
          viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
          preserveAspectRatio="xMidYMid meet"
          className="cursor-crosshair"
        >
          {/* Defs for gradients & filters */}
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="dispatchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="headlightCone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Base Roads */}
          {roads.map((road) => {
            const fromNode = nodes.find((n) => n.id === road.from);
            const toNode = nodes.find((n) => n.id === road.to);
            if (!fromNode || !toNode) return null;

            const isClosed = road.status === 'closed';
            const traffic = road.trafficByHour[timeHour] || 0;
            const hazard = road.hazardByHour[timeHour] || 0;

            const roadKey1 = `${road.from}->${road.to}`;
            const roadKey2 = `${road.to}->${road.from}`;
            const isDispatched = activeDispatchRoadSegments.has(roadKey1) || activeDispatchRoadSegments.has(roadKey2);

            let strokeColor = '#334155'; // default slate-700
            let strokeWidth = 3 + (traffic / 25);

            if (isClosed) {
              strokeColor = '#ef4444';
            } else if (hazard > 15) {
              strokeColor = '#f97316';
            }

            // Highlight path in race mode
            if (raceMode && raceResults?.aStar?.path) {
              const p = raceResults.aStar.path;
              for (let i = 0; i < p.length - 1; i++) {
                if ((p[i] === road.from && p[i + 1] === road.to) ||
                    (p[i] === road.to && p[i + 1] === road.from)) {
                  strokeColor = '#8b5cf6';
                  strokeWidth = 6;
                  break;
                }
              }
            }

            return (
              <g key={road.id}>
                {/* Underlying base road line */}
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-300"
                />

                {/* Highlighted Glowing Overlay for Active Dispatches */}
                {isDispatched && !isClosed && (
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="#06b6d4"
                    strokeWidth={strokeWidth + 3}
                    strokeDasharray="8 4"
                    filter="url(#glow)"
                    className="opacity-90 animate-pulse"
                  />
                )}

                {isClosed && (
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2}
                    fill="#ef4444"
                    fontSize="13"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    ✕
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const hasEmergency = emergencies.some(e => e.nodeId === node.id && e.status !== 'resolved');
            const isSelected = selectedNodeId === node.id;

            return (
              <g
                key={node.id}
                className="cursor-pointer group"
                onClick={() => setSelectedNodeId(node.id)}
              >
                {/* Pulsing ring around emergencies */}
                {hasEmergency && (
                  <circle 
                    cx={node.x} 
                    cy={node.y} 
                    r={20} 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    className="animate-ping opacity-75"
                  />
                )}

                {renderIcon(node.type, node.x, node.y)}

                {/* Highlight selected node */}
                {isSelected && (
                  <circle 
                    cx={node.x} 
                    cy={node.y} 
                    r={24} 
                    fill="none" 
                    stroke="#eab308" 
                    strokeWidth={2} 
                    strokeDasharray="4 2" 
                    className="animate-spin-slow" 
                  />
                )}

                {/* Node ID & Label */}
                <rect
                  x={node.x - 26}
                  y={node.y + 14}
                  width={52}
                  height={15}
                  fill="rgba(15, 23, 42, 0.85)"
                  rx={3}
                  className="pointer-events-none"
                />
                <text
                  x={node.x}
                  y={node.y + 25}
                  fill="#cbd5e1"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {node.id}
                </text>
              </g>
            );
          })}

          {/* Stationary Ambulances (when not currently dispatched) */}
          {ambulances.map((ambulance) => {
            const isDispatched = dispatches.some(d => d.ambulanceId === ambulance.id);
            if (isDispatched) return null; // rendered dynamically below

            const node = nodes.find((n) => n.id === ambulance.locationNodeId);
            if (!node) return null;
            return (
              <AmbulanceIcon
                key={ambulance.id}
                x={node.x}
                y={node.y}
                color=""
                status={ambulance.status}
              />
            );
          })}

          {/* ANIMATED MOVING AMBULANCES (Two-Way Trip: Hospital ➔ Incident ➔ Hospital) */}
          {dispatches.map((d) => {
            const now = Date.now();
            const elapsed = (now - d.startTimestamp) / 1000;
            const progress = Math.min(1, Math.max(0, elapsed / d.totalDurationSeconds));

            let currentPos = { x: 0, y: 0 };
            let headingDeg = 0;
            let subPhaseText = '';
            let isMoving = false;

            if (progress < 0.45) {
              // 1. Moving from Hospital to Emergency Incident
              const t = progress / 0.45;
              currentPos = getInterpolatedPosition(d.route, nodes, t);
              headingDeg = getHeadingAngle(d.route, nodes, t);
              subPhaseText = '➔ En Route';
              isMoving = true;
            } else if (progress < 0.60) {
              // 2. At Incident (treating/stabilizing)
              const lastNode = nodes.find(n => n.id === d.toNodeId) || nodes.find(n => n.id === d.route[d.route.length - 1]);
              currentPos = lastNode ? { x: lastNode.x, y: lastNode.y } : { x: 0, y: 0 };
              headingDeg = 0;
              subPhaseText = '🩺 Treating Patients';
              isMoving = false;
            } else {
              // 3. Returning from Emergency Incident back to Hospital
              const t = (progress - 0.60) / 0.40;
              const reversedRoute = [...d.route].reverse();
              currentPos = getInterpolatedPosition(reversedRoute, nodes, t);
              headingDeg = getHeadingAngle(reversedRoute, nodes, t);
              subPhaseText = '⬅ Returning Base';
              isMoving = true;
            }

            return (
              <g key={`anim-${d.id}`} className="transition-transform duration-75">
                {/* 1. VEHICLE GROUP (Rotates along road heading) */}
                <g transform={`translate(${currentPos.x}, ${currentPos.y}) rotate(${headingDeg})`}>
                  {/* Forward Headlight Beam (shining along road when moving) */}
                  {isMoving && (
                    <polygon
                      points="12,-4 42,-12 42,12 12,4"
                      fill="url(#headlightCone)"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Pulsing Emergency Siren Aura */}
                  <circle
                    cx={0}
                    cy={0}
                    r={20}
                    fill="rgba(6, 182, 212, 0.2)"
                    stroke="#06b6d4"
                    strokeWidth={1.5}
                    className="animate-ping"
                  />

                  {/* High-Visibility Ambulance Icon */}
                  <AmbulanceIcon
                    x={0}
                    y={0}
                    color=""
                    status="enRoute"
                    scale={1.35}
                  />

                  {/* Flashing Alternating Red & Blue Roof Lights */}
                  <circle cx={1} cy={-4} r={3} fill="#ef4444" className="animate-ping" opacity={0.8} />
                  <circle cx={1} cy={4} r={3} fill="#3b82f6" className="animate-ping" opacity={0.8} />
                </g>

                {/* 2. INCIDENT SITE PULSE EFFECT (when stabilizing) */}
                {!isMoving && (
                  <circle
                    cx={currentPos.x}
                    cy={currentPos.y}
                    r={28}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    className="animate-spin-slow"
                  />
                )}

                {/* 3. FLOATING VEHICLE BADGE (Stays upright & horizontal above ambulance) */}
                <g transform={`translate(${currentPos.x}, ${currentPos.y - 26})`} className="pointer-events-none">
                  {/* Drop shadow pill background */}
                  <rect
                    x={-48}
                    y={-14}
                    width={96}
                    height={18}
                    rx={5}
                    fill="rgba(10, 15, 30, 0.95)"
                    stroke="#38bdf8"
                    strokeWidth={1.2}
                    filter="url(#glow)"
                  />
                  {/* Content: 🚑 CallSign • Timer */}
                  <text
                    x={0}
                    y={-1}
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    🚑 {d.ambulanceId} • {d.remainingSeconds}s
                  </text>
                  {/* Mini sub-label */}
                  <rect
                    x={-40}
                    y={4}
                    width={80}
                    height={12}
                    rx={3}
                    fill="rgba(15, 23, 42, 0.9)"
                  />
                  <text
                    x={0}
                    y={13}
                    fill="#38bdf8"
                    fontSize="7.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {subPhaseText}
                  </text>
                </g>
              </g>
            );
          })}

        </svg>
      </div>
    </div>
  );
}
