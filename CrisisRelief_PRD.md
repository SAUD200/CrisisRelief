# Product Requirements Document (PRD)

## Product name
CrisisRelief

## Full title
CrisisRelief: A Dynamic Disaster Response Simulator for Ambulance Allocation, Fair Resource Distribution, and Time-Aware Emergency Routing Using Graph Algorithms, Priority Queues, Segment Trees, DSU, Knapsack Optimization, Tries, and Hash Maps

## Product summary
Build an interactive, animated web application that simulates emergency response in a fictional city during a disaster such as a flood, fire, earthquake, or cyclone.

The user acts as an emergency-control officer. They can create emergency incidents, add road closures, increase traffic, add hazard zones, change the current simulation time, and manage ambulance/resource availability.

The system must make and explain three connected decisions:

1. Which emergency zone should be handled first?
2. Which ambulance/resource vehicle should be assigned to that zone?
3. Which route is safest and fastest at the selected time?

The app must visibly demonstrate advanced DAA data structures and algorithms. It must not be a simple static route-finding visualizer.

## Main novelty
The novelty is an explainable, integrated decision pipeline:

Emergency event
-> emergency priority calculation
-> priority queue ranking
-> suitable ambulance selection
-> time-range congestion and hazard query using Segment Tree
-> safe-route computation using A* or Dijkstra
-> animated ambulance dispatch
-> dynamic rerouting when road conditions change
-> explanation of why every decision was made

Beyond the pipeline, three features exist specifically to differentiate this from a standard classroom visualizer:

1. **Algorithm Race Mode** — Dijkstra and A* run on the same source/destination simultaneously on a split map, each with its own live "nodes explored" and "elapsed steps" counters. The heuristic's advantage becomes visually obvious instead of asserted in a caption.
2. **Manual Override + Counterfactual Mode** — the officer can override the system's ambulance or route choice. The app then computes and displays the counterfactual: how much slower/less safe the human choice was compared to the algorithm's, turning the app into a teaching tool about *why* the algorithm decided what it did.
3. **Guided Tour Mode** — a one-time overlay walkthrough that highlights each panel and explains what data structure/algorithm it demonstrates, so a faculty member or outside viewer can understand the whole app in under two minutes without reading code.
4. **Traffic Signal Optimization & Preemption (stretch feature)** — junctions aren't just pass-through graph nodes; each one has its own per-direction lane queues and a signal-timing algorithm that gives more green time to more congested lanes, and automatically extends green in the direction an approaching ambulance is coming from. This closes the loop between the routing algorithm and the "infrastructure" it routes through — see "Traffic Signal Optimization" under Screen 4 for full detail. Because this is the hardest single feature in the project (difficulty ~8/10), it's explicitly scoped as a Phase 4 stretch goal, attempted only once the core pipeline is solid.

The application should answer:

"Which ambulance should help which emergency, using which route, at the current time, considering urgency, route safety, changing traffic, available equipment, and limited resources — and how would a human decision have compared?"

## Target users
- Faculty evaluating a DAA assignment
- Students learning graph algorithms and advanced data structures
- A demo audience that needs to understand algorithmic decisions visually

## Project constraints
- This is a fictional, educational simulation.
- Do not connect to real emergency systems.
- Use a manually defined city graph with approximately 12–20 locations and 20–35 roads.
- Use 3–6 ambulances and 3–8 emergency incidents.
- Use pre-seeded sample scenarios as well as manual controls.
- Ensure the app works locally without external APIs.
- Prioritize a polished functional demo over an overly large unfinished project.

## Tech stack
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS
- Visual map: SVG, not Google Maps
- State management: React Context, Zustand, or simple useReducer
- Charts: Recharts or custom SVG/CSS visualizations
- Icons: Lucide React for UI chrome; custom isometric/pseudo-3D SVG icon set for map nodes and vehicles (see "3D-style map icons" under Screen 2) — no 3D engine or WebGL library is used
- Algorithms: Implement manually in TypeScript; do not rely on black-box algorithm libraries
- Testing: Vitest for unit tests on every algorithm/data structure (see Testing section)
- Persistence: localStorage only, optional
- Backend: not required for the MVP; use local JSON data
- Optional backend: Flask/FastAPI only if required for algorithm APIs, but frontend-only is preferred

Important:
- Do not use a real map API.
- Build a synthetic city map with nodes and roads in SVG.
- All algorithm output must be visible and explainable in the UI.
- Do not build a backend unless Phase 1–3 are fully complete and there is spare time.

## Design direction
- Professional emergency-control-center dashboard
- Dark navy/slate background, high contrast panels
- Accent colors:
  - Red: critical emergency, closed road, high hazard
  - Orange: high-priority emergency, heavy traffic
  - Yellow: medium priority or caution
  - Green: safe road, resolved incident, available ambulance
  - Blue: hospitals, shelters, active selected route
  - Purple: algorithm/data-structure visualization
- Use cards, panels, pills, timelines, clean typography, subtle shadows
- Avoid a generic classroom visualizer appearance
- Make it look like a real command-center simulation, while clearly labeling it "Educational Simulation"

## Main navigation
1. Control Center
2. Live City Map
3. Resource Allocation
4. Algorithms Lab
5. Scenarios and Replay
6. Complexity Dashboard

(A first-run **Guided Tour** overlay runs across these on first load — see "Guided Tour Mode" below.)

## Screen 1: Control Center
Give a high-level operational overview.

Show: current simulation time; start/pause/reset/speed controls; active emergency count; available ambulance count; ambulances en route; blocked roads count; isolated zones count; medical/food/water inventory; critical alert banner if an unserved critical emergency exists.

Emergency priority queue panel — for every emergency card show: ID, zone/location, severity score 0–100, number of patients/affected people, waiting time, required ambulance type, status (waiting/assigned/en route/resolved/unreachable), computed priority score, priority rank.

Actions: Add Emergency, Dispatch Next Emergency, Add Road Closure, Add Hazard Event, Advance Time, Load Demo Scenario, Reset Scenario.

## Screen 2: Live City Map
Visually demonstrate graph representation, route planning, road conditions, ambulance movement, and dynamic rerouting via SVG.

**Graph nodes:** Hospital, Emergency zone, Shelter, Supply depot, Road junction.
**Graph edges:** Roads with base travel time, distance, congestion, risk, status.
**Ambulance icons:** available (pulse green), assigned (blue outline), dispatched (animates along route).
**Emergency markers:** critical (pulse red), high priority (pulse orange), resolved (green/faded).
**Road state colors:** normal (muted gray/blue), selected route (bright blue), alternative (dashed light blue), congested (orange), hazardous (red-orange), closed (thick red line + X), flooded (blue-red striped).

**Map controls:** select source/destination; toggle A*/Dijkstra; toggle route comparison mode; toggle **Race Mode** (new — see below); click road/node to inspect; add/remove closures and hazards; select time; show/hide weights and labels; animation speed.

**Location search bar (Trie-powered — new):** a search box above the map where typing progressively filters matching node names (e.g. typing "Ho" surfaces "Hospital-1", "Hospital-2"). Selecting a result pans/highlights that node. This is a real, minimal use of a Trie that most groups skip — implement it, don't just plan it.

**Road inspection drawer:** Road ID, connected locations, base travel time, congestion, hazard, status, time slot data, "View Segment Tree" button, "Close Road" button, "Add Hazard" button.

**Zone inspection drawer:** emergency details, priority score breakdown, assigned ambulance, ETA, selected route, why this route was selected, alternative routes considered.

**Junction inspection drawer (stretch feature):** clicking a junction node shows its four (or fewer) lane queue lengths as small bar indicators, current green direction and remaining seconds, and a "View Signal Optimizer" button that opens the full panel described under Screen 4, section H. On the map itself, a junction currently extending green for an approaching ambulance shows a small blue pulse ring, so the preemption behavior is visible without opening the drawer.

### 3D-style map icons (new)
Give nodes and vehicles a sense of depth without a 3D rendering engine. This is a pure SVG/CSS technique — no Three.js, no WebGL, no extra runtime dependency — so it stays fast and doesn't compete with algorithm work for build time.

**Technique — isometric "fake 3D" icons:**
- Draw each building/node type (hospital, shelter, depot, junction) as three flat SVG polygons per icon: a top face, a left face, and a right face, each a different shade of the same base color (top lightest, right mid, left darkest) to simulate a single light source from above. This is the classic isometric-cube technique and reads as genuinely 3D at a glance even though it's flat SVG.
- Give each building icon a soft blurred ellipse drop-shadow beneath it (a semi-transparent SVG `<ellipse>` with `filter: blur(...)`) to ground it visually on the map.
- Vary building height (the vertical extent of the side faces) by type — hospitals and depots slightly taller/wider than junctions — purely for visual hierarchy, not functional data.

**Ambulance icon:**
- Build the ambulance as a small layered SVG (chassis, cab, red-cross panel, wheels) authored at a fixed 3/4 isometric angle, matching the building style.
- Rotate/flip the icon (via CSS `transform: scaleX(-1)` or a small rotation) to face the direction it's currently traveling along the route, computed from the bearing between its current and next route segment.
- Add a subtle CSS `transform: perspective(...) rotateX(...)` "tilt" on the ambulance icon while it's moving, and remove the tilt when it stops — a cheap way to fake momentum/depth without any 3D math beyond a fixed-angle CSS transform.
- Keep the pulse/outline states (available = green pulse, assigned = blue outline, dispatched = animated) exactly as already specified; the isometric style is layered underneath those states, not a replacement for them.

**Hover/selection depth effect:**
- On hover or selection, lift the icon slightly (`translateY(-2px)` combined with a larger, softer drop-shadow) to fake it "popping" toward the viewer. Return to rest state on mouse-out/deselect.

**Asset approach:**
- Author these as a small reusable set of inline SVG React components (`<HospitalIcon3D />`, `<AmbulanceIcon3D />`, etc.) parameterized by color/state, not as external image files — keeps everything in the same self-contained bundle and themeable via the existing color palette (red/orange/yellow/green/blue/purple).
- Do not import an external isometric icon pack or 3D asset library; hand-author the small set of shapes needed (roughly 5 node types + 1 vehicle) to keep bundle size and licensing simple.

### Algorithm Race Mode (new)
A toggle on the map screen that splits the view (or overlays two colored traces) and runs Dijkstra and A* on the same source/destination at the same time, step-synchronized. Each side has its own scoreboard: nodes explored, frontier size, elapsed steps, final path cost. When both finish, show a one-line summary: "A* found the same optimal path exploring 34% fewer nodes because it used the straight-line distance heuristic to avoid searching away from the destination." This directly and visibly earns "novel idea" points because it turns an abstract complexity claim into something the viewer watches happen.

## Screen 3: Resource Allocation

### Ambulance allocation panel
Table/cards per ambulance: ID, current location, status, type (BLS/ALS), equipment list, patient capacity, fuel level, current assignment, predicted availability time.

When an emergency is selected, show candidate ambulances with: travel time to emergency, route safety score, medical capability match, equipment match, fuel feasibility, overall suitability score, decision status (selected/rejected), explicit rejection reason.

```
AmbulanceScore(a, z) =
  0.35 * normalizedRouteSafety +
  0.30 * normalizedInverseArrivalTime +
  0.20 * capabilityMatch +
  0.10 * equipmentMatch +
  0.05 * fuelScore
```
If ambulance capability doesn't meet the emergency requirement, mark unsuitable and exclude.

Natural-language explanation, e.g.: "Ambulance A-02 was selected for Emergency E-04 because it is Advanced Life Support compatible, has the lowest safe ETA of 8 minutes, has required oxygen equipment, and has a route safety score of 92/100."

### Manual Override + Counterfactual Mode (new)
Next to the system's recommended ambulance/route, add an "Override" control letting the officer pick a different ambulance or route manually. On confirming an override, show a counterfactual comparison card:

"You selected A-03 instead of A-02. This choice adds 4.5 minutes to arrival, lowers the route safety score from 92 to 71, and leaves Emergency E-06 (severity 88) waiting 6 minutes longer than if the algorithm's choice had been used."

This makes the app interactive rather than passively animated, and gives a natural talking point for the viva about why the algorithm's decision was actually better (or, occasionally, when a human override is reasonable due to information the algorithm doesn't have — e.g. local knowledge).

### Resource allocation panel
Fictional supplies: medicine kits, food packets, water units, blankets, rescue boats.

Show: available inventory, vehicle capacity, zone needs, selected resource bundle, allocation status, remaining inventory.

0/1 Knapsack for one vehicle: each supply type has weight and value/priority; vehicle has max capacity; select bundle maximizing relief value/need satisfaction.

Explanation: "Knapsack chose 20 medicine kits, 30 water units, and 10 food packets because this combination gives the maximum emergency-relief value within the 100 kg vehicle limit."

Optional fairness slider (0–100): 0 = speed/efficiency first, 100 = underserved/isolated zones first, middle = balance severity/travel time/waiting time/isolation. Display effect of slider changes on ranking and allocations live.

## Screen 4: Algorithms Lab

### A. Priority Queue (max-heap)
Each heap node: Emergency ID, priority score, severity, waiting time. Animate insertion, heapify-up swaps, extraction of highest-priority emergency, heapify-down swaps. Buttons: Insert demo emergency, Extract next, Show calculation, Auto-play, Reset. Complexity: Insert O(log n), Extract-max O(log n), Peek O(1).

### B. Graph route visualization (Dijkstra / A*, plus Race Mode)
Step-through: current node, explored nodes, frontier/open set, finalized nodes, candidate edges, current best route, final path, total cost, nodes explored, priority-queue ops.

A*: `f(n) = g(n) + h(n)` where g(n) is cost so far, h(n) is heuristic straight-line distance to destination.
Dijkstra: `dist[v]` = best known distance from source.

Complexity: Dijkstra with binary heap O((V+E) log V); A* worst case same, typically explores fewer nodes; space O(V).

### C. Segment Tree (mandatory advanced feature)
Store 24 hourly congestion/hazard values per road. Build a Segment Tree for max congestion or max hazard.

Required operations:
1. Range query — "max hazard on Road R-07 from 3 PM to 6 PM?"
2. Point update — "at 4 PM, traffic changes from 60 to 95"
3. Optional: range update with lazy propagation — "flood warning increases hazard by 40 for all slots 3–6 PM"

Visual requirements: timeline/heatmap of the source array; tree nodes labeled with range + aggregate; query highlights (no-overlap gray, partial yellow, full purple) with root-to-node traversal animation and final answer; update highlights leaf-to-root propagation.

Complexity: Build O(n); range query O(log n); point update O(log n); range update w/ lazy O(log n); space O(n) (≈4n array).

Explain why it's used: "Road congestion and hazard change by time. The Segment Tree lets the system obtain risk across a selected time interval quickly, so route decisions can respond to changing disaster conditions."

### D. DSU / Union-Find
Detect whether emergency zones are connected to hospitals/depots after closures. Show connected components by color, parent array, rank/size array, union operations, rebuild logic on closure, isolated-zone marking.

Implementation note: standard DSU doesn't handle edge deletion — rebuild DSU from currently-open roads on closure, and state this explicitly in the UI/docs as an intentional simplification.

Complexity: union/find O(α(V)) amortized with path compression + union by rank; rebuild after closure O(E·α(V)).

### E. Knapsack (0/1 DP)
Visualize available capacity, item weight/value, selected/excluded items, and a simplified DP table or selection explanation. Complexity: time O(nW), space O(nW) or O(W) optimized.

### F. Hash Map fast-lookup panel (new)
A small panel demonstrating the Hash Map already listed in your own complexity table (Screen 6) but never shown anywhere else. Let the user type an Ambulance ID or Emergency ID into a lookup box; show the computed hash bucket and an O(1) average-case retrieval of that record, versus a toggled "linear scan" mode that visibly steps through an array comparing IDs one at a time. This closes the gap between what your complexity table claims and what the UI actually proves.

### G. Trie visualization (new, minimal)
A compact tree view showing the Trie backing the map's location search bar (Screen 2). As the user types in the search box anywhere in the app, this panel highlights the path being traversed character-by-character and the matching leaf nodes. Complexity: insert/search O(L) where L is the string length, independent of the number of stored locations — a good contrast point against the Hash Map's O(1) average but no-prefix-matching capability.

### H. Traffic Signal Optimization (Greedy + DP) — stretch feature, difficulty ~8/10
This is a self-contained module layered on top of the existing junction nodes. It is deliberately scoped as Phase 4 (see Development priority) — build it only after Phases 1–3 are solid, since it introduces a second optimization loop that can otherwise eat time meant for the core pipeline.

**Concept:** every junction has up to four lane approaches (North/South/East/West). Each lane has a live car queue length (drawn from the same congestion data already generated for roads). The module decides how many seconds of green time each lane gets, using two different algorithms for two different situations:

- **Greedy proportional allocation** — runs continuously (every simulated tick) as a fast, cheap re-balancing of green time:
  ```
  weight(lane) = queueLength(lane) + ambulancePreemptionBoost(lane)
  GreenTime(lane) = minGreen + (cycleTime - numLanes * minGreen) * weight(lane) / sum(weight(all lanes at junction))
  ```
  `ambulancePreemptionBoost(lane)` is a large constant added when an ambulance is en route and approaching the junction from that lane within the next few seconds — this is what gives ambulances signal preemption, as an emergent result of the same formula that gives more green time to more congested lanes, not a separate hack. `minGreen` is a floor (e.g. 8s) so no lane starves. Complexity: O(numLanes) per junction per tick — cheap enough to run continuously, and this is the direct mechanism that gives more weight to more crowded lanes.
- **Dynamic Programming optimization** — triggered by the "OPTIMIZE SIGNALS" button, and computes the *exact* optimal split of one full cycle across phases (a phase is a non-conflicting pair of directions, e.g. North-South vs East-West), rather than the greedy formula's fast approximation. Discretize the cycle into fixed time steps (e.g. 5 seconds). For each phase, define `vehiclesCleared(phase, seconds)` as a concave, diminishing-returns function of how many seconds that phase gets (more green time clears more of the queue, with rapidly shrinking benefit once the queue for that phase is drained). Then:
  ```
  DP[t] = max vehicles cleared using t seconds of total cycle time
  DP[t] = max over each phase p and each valid allocation a (in step increments) of:
            vehiclesCleared(p, a) + DP[t - a]
  ```
  This is structurally the same bounded-allocation pattern as the 0/1 Knapsack already used elsewhere in the project (time budget instead of weight budget, vehicles cleared instead of relief value) — a nice conceptual echo for the viva. Backtrack through the DP table to recover the exact per-phase allocation. Complexity: O(numPhases × (cycleTime/step)²) per junction — noticeably heavier than the greedy pass, which is exactly why it's a manually-triggered "optimize" action rather than something recomputed every tick.
- **Priority Queue reuse** — when the officer optimizes multiple junctions at once (or the system has a limited per-tick compute budget), pull the most congested junction first from a max-heap keyed on total queue length across all its lanes, reusing the same heap structure already built for emergency ranking rather than writing a second implementation.
- **Segment Tree reuse** — store each lane's arrival-rate history in 24 hourly buckets, exactly like the existing road congestion/hazard arrays, and reuse the same Segment Tree implementation to answer "what's the peak arrival rate on this lane between 5–7 PM?" for planning purposes.
- **Graph** — junctions are already `CityNode` entries of type `"junction"`; this module simply attaches a `signalState` and per-lane queue data to those existing nodes rather than introducing a separate graph structure.

**Feeding back into routing:** extend the Road cost formula (see Core logic) with a `signalDelay` term, so an ambulance's route computation already accounts for expected wait time at upcoming junctions — meaning the routing algorithm and the signal-optimization algorithm are genuinely connected, not two unrelated demos bolted together.

**UI reference sketch** (for the junction detail panel opened from the map):
```
INTERSECTION J-04

North: ██████████  82 cars   [Greedy green: 25s]
South: ███          21 cars   [Greedy green:  9s]
East:  ██████       51 cars   [Greedy green: 18s]
West:  ██           13 cars   [Greedy green:  8s]

[ OPTIMIZE SIGNALS ]   <- runs the DP pass, shows the new allocation
                            side-by-side with the greedy one, and the
                            resulting change in each lane's queue length
```
Render this with the app's existing card/pill styling (Recharts or custom SVG bars in the palette's purple/orange tones for algorithm visualization), not literal block characters — the ASCII above is only a layout reference for the coding agent.

Complexity summary for the dashboard: Greedy allocation O(numLanes) per tick, O(numLanes) space; DP optimization O(numPhases × (cycleTime/step)²) time, O(numPhases × cycleTime/step) space.

## Screen 5: Scenarios and Replay

### Scenario 1: Flooded bridge
Bridge closes 3 PM–6 PM; one critical emergency exists on the other side; the initially shortest route becomes invalid; system reroutes; Segment Tree shows hazard spike for affected hours; DSU determines if an alternate connection exists.

### Scenario 2: Hospital surge
Multiple simultaneous emergencies; limited ambulances; one ambulance is ALS-only; priority queue ranks cases; allocation system shows why each ambulance was selected.

### Scenario 3: Supply shortage
Several zones request medicine/food/water; one relief vehicle has limited capacity; Knapsack chooses the best bundle; fairness slider visibly affects allocation priority.

### Deterministic expected outputs (new — for grading/verification)
Because seeded data must be deterministic, define and document the exact expected result for each scenario so a faculty member (or the coding agent, via tests) can verify correctness at a glance:

| Scenario | Expected top-priority emergency | Expected assigned ambulance | Expected route behavior |
|---|---|---|---|
| 1: Flooded bridge | The critical emergency across the bridge | The nearest ALS/BLS-matching ambulance with a feasible alternate route | Route recalculates away from the closed bridge; if no alternate exists, zone is marked isolated via DSU |
| 2: Hospital surge | Highest severity × affected-people combination | ALS ambulance reserved for the case requiring ALS; others assigned by suitability score | All ambulances dispatched in suitability-ranked order; lowest-suitability case waits or is marked unreachable if none available |
| 3: Supply shortage | N/A (resource allocation, not routing) | N/A | Knapsack selects the value-maximizing bundle under capacity; changing the fairness slider shifts allocation toward isolated/underserved zones |

Replay requirements: ordered event list; pause/resume/step/reset/replay; timeline of events; optional variable playback speed.

## Screen 6: Complexity Dashboard

| Component | Algorithm / Structure | Time Complexity | Space Complexity | Purpose |
|---|---|---|---|---|
| Emergency ranking | Max-Heap Priority Queue | Insert/Extract: O(log n) | O(n) | Select urgent incidents |
| Safe route | A* / Dijkstra + heap | O((V+E) log V) | O(V) | Compute safe route |
| Road risk over time | Segment Tree | Query/Update: O(log n) | O(n) | Time-aware hazard data |
| Connectivity | DSU / Union-Find | O(α(V)) amortized | O(V) | Detect isolated locations |
| Resource loading | 0/1 Knapsack | O(nW) | O(nW) | Select supplies under capacity |
| Emergency/ambulance records | Hash Map | Average O(1) lookup | O(n) | Fast state lookup |
| Location search | Trie | O(L) insert/search | O(total characters) | Prefix-based location autocomplete |
| Signal green-time (continuous) | Greedy proportional allocation | O(numLanes) per tick | O(numLanes) | Give more green time to more congested/priority lanes |
| Signal green-time (optimize action) | Dynamic Programming | O(numPhases × (cycleTime/step)²) | O(numPhases × cycleTime/step) | Compute the exact optimal per-phase split for one cycle |

Also show live operational metrics: nodes explored, edges examined, current heap size, priority-queue ops, Segment Tree nodes visited, route cost, estimated travel time, simulation time, active/resolved incidents, Race Mode node-count comparison.

## Core logic and formulas

### Emergency priority
```
Priority(z) =
  0.45 * severity +
  0.25 * normalizedAffectedPeople +
  0.15 * normalizedWaitingTime +
  0.15 * isolationScore
```
All inputs normalized 0–100. Max-heap: higher score processed first.

### Road cost
```
RoadCost(e, t) =
  baseTravelTime(e)
  + alpha * congestion(e, t)
  + beta * hazard(e, t)
  + gamma * signalDelay(e, t)
  + closurePenalty(e, t)
```
alpha/beta/gamma adjustable in settings; closed roads = Infinity cost and excluded; hazardous-not-closed roads get a high penalty; use current simulation time to select the relevant slot; for a travel interval, query max hazard or average congestion via Segment Tree. `signalDelay(e, t)` (stretch feature) is the expected wait time at the junction road `e` leads into, based on that junction's current green-time allocation for the incoming lane — if the Traffic Signal Optimization module (Screen 4, section H) isn't built, this term is simply omitted/zero.

### Ambulance suitability
```
AmbulanceScore(a, z) =
  0.35 * routeSafety +
  0.30 * inverseETA +
  0.20 * capabilityMatch +
  0.10 * equipmentMatch +
  0.05 * fuelScore
```
Capability match = 0 if ambulance type insufficient; unavailable ambulances excluded; unreachable ambulances (due to closures) marked as such with explicit reasons.

### Fairness score
Slider 0 (speed-first) to 100 (fairness-first). Higher values increase weight on waiting time and isolation, avoid repeatedly serving only easy-to-reach zones, and visibly show which allocation changed and why.

## Animation requirements
Animations must reinforce algorithmic logic, not just decorate.

General: speed controls (0.5x/1x/2x/4x); pause/resume/step/reset where applicable; respect prefers-reduced-motion; no excessive flashing; CSS transforms/opacity for UI; SVG path animation for routes; requestAnimationFrame/Web Animations API for ambulance movement; keep data/state logic separate from animation state; deterministic output for a seeded scenario.

**Ambulance movement:** draw selected route in bright blue; animate icon segment-by-segment; tooltip shows ambulance ID, current road, ETA, speed; status cycle (available → assigned → en route → at incident → transporting → at hospital → returning → available); on closure mid-transit: pause briefly, alert "Road closure detected," animate recomputation, fade invalid remainder, draw new route, continue. Use simulated travel time, not real-world time.

Implementation approach: represent each edge as an SVG path/line; convert route edges into ordered segments; interpolate icon position per segment; requestAnimationFrame for frame updates; position from elapsed time × speed multiplier; logical state in React state, movement timing in an animation controller. The ambulance icon itself uses the isometric "3D-style map icon" described in Screen 2 — apply the direction-facing flip and the CSS tilt/lift transforms on top of this position interpolation, not as a separate animation system.

**Graph algorithm animation:** step-by-step for A*/Dijkstra (and synchronized for Race Mode); frontier nodes cyan/purple, finalized nodes muted blue, relaxed edges glow briefly; show dist (Dijkstra) or g/h/f (A*) near nodes; animate PQ extraction; on completion highlight final path, fade non-selected edges, show route summary card. Controls: Start, Pause, Next Step, Previous Step (if practical), Reset, Speed, Compare A* vs Dijkstra / Race Mode toggle.

**Priority queue animation:** heap as tree or array; insertion appears at bottom with heapify-up swap animation; dispatch highlights root, animates extraction, moves last node to root, animates heapify-down; brief score calculation display before insertion; event log ("E-04 inserted with priority 87.5", "E-04 swapped with E-02", "E-04 extracted for dispatch").

**Segment Tree animation:** SVG/DOM binary tree, node label format "[0–23], max=95"; query highlights no-overlap gray / partial yellow / full-overlap purple with visible combination of results; point update highlights leaf and animates propagation to root; lazy range update shows a small "lazy +40" badge, pushed down only when needed; allow zoom/collapse to keep it readable.

**Road closure/hazard animation:** closure turns road red with barrier/X and a short ripple at the incident location, logged to timeline; traffic increase transitions green→yellow→orange→red with optional thickness increase; hazard overlays a semi-transparent ripple/striped pattern and updates the Segment Tree timeline; rerouting fades the old route to dashed red while the new route draws progressively in bright blue.

**Dashboard microinteractions:** critical count changes animate softly; new incident cards slide into the queue; priority rank changes animate position movement; metrics count up smoothly but not excessively; tooltips explain every icon/color.

### Guided Tour Mode (new)
On first load (and via a "Take the tour" button thereafter), run a short overlay walkthrough: a semi-transparent mask with a spotlight on each major panel in turn (Control Center → Map → Race Mode toggle → Segment Tree → DSU → Knapsack → Complexity Dashboard), each with one sentence of plain-English explanation of what data structure/algorithm it demonstrates and why. This is the single cheapest addition for viva impact — it means a faculty member never has to ask "wait, what am I looking at."

## Data model
```ts
type NodeType = "hospital" | "junction" | "emergencyZone" | "shelter" | "depot";

type AmbulanceStatus =
  | "available" | "assigned" | "enRoute" | "atIncident"
  | "transporting" | "returning" | "unavailable";

type RoadStatus = "open" | "congested" | "hazardous" | "closed";

type EmergencyStatus =
  | "waiting" | "assigned" | "enRoute" | "resolved" | "unreachable";

interface CityNode {
  id: string; label: string; type: NodeType; x: number; y: number; capacity?: number;
}

interface Road {
  id: string; from: string; to: string; distanceKm: number; baseTravelTimeMin: number;
  status: RoadStatus; trafficByHour: number[]; hazardByHour: number[]; isBidirectional: boolean;
}

interface Ambulance {
  id: string; locationNodeId: string; status: AmbulanceStatus; type: "BLS" | "ALS";
  equipment: string[]; capacity: number; fuelPercent: number;
  currentEmergencyId?: string; routeNodeIds?: string[]; etaMinutes?: number;
}

interface Emergency {
  id: string; nodeId: string; severity: number; affectedPeople: number; waitingMinutes: number;
  requiredAmbulanceType: "BLS" | "ALS"; requiredEquipment: string[]; status: EmergencyStatus;
  priorityScore: number; createdAtSimulationMinute: number;
}

interface SupplyItem {
  id: string; name: string; availableQuantity: number; weightKg: number;
  reliefValue: number; category: "medicine" | "food" | "water" | "shelter";
}

interface DisasterEvent {
  id: string; timestampSimulationMinute: number;
  type: "roadClosure" | "hazardIncrease" | "trafficIncrease" | "newEmergency" | "supplyUpdate";
  targetId: string; details: string;
}
```

## Required seeded data
Fictional city "Navapur" with 15 nodes (2 hospitals, 1 supply depot, 2 shelters, 5 emergency zones, 5 junctions), 25 roads, 4 ambulances (2 BLS, 2 ALS), 5 initial emergencies. At least one route where shortest ≠ safest; at least one road closure that forces rerouting; 24 hourly traffic/hazard values per road; at least one isolated zone after a defined closure event.

## Functional requirements
FR-1 through FR-15 as originally specified (scenario control, emergency creation, priority queue, dispatch, ambulance suitability, route computation excluding closed roads, time-based cost, Segment Tree range query/update, closure-triggered recalculation, ambulance animation, decision explanations, DSU connectivity, Knapsack allocation, complexity/metrics display), plus:

FR-16: The app must implement a Trie-backed location search with visible traversal.
FR-17: The app must implement a Hash Map lookup panel contrasted against a linear-scan toggle.
FR-18: The app must support Race Mode running Dijkstra and A* simultaneously with comparative live metrics.
FR-19: The app must support manual override of the system's ambulance/route choice, with a counterfactual comparison shown afterward.
FR-20: The app must include a first-run Guided Tour overlay explaining each panel.
FR-21 (stretch): The app must render per-junction lane queue lengths and current signal state on the map and in a junction detail drawer.
FR-22 (stretch): The app must continuously allocate green time per lane using the Greedy proportional formula, weighted by queue length and boosted for a lane with an approaching ambulance (preemption).
FR-23 (stretch): The app must provide an "OPTIMIZE SIGNALS" action that computes the exact optimal per-phase green-time split for one cycle using Dynamic Programming, and display it alongside the current greedy allocation.
FR-24 (stretch): The Road cost formula must be able to incorporate a signal-delay term derived from the signal optimization module, when that module is present.

## Non-functional requirements
Responsive desktop-first UI usable on laptop screens; no mandatory auth; local seeded data only; smooth animation at normal desktop performance; no UI freezes during algorithm animation; deterministic sample data; modular/readable code; comments only for non-obvious algorithm logic; accessible labels, sufficient contrast, keyboard-friendly buttons; every result clearly labeled as a simulation.

## Testing and verification (new)
- Unit-test every algorithm/data structure in isolation with Vitest: heap insert/extract ordering, Dijkstra/A* shortest-path correctness on a small known graph, Segment Tree range max and point update correctness (including lazy propagation if implemented), DSU union/find/isolation detection correctness, Knapsack optimal value on a small known instance, Trie insert/search/prefix correctness, Hash Map basic get/set correctness.
- For each of the three seeded scenarios, assert the deterministic expected outputs table above holds (can be a lightweight integration test or simply manually verified and documented for the demo).
- These tests double as evidence for the "Demo/Implementation" grading criterion — a coding agent finishing each module should also finish its test file before moving on.
- (Stretch) If the Traffic Signal Optimization module is built: unit-test the Greedy allocator on a small fixed set of queue lengths (verify proportionality and the min-green floor), and the DP optimizer against a small hand-computable instance (verify it matches the brute-force best allocation for a tiny cycle/phase count).

## Development priority

### Phase 1: Must build first
React layout and navigation; seeded city SVG graph; emergency creation; priority score; max-heap priority queue; ambulance list and basic suitability selection; Dijkstra or A* route finder; road closure button; decision explanation panel; basic route and ambulance animation; Trie-backed location search (cheap, do it early).

### Phase 2: Advanced DAA
Segment Tree implementation + visualizer; hourly traffic/hazard timeline; time-aware route cost; A* vs Dijkstra comparison; Race Mode; Hash Map lookup panel; complexity dashboard.

### Phase 3: Extra scoring features
DSU connectivity visualization; Knapsack supply allocation; fairness slider; scenario replay; full event timeline; lazy propagation for range updates; manual override + counterfactual mode; Guided Tour overlay.

### Phase 4: Traffic Signal Optimization (stretch, difficulty ~8/10)
Only attempt once Phases 1–3 are complete and stable, since this is the single hardest feature in the project and risks the core deliverable if started too early. Build order within this phase: junction lane queue data model → Greedy proportional allocator + visualization → junction detail drawer on the map → ambulance preemption boost → DP optimizer + "OPTIMIZE SIGNALS" action → signalDelay feedback into Road cost. If time runs out partway through, stop after the Greedy allocator and preemption — that alone is a strong, demonstrable addition even without the DP layer.

## Acceptance criteria
The project is complete when a faculty member can, without reading source code:
1. Open a scenario and see emergencies ranked in a priority queue.
2. Select or create a critical emergency and watch the system choose an eligible ambulance, seeing why others were rejected.
3. Watch A* or Dijkstra choose and animate a route, and optionally watch Race Mode contrast the two.
4. Close a road or trigger a flood, see traffic/hazard values update via the Segment Tree visualization, and watch the route recompute with a clear explanation.
5. Override a decision and see the counterfactual cost of that choice.
6. Search for a location via the Trie-backed search bar and look up a record via the Hash Map panel.
7. View time/space complexity for every data structure and algorithm used, and run a resource-allocation example via Knapsack.
8. Complete the Guided Tour and understand what every panel demonstrates.
9. (If Phase 4 is built) Open a congested junction, see its per-lane queues and Greedy-allocated green times, watch an approaching ambulance trigger preemption, then press "OPTIMIZE SIGNALS" and see the DP-computed allocation shown against the greedy one.

## Suggested final viva pitch
"CrisisRelief is an educational disaster-response simulator that integrates seven DAA concepts into one decision pipeline. It ranks emergency incidents using a max-heap priority queue, selects suitable ambulances using capability and safe ETA, queries time-based road hazards through a Segment Tree, finds safe routes with A* or Dijkstra — visibly racing the two so the value of the heuristic is directly observable — detects isolated zones using DSU, allocates limited relief supplies using 0/1 Knapsack, and offers Trie-based location search and Hash Map record lookup. When roads close or hazards change, the application dynamically explains how and why its allocation and routing decisions change, and even lets the officer override the algorithm to see, quantitatively, what that choice would have cost. As a stretch goal, it also optimizes the traffic signals themselves — a Greedy allocator continuously favors more congested lanes and preempts for approaching ambulances, while a Dynamic Programming pass computes the exact optimal green-time split on demand — closing the loop between how ambulances are routed and the infrastructure they route through."

---

## Implementation guide for the coding agent (Antigravity)

**Read this before writing code.**

1. **Build strictly in the phase order above.** Do not start Phase 2 features until every Phase 1 item has a working UI and passes its Vitest suite. Do not start any backend work — this project is frontend-only with local seeded JSON.
2. **Folder structure (suggested):**
   ```
   src/
     algorithms/        # dijkstra.ts, aStar.ts, heap.ts, segmentTree.ts, dsu.ts, knapsack.ts, trie.ts, hashMap.ts
     algorithms/__tests__/   # one test file per algorithm above
     data/              # seedCity.ts, scenarios.ts
     state/             # zustand store or context
     components/
       ControlCenter/
       CityMap/
       ResourceAllocation/
       AlgorithmsLab/
       ScenariosReplay/
       ComplexityDashboard/
       GuidedTour/
     types/             # the data model interfaces
   ```
3. **Never implement an algorithm's animation before its logic has a passing unit test.** The visual layer should read from a pure, tested function's output — do not intermix animation timing code with algorithm logic (this is already required above; treat it as non-negotiable).
4. **Keep all algorithms as pure, dependency-free TypeScript functions** (no external algorithm/graph libraries) so their complexity and correctness are easy to inspect and grade.
5. **When in doubt about a visual detail not fully specified here, prioritize clarity and explainability over polish** — a plain but correct and clearly-labeled visualization beats an impressive-looking but confusing one for this grading rubric (Novel Idea / Demo-Implementation / Complexity Analysis).
6. **Do not add real map APIs, real backend services, or user authentication** under any circumstances — this is explicitly out of scope and would only add risk.
6a. **Do not add Three.js, WebGL, or any 3D rendering engine.** All "3D" visuals (buildings, ambulance icons) are flat SVG authored at a fixed isometric angle with CSS transforms/shadows for depth, per the "3D-style map icons" section under Screen 2. This keeps the bundle light and avoids a whole rendering subsystem that has nothing to do with the DAA grading criteria.
7. **After each phase, run the full Vitest suite and confirm the three seeded scenarios still match the deterministic expected-outputs table** before proceeding to the next phase.
8. **Treat Phase 4 (Traffic Signal Optimization) as strictly time-boxed and optional.** It is the hardest single feature in this PRD (difficulty ~8/10) and is not required for the core acceptance criteria (items 1–8). If it isn't finished, stop cleanly after whichever of its sub-steps is complete (ideally at least the Greedy allocator) rather than leaving it half-wired into the routing pipeline in a way that could destabilize the already-working Phase 1–3 features.
