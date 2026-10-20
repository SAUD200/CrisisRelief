import type { CityNode, Road } from '../types';

export class DSU {
  private parent: Record<string, string> = {};
  private rank: Record<string, number> = {};

  constructor(nodes: CityNode[]) {
    for (const node of nodes) {
      this.parent[node.id] = node.id;
      this.rank[node.id] = 0;
    }
  }

  public find(i: string): string {
    if (this.parent[i] !== i) {
      this.parent[i] = this.find(this.parent[i]); // Path compression
    }
    return this.parent[i];
  }

  public union(i: string, j: string): void {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    if (rootI !== rootJ) {
      // Union by rank
      if (this.rank[rootI] < this.rank[rootJ]) {
        this.parent[rootI] = rootJ;
      } else if (this.rank[rootI] > this.rank[rootJ]) {
        this.parent[rootJ] = rootI;
      } else {
        this.parent[rootJ] = rootI;
        this.rank[rootI]++;
      }
    }
  }

  public buildFromRoads(roads: Road[]): void {
    const openRoads = roads.filter(r => r.status !== 'closed');
    for (const road of openRoads) {
      this.union(road.from, road.to);
    }
  }

  public getConnectedComponents(nodes: CityNode[]): Record<string, string[]> {
    const components: Record<string, string[]> = {};
    for (const node of nodes) {
      const root = this.find(node.id);
      if (!components[root]) {
        components[root] = [];
      }
      components[root].push(node.id);
    }
    return components;
  }
}
