import type { CityNode, Road } from '../types';
import { MinHeap } from './minHeap';

export interface RouteResult {
  path: string[]; // array of node IDs
  totalCost: number;
  nodesExplored: number;
}

export function dijkstra(
  startNodeId: string,
  endNodeId: string,
  nodes: CityNode[],
  roads: Road[],
  timeHour: number
): RouteResult | null {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const pq = new MinHeap<string>();
  let nodesExplored = 0;

  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });

  distances[startNodeId] = 0;
  pq.insert(startNodeId, 0);

  while (!pq.isEmpty()) {
    const current = pq.extractMin();
    if (!current) break;
    const currentNodeId = current.item;
    nodesExplored++;

    if (currentNodeId === endNodeId) {
      break; // Found shortest path
    }

    if (current.priority > distances[currentNodeId]) continue; // Stale entry

    // Find neighbors
    const connectingRoads = roads.filter(r => 
      (r.from === currentNodeId || (r.to === currentNodeId && r.isBidirectional)) &&
      r.status !== 'closed'
    );

    for (const road of connectingRoads) {
      const neighborId = road.from === currentNodeId ? road.to : road.from;
      
      // Compute cost
      // Cost = base time + traffic penalty + hazard penalty
      const traffic = road.trafficByHour[timeHour] || 0;
      const hazard = road.hazardByHour[timeHour] || 0;
      
      // simple formula
      const cost = road.baseTravelTimeMin + (traffic * 0.1) + (hazard * 0.2);
      const newDist = distances[currentNodeId] + cost;

      if (newDist < distances[neighborId]) {
        distances[neighborId] = newDist;
        previous[neighborId] = currentNodeId;
        pq.insert(neighborId, newDist);
      }
    }
  }

  // Reconstruct path
  if (distances[endNodeId] === Infinity) {
    return null; // No path found
  }

  const path: string[] = [];
  let curr: string | null = endNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return {
    path,
    totalCost: distances[endNodeId],
    nodesExplored
  };
}
