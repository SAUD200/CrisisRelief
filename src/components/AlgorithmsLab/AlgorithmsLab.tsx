import { useState, useMemo } from 'react';
import { useSimulationStore } from '../../state/store';
import { dijkstra } from '../../algorithms/dijkstra';
import { aStar } from '../../algorithms/aStar';
import { solveKnapsack } from '../../algorithms/knapsack';
import { solveBinPackingFFD } from '../../algorithms/binPacking';
import { SegmentTree } from '../../algorithms/segmentTree';
import { HashMap } from '../../algorithms/hashMap';
import type { Emergency } from '../../types';

export default function AlgorithmsLab() {
  const { roads, nodes, emergencies, supplies, timeHour } = useSimulationStore();
  const [activeAlgoTab, setActiveAlgoTab] = useState<'heap' | 'pathfinding' | 'knapsack' | 'binpacking' | 'segmentTree' | 'hashing'>('heap');

  // -------------------------------------------------------------
  // 1. Max-Heap Interactive State
  // -------------------------------------------------------------
  const [customSeverity, setCustomSeverity] = useState(85);
  const [customPeople, setCustomPeople] = useState(15);
  const [customWait, setCustomWait] = useState(10);
  const [extractedHistory, setExtractedHistory] = useState<string[]>([]);

  const heapArray = useMemo(() => {
    return emergencies.map(e => {
      const normPeople = Math.min(e.affectedPeople * 5, 100);
      const normWait = Math.min(e.waitingMinutes * 2, 100);
      const score = Number(((0.45 * e.severity) + (0.25 * normPeople) + (0.15 * normWait)).toFixed(2));
      return { id: e.id, score, severity: e.severity, node: e.nodeId };
    }).sort((a, b) => b.score - a.score);
  }, [emergencies]);

  const handleExtractMax = () => {
    if (heapArray.length === 0) return;
    const top = heapArray[0];
    setExtractedHistory(prev => [
      `Extracted ${top.id} (Score: ${top.score}, Sev: ${top.severity}) via O(log n) heapify-down`,
      ...prev.slice(0, 4)
    ]);
  };

  // -------------------------------------------------------------
  // 2. Dijkstra vs A* Interactive State
  // -------------------------------------------------------------
  const [pathStart, setPathStart] = useState('H1');
  const [pathEnd, setPathEnd] = useState('Z3');
  const [pathResult, setPathResult] = useState<{ dijkstra: any; aStar: any } | null>(null);

  const handleRunPathComparison = () => {
    const resD = dijkstra(pathStart, pathEnd, nodes, roads, timeHour);
    const resA = aStar(pathStart, pathEnd, nodes, roads, timeHour);
    setPathResult({ dijkstra: resD, aStar: resA });
  };

  // -------------------------------------------------------------
  // 3. Knapsack DP Interactive State
  // -------------------------------------------------------------
  const [capacity, setCapacity] = useState(12);
  const knapsackResult = useMemo(() => {
    return solveKnapsack(supplies, capacity);
  }, [supplies, capacity]);

  // Build DP Matrix for visualization
  const dpMatrix = useMemo(() => {
    const n = Math.min(supplies.length, 6);
    const W = Math.min(capacity, 15);
    const dp: number[][] = Array(n + 1).fill(0).map(() => Array(W + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      const item = supplies[i - 1];
      for (let w = 0; w <= W; w++) {
        if (item.weightKg <= w) {
          dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - item.weightKg] + item.reliefValue);
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }
    return { dp, items: supplies.slice(0, n), maxW: W };
  }, [supplies, capacity]);

  // -------------------------------------------------------------
  // 4. Bin Packing (FFD) Interactive State
  // -------------------------------------------------------------
  const [binVehicleCapacity, setBinVehicleCapacity] = useState(15);
  const [bppCounts, setBppCounts] = useState<Record<string, number>>({
    M1: 5,
    M2: 3,
    F1: 10,
    W1: 20,
  });

  const bppRequestedList = useMemo(() => {
    return supplies
      .map(item => ({ item, count: bppCounts[item.id] || 0 }))
      .filter(e => e.count > 0);
  }, [supplies, bppCounts]);

  const labBinPackingResult = useMemo(() => {
    return solveBinPackingFFD(bppRequestedList, binVehicleCapacity);
  }, [bppRequestedList, binVehicleCapacity]);

  // -------------------------------------------------------------
  // 5. Segment Tree Interactive State
  // -------------------------------------------------------------
  const [selectedRoadId, setSelectedRoadId] = useState<string>(roads[0]?.id || 'R1');
  const [rangeStart, setRangeStart] = useState(8);
  const [rangeEnd, setRangeEnd] = useState(18);
  
  const selectedRoad = roads.find(r => r.id === selectedRoadId);
  const segTree = useMemo(() => {
    if (!selectedRoad) return null;
    return new SegmentTree(selectedRoad.hazardByHour);
  }, [selectedRoad]);

  const maxHazardInRange = useMemo(() => {
    if (!segTree) return 0;
    return segTree.query(rangeStart, rangeEnd);
  }, [segTree, rangeStart, rangeEnd]);

  // -------------------------------------------------------------
  // 5. Hash Map Interactive State
  // -------------------------------------------------------------
  const [lookupQuery, setLookupQuery] = useState('E2');
  const [lookupResult, setLookupResult] = useState<{
    bucket: number;
    hashComparisons: number;
    linearIndex: number;
    linearComparisons: number;
  } | null>(null);

  const emergencyMap = useMemo(() => {
    const map = new HashMap<string, Emergency>(16);
    emergencies.forEach(e => map.set(e.id, e));
    return map;
  }, [emergencies]);

  const performLookup = () => {
    if (!lookupQuery) return;
    const hashRes = emergencyMap.get(lookupQuery);
    let linearIdx = -1;
    let linearComps = 0;
    for (let i = 0; i < emergencies.length; i++) {
      linearComps++;
      if (emergencies[i].id === lookupQuery) {
        linearIdx = i;
        break;
      }
    }
    setLookupResult({
      bucket: hashRes.bucketIndex,
      hashComparisons: hashRes.comparisons,
      linearIndex: linearIdx,
      linearComparisons: linearComps,
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded border border-slate-800 overflow-hidden">
      {/* Header & Algorithm Navigation */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/60 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Algorithm Demonstration Studio</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive visual proofs & theoretical complexity benchmarks for faculty review
          </p>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex space-x-1.5 bg-slate-950/60 p-1 rounded-lg border border-slate-700/80">
          {[
            { id: 'heap', label: '1. Max-Heap PQ' },
            { id: 'pathfinding', label: '2. Dijkstra vs A*' },
            { id: 'knapsack', label: '3. 0/1 Knapsack DP' },
            { id: 'binpacking', label: '4. Bin Packing (FFD)' },
            { id: 'segmentTree', label: '5. Segment Tree' },
            { id: 'hashing', label: '6. Hash Map vs Scan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAlgoTab(tab.id as any)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeAlgoTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ======================================================== */}
        {/* TAB 1: MAX-HEAP PRIORITY QUEUE */}
        {/* ======================================================== */}
        {activeAlgoTab === 'heap' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <span>🔺</span>
                  <span>Max-Heap Priority Queue for Emergency Triage</span>
                </h3>
                <div className="flex space-x-2 text-xs font-mono">
                  <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">Insert: O(log n)</span>
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">Extract-Max: O(log n)</span>
                  <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">Peek: O(1)</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Emergencies cannot be processed FIFO in natural disasters. A binary Max-Heap maintains priority ordering where every parent node has a higher priority score than its children: <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">A[i] &ge; A[2i+1]</code> and <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">A[i] &ge; A[2i+2]</code>.
              </p>
            </div>

            {/* Interactive Formula Playground */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Triage Score Formula</h4>
                <div className="p-3 bg-slate-900 rounded border border-slate-700 text-xs font-mono text-cyan-300 leading-relaxed">
                  Priority = 0.45 &times; Severity<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.25 &times; (People &times; 5)<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.15 &times; (Wait &times; 2)
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-slate-400">Severity: {customSeverity}/100</label>
                    <input type="range" min="1" max="100" value={customSeverity} onChange={e => setCustomSeverity(+e.target.value)} className="w-full accent-red-500" />
                  </div>
                  <div>
                    <label className="text-slate-400">Affected People: {customPeople}</label>
                    <input type="range" min="1" max="50" value={customPeople} onChange={e => setCustomPeople(+e.target.value)} className="w-full accent-blue-500" />
                  </div>
                  <div>
                    <label className="text-slate-400">Wait Time: {customWait}m</label>
                    <input type="range" min="0" max="60" value={customWait} onChange={e => setCustomWait(+e.target.value)} className="w-full accent-amber-500" />
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold">
                    <span className="text-slate-300">Computed Score:</span>
                    <span className="text-amber-400 font-mono text-sm">
                      {((0.45 * customSeverity) + (0.25 * Math.min(customPeople * 5, 100)) + (0.15 * Math.min(customWait * 2, 100))).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Binary Heap Representation */}
              <div className="md:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      Live Heap Array Order ({heapArray.length} items)
                    </h4>
                    <button
                      onClick={handleExtractMax}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-all shadow"
                    >
                      Extract-Max (Triage Root)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {heapArray.map((item, idx) => (
                      <div 
                        key={item.id}
                        className={`p-2.5 rounded border text-xs flex flex-col justify-between ${
                          idx === 0 
                            ? 'bg-red-950/60 border-red-500 shadow-md ring-1 ring-red-500/40' 
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-100 flex items-center space-x-1.5">
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded">#{idx}</span>
                            <span>{item.id}</span>
                          </span>
                          <span className="font-mono text-amber-400 font-bold">{item.score}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                          <span>Sev: {item.severity}</span>
                          <span>Zone: {item.node}</span>
                        </div>
                        {idx === 0 && (
                          <div className="text-[10px] text-red-300 font-bold mt-1 text-center bg-red-900/40 py-0.5 rounded">
                            👑 ROOT (Highest Priority)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {extractedHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <div className="text-[11px] font-semibold text-slate-400 mb-1">Heap Operation Log:</div>
                    {extractedHistory.map((log, i) => (
                      <div key={i} className="text-xs font-mono text-emerald-400">{log}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: DIJKSTRA VS A* SHORTEST PATH */}
        {/* ======================================================== */}
        {activeAlgoTab === 'pathfinding' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <span>🧭</span>
                  <span>Dijkstra vs A* Dynamic Pathfinding Engine</span>
                </h3>
                <div className="flex space-x-2 text-xs font-mono">
                  <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">Dijkstra: O((V+E)log V)</span>
                  <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">A*: O(b^d) Heuristic</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Both algorithms compute optimal paths considering road congestion, closures, and hazard penalties. While Dijkstra searches uniformly in all directions, A* uses an admissible Euclidean heuristic <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">h(n) = &radic;((x - x_goal)&sup2; + (y - y_goal)&sup2;)</code> to guide the search towards the target, drastically pruning explored nodes.
              </p>
            </div>

            {/* Interactive Selector */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium">Origin Node:</span>
                  <select 
                    value={pathStart} 
                    onChange={e => setPathStart(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 outline-none focus:border-blue-500"
                  >
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.id} - {n.label}</option>)}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium">Destination Node:</span>
                  <select 
                    value={pathEnd} 
                    onChange={e => setPathEnd(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 outline-none focus:border-blue-500"
                  >
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.id} - {n.label}</option>)}
                  </select>
                </div>

                <button
                  onClick={handleRunPathComparison}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-all shadow"
                >
                  ⚡ Run Side-by-Side Benchmark
                </button>
              </div>

              {/* Side-by-Side Comparison Cards */}
              {pathResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {/* Dijkstra Result */}
                  <div className="bg-slate-900 p-4 rounded-lg border border-blue-800/80">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                      <div className="font-bold text-blue-400 text-sm">Dijkstra's Algorithm</div>
                      <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                        Uniform Cost Search
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Nodes Explored:</span>
                        <strong className="text-white font-mono">{pathResult.dijkstra?.nodesExplored || 0} nodes</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Total Travel Cost:</span>
                        <strong className="text-white font-mono">{pathResult.dijkstra?.totalCost?.toFixed(2) || 'N/A'} mins</strong>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-slate-400">Calculated Path:</span>
                        <div className="mt-1 font-mono text-cyan-300 bg-slate-950 p-2 rounded border border-slate-800 break-words">
                          {pathResult.dijkstra?.path?.join(' ➔ ') || 'No route found'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* A* Result */}
                  <div className="bg-slate-900 p-4 rounded-lg border border-purple-800/80">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                      <div className="font-bold text-purple-400 text-sm">A* Search Algorithm</div>
                      <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                        Heuristic Guided: f(n)=g(n)+h(n)
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Nodes Explored:</span>
                        <strong className="text-emerald-400 font-mono font-bold">
                          {pathResult.aStar?.nodesExplored || 0} nodes
                          {pathResult.dijkstra?.nodesExplored && (
                            <span className="text-xs text-emerald-300 ml-1">
                              ({Math.round(((pathResult.dijkstra.nodesExplored - pathResult.aStar.nodesExplored) / pathResult.dijkstra.nodesExplored) * 100)}% pruned)
                            </span>
                          )}
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Total Travel Cost:</span>
                        <strong className="text-white font-mono">{pathResult.aStar?.totalCost?.toFixed(2) || 'N/A'} mins</strong>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-slate-400">Calculated Path:</span>
                        <div className="mt-1 font-mono text-purple-300 bg-slate-950 p-2 rounded border border-slate-800 break-words">
                          {pathResult.aStar?.path?.join(' ➔ ') || 'No route found'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: 0/1 KNAPSACK DYNAMIC PROGRAMMING */}
        {/* ======================================================== */}
        {activeAlgoTab === 'knapsack' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <span>🎒</span>
                  <span>0/1 Knapsack Dynamic Programming for Relief Distribution</span>
                </h3>
                <div className="flex space-x-2 text-xs font-mono">
                  <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">Time: O(n &times; W)</span>
                  <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">Space: O(n &times; W)</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Relief packs (medical kits, water purifiers, generators) cannot be divided into fractions. Greedy algorithms based on value-to-weight ratio often fail on 0/1 integer constraints. Dynamic Programming solves the recurrence <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">dp[i][w] = max(dp[i-1][w], dp[i-1][w - wt[i]] + val[i])</code> ensuring mathematical optimality.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900 p-3 rounded border border-slate-800">
                <div className="w-64">
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">
                    Vehicle Weight Capacity Limit: <span className="text-purple-400 font-bold">{capacity} kg</span>
                  </label>
                  <input 
                    type="range" min="2" max="25" 
                    value={capacity} 
                    onChange={e => setCapacity(+e.target.value)} 
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
                <div className="text-xs font-mono">
                  <span className="text-slate-400">Optimal Value: </span>
                  <span className="text-emerald-400 font-bold text-base">+{knapsackResult.maxValue}</span>
                  <span className="text-slate-400 ml-4">Items Selected: </span>
                  <span className="text-purple-400 font-bold text-base">{knapsackResult.selectedItems.length}</span>
                </div>
              </div>

              {/* DP Table Matrix Visualizer */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
                  Live DP State Matrix (dp[i][w])
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-[10px] font-mono border-collapse border border-slate-800">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400">
                        <th className="p-1 border border-slate-800">Item (wt, val)</th>
                        {Array.from({ length: dpMatrix.maxW + 1 }, (_, w) => (
                          <th key={w} className="p-1 border border-slate-800">{w}kg</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dpMatrix.items.map((item, i) => (
                        <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-1.5 border border-slate-800 text-slate-300 font-sans font-medium text-left">
                            {item.name} ({item.weightKg}kg, v{item.reliefValue})
                          </td>
                          {dpMatrix.dp[i + 1].map((val, w) => (
                            <td 
                              key={w} 
                              className={`p-1.5 border border-slate-800 ${
                                val > 0 ? 'text-purple-300 font-bold' : 'text-slate-600'
                              }`}
                            >
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: BIN PACKING (FIRST-FIT DECREASING) */}
        {/* ======================================================== */}
        {activeAlgoTab === 'binpacking' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <span>🧮</span>
                  <span>Bin Packing: First-Fit Decreasing (FFD) for Multi-Vehicle Division</span>
                </h3>
                <div className="flex space-x-2 text-xs font-mono">
                  <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">Time: O(n log n)</span>
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">FFD &le; 11/9 OPT + 1</span>
                  <span className="bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded">NP-Hard Problem</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When disaster zones require relief supplies that vastly exceed an individual vehicle's payload capacity, the system must partition items across the <strong>least possible number of ambulances</strong>. While the 1D Bin Packing Problem is NP-Hard, <strong>First-Fit Decreasing (FFD)</strong> sorts all item weights in descending order and places each item into the first bin with sufficient residual capacity, guaranteeing an asymptotic competitive ratio of at most <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">&asymp; 1.22 &times; OPT</code>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900 p-3 rounded border border-slate-800">
                <div className="w-64">
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">
                    Ambulance Vehicle Capacity: <span className="text-purple-400 font-bold">{binVehicleCapacity} kg</span>
                  </label>
                  <input 
                    type="range" min="5" max="30" 
                    value={binVehicleCapacity} 
                    onChange={e => setBinVehicleCapacity(+e.target.value)} 
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400">Total Demand: </span>
                    <span className="text-cyan-400 font-bold text-sm">{labBinPackingResult.totalWeight} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Lower Bound: </span>
                    <span className="text-slate-300 font-bold text-sm">&lceil;W / C&rceil; = {labBinPackingResult.theoreticalLowerBound}</span>
                  </div>
                  <div className="bg-purple-950/80 text-purple-300 px-3 py-1 rounded border border-purple-800 font-bold">
                    FFD Result: {labBinPackingResult.minAmbulancesRequired} Ambulances
                  </div>
                </div>
              </div>

              {/* Demand Item Steppers */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
                  Configure Item Quantities to Partition:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {supplies.slice(0, 4).map(item => {
                    const count = bppCounts[item.id] || 0;
                    return (
                      <div key={item.id} className="bg-slate-900 p-2.5 rounded border border-slate-800 flex flex-col justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-200">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.weightKg}kg each • +{item.reliefValue} val</div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                          <span className="text-slate-400 text-[11px]">Qty:</span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => setBppCounts(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                              className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-mono font-bold text-cyan-300">{count}</span>
                            <button
                              onClick={() => setBppCounts(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                              className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bins Allocation Display */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
                  Bin Packing Solution ({labBinPackingResult.bins.length} Vehicles Allocated):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {labBinPackingResult.bins.map(bin => (
                    <div key={bin.binId} className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-bold text-white flex items-center space-x-1.5">
                          <span>🚑</span>
                          <span>Ambulance #{bin.binId}</span>
                        </span>
                        <span className="font-mono text-purple-400 font-bold">
                          {bin.currentWeight} / {bin.maxCapacity} kg ({bin.utilizationPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${bin.utilizationPercent}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {bin.items.map((it, idx) => (
                          <span key={idx} className="bg-slate-950 px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-800">
                            {it.quantity}x {it.item.name} ({it.totalWeight}kg)
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: SEGMENT TREE HAZARD MONITORING */}
        {/* ======================================================== */}
        {activeAlgoTab === 'segmentTree' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <span>🌲</span>
                  <span>Segment Tree for Road Hazard Range Queries</span>
                </h3>
                <div className="flex space-x-2 text-xs font-mono">
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">Query: O(log n)</span>
                  <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">Point Update: O(log n)</span>
                  <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">Build: O(n)</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Emergency dispatchers frequently need to know the worst hazard level over dynamic time windows (e.g., "What is the peak hazard on Highway R1 between 2 PM and 8 PM?"). Instead of scanning $O(n)$ hours every query, a Segment Tree computes range maximums in $O(\log n)$ time.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-3 rounded border border-slate-800">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Select Monitored Road:</label>
                  <select
                    value={selectedRoadId}
                    onChange={e => setSelectedRoadId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-xs rounded px-2.5 py-1.5 text-slate-200"
                  >
                    {roads.map(r => (
                      <option key={r.id} value={r.id}>{r.id} ({r.from} ➔ {r.to})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Time Window: [{rangeStart}:00 to {rangeEnd}:00]</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="range" min="0" max="23" 
                      value={rangeStart} 
                      onChange={e => setRangeStart(Math.min(+e.target.value, rangeEnd - 1))}
                      className="accent-emerald-500"
                    />
                    <input 
                      type="range" min="1" max="23" 
                      value={rangeEnd} 
                      onChange={e => setRangeEnd(Math.max(+e.target.value, rangeStart + 1))}
                      className="accent-cyan-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 ml-auto text-xs">
                  <span className="text-slate-400">Peak Hazard Query Result: </span>
                  <span className={`font-mono font-bold text-sm ${maxHazardInRange > 15 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {maxHazardInRange}/100
                  </span>
                </div>
              </div>

              {/* 24-hour Hazard Array Bar Chart */}
              {selectedRoad && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
                    Hourly Hazard Index (Leaves of Segment Tree)
                  </h4>
                  <div className="grid grid-cols-12 md:grid-cols-24 gap-1">
                    {selectedRoad.hazardByHour.map((hazard, h) => {
                      const inRange = h >= rangeStart && h <= rangeEnd;
                      return (
                        <div 
                          key={h} 
                          className={`p-1 rounded text-center text-[10px] font-mono border transition-all ${
                            inRange 
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50' 
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="font-bold">{hazard}</div>
                          <div className="text-[9px] text-slate-500">{h}h</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: HASH MAP VS LINEAR SCAN */}
        {/* ======================================================== */}
        {activeAlgoTab === 'hashing' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Hash Map O(1) vs Linear Scan O(n) Comparison</span>
                </h3>
                <div className="flex space-x-2 text-xs font-mono">
                  <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">Hash Map: O(1) Average</span>
                  <span className="bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded">Linear Scan: O(n)</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Demonstrating bucket index hashing via polynomial rolling hash with separate chaining collision resolution. Hash table guarantees sub-millisecond dispatch record lookup during mass-casualty triage.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
              <div className="flex space-x-2 max-w-md">
                <input 
                  type="text" 
                  placeholder="Enter Emergency ID (e.g. E1, E3, E5)" 
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                />
                <button 
                  onClick={performLookup}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-xs font-bold transition-all shadow"
                >
                  Lookup
                </button>
              </div>

              {lookupResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-4 rounded border border-blue-800">
                    <div className="font-bold text-blue-400 text-xs uppercase mb-2">Hash Table (Bucketed)</div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div>Bucket Index: <strong className="text-white font-mono">{lookupResult.bucket}</strong></div>
                      <div>Element Comparisons: <strong className="text-emerald-400 font-mono">{lookupResult.hashComparisons} comparison</strong></div>
                      <div className="text-[11px] text-slate-400 mt-2">Complexity: O(1) average constant time</div>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-4 rounded border border-red-800/80">
                    <div className="font-bold text-red-400 text-xs uppercase mb-2">Linear Array Scan</div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div>Index Located: <strong className="text-white font-mono">{lookupResult.linearIndex}</strong></div>
                      <div>Element Comparisons: <strong className="text-red-400 font-mono">{lookupResult.linearComparisons} comparisons</strong></div>
                      <div className="text-[11px] text-slate-400 mt-2">Complexity: O(n) sequential search</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
