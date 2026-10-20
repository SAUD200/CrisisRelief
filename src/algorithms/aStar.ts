import type { CityNode, Road } from '../types';
import { MinHeap } from './minHeap';
import type { RouteResult } from './dijkstra';

// Heuristic function: Straight-line distance between two nodes
function getHeuristic(nodeA: CityNode, nodeB: CityNode): number {
  const dx = nodeA.x - nodeB.x;
  const dy = nodeA.y - nodeB.y;
  return Math.sqrt(dx * dx + dy * dy) * 0.01; // scaling factor to roughly match travel time
}

export function aStar(
  startNodeId: string,
  endNodeId: string,
  nodes: CityNode[],
  roads: Road[],
  timeHour: number
): RouteResult | null {
  const endNode = nodes.find(n => n.id === endNodeId);
  if (!endNode) return null;

  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const pq = new MinHeap<string>();
  let nodesExplored = 0;

  nodes.forEach(node => {
    gScore[node.id] = Infinity;
    fScore[node.id] = Infinity;
    previous[node.id] = null;
  });

  const startNode = nodes.find(n => n.id === startNodeId);
  if (!startNode) return null;

  gScore[startNodeId] = 0;
  fScore[startNodeId] = getHeuristic(startNode, endNode);
  pq.insert(startNodeId, fScore[startNodeId]);

  while (!pq.isEmpty()) {
    const current = pq.extractMin();
    if (!current) break;
    const currentNodeId = current.item;
    nodesExplored++;

    if (currentNodeId === endNodeId) {
      break;
    }

    // Find neighbors
    const connectingRoads = roads.filter(r => 
      (r.from === currentNodeId || (r.to === currentNodeId && r.isBidirectional)) &&
      r.status !== 'closed'
    );

    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (!currentNode) continue;

    for (const road of connectingRoads) {
      const neighborId = road.from === currentNodeId ? road.to : road.from;
      const neighborNode = nodes.find(n => n.id === neighborId);
      if (!neighborNode) continue;
      
      const traffic = road.trafficByHour[timeHour] || 0;
      const hazard = road.hazardByHour[timeHour] || 0;
      const cost = road.baseTravelTimeMin + (traffic * 0.1) + (hazard * 0.2);
      
      const tentativeGScore = gScore[currentNodeId] + cost;

      if (tentativeGScore < gScore[neighborId]) {
        previous[neighborId] = currentNodeId;
        gScore[neighborId] = tentativeGScore;
        fScore[neighborId] = tentativeGScore + getHeuristic(neighborNode, endNode);
        
        pq.insert(neighborId, fScore[neighborId]);
      }
    }
  }

  if (gScore[endNodeId] === Infinity) {
    return null;
  }

  const path: string[] = [];
  let curr: string | null = endNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return {
    path,
    totalCost: gScore[endNodeId],
    nodesExplored
  };
}
