export default function ComplexityDashboard() {
  return (
    <div className="flex flex-col h-full bg-slate-900 rounded border border-slate-800 overflow-y-auto p-4">
      <h2 className="text-2xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-2">Complexity Dashboard</h2>
      
      <div className="bg-slate-950 rounded border border-slate-800 overflow-hidden mb-8">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-4 py-3">Component</th>
              <th className="px-4 py-3">Algorithm / Structure</th>
              <th className="px-4 py-3">Time Complexity</th>
              <th className="px-4 py-3">Space Complexity</th>
              <th className="px-4 py-3">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-400">
            <tr>
              <td className="px-4 py-3 font-medium text-slate-200">Emergency ranking</td>
              <td className="px-4 py-3">Max-Heap Priority Queue</td>
              <td className="px-4 py-3 font-mono">O(log n)</td>
              <td className="px-4 py-3 font-mono">O(n)</td>
              <td className="px-4 py-3">Select urgent incidents</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-200">Safe route</td>
              <td className="px-4 py-3">A* / Dijkstra + heap</td>
              <td className="px-4 py-3 font-mono">O((V+E) log V)</td>
              <td className="px-4 py-3 font-mono">O(V)</td>
              <td className="px-4 py-3">Compute safe route</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-200">Road risk over time</td>
              <td className="px-4 py-3">Segment Tree</td>
              <td className="px-4 py-3 font-mono">O(log n)</td>
              <td className="px-4 py-3 font-mono">O(n)</td>
              <td className="px-4 py-3">Time-aware hazard data</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-200">Connectivity</td>
              <td className="px-4 py-3">DSU / Union-Find</td>
              <td className="px-4 py-3 font-mono">O(α(V)) amortized</td>
              <td className="px-4 py-3 font-mono">O(V)</td>
              <td className="px-4 py-3">Detect isolated locations</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-200">Resource loading</td>
              <td className="px-4 py-3">0/1 Knapsack</td>
              <td className="px-4 py-3 font-mono">O(nW)</td>
              <td className="px-4 py-3 font-mono">O(nW)</td>
              <td className="px-4 py-3">Select supplies under capacity</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-200">Location search</td>
              <td className="px-4 py-3">Trie</td>
              <td className="px-4 py-3 font-mono">O(L)</td>
              <td className="px-4 py-3 font-mono">O(C)</td>
              <td className="px-4 py-3">Prefix-based location autocomplete</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-200">Entity Records</td>
              <td className="px-4 py-3">Hash Map</td>
              <td className="px-4 py-3 font-mono">O(1) avg</td>
              <td className="px-4 py-3 font-mono">O(n)</td>
              <td className="px-4 py-3">Fast state lookup</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded p-4 border border-slate-700">
          <h3 className="font-semibold text-slate-300 mb-2">Algorithm Explanation: A* vs Dijkstra</h3>
          <p className="text-sm text-slate-400">
            Dijkstra's algorithm explores nodes strictly based on the actual path cost from the source. It expands uniformly in all directions. A* introduces a heuristic function `h(n)` (straight-line distance to destination) which prioritizes exploring nodes that trend towards the destination, significantly reducing the number of nodes explored (and thus time) while still guaranteeing an optimal path.
          </p>
        </div>
        <div className="bg-slate-800 rounded p-4 border border-slate-700">
          <h3 className="font-semibold text-slate-300 mb-2">Data Structure Explanation: DSU</h3>
          <p className="text-sm text-slate-400">
            The Disjoint Set Union (Union-Find) structure tracks connectivity among city nodes. We rebuild the DSU from currently open roads. It lets us check in near-constant time O(α(V)) if an emergency zone is connected to any hospital, easily detecting isolated locations.
          </p>
        </div>
      </div>
    </div>
  );
}
