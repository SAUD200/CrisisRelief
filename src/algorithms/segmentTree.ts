export class SegmentTree {
  private tree: number[];
  private n: number;

  constructor(data: number[]) {
    this.n = data.length;
    this.tree = new Array(4 * this.n).fill(0);
    this.build(data, 0, 0, this.n - 1);
  }

  private build(data: number[], node: number, start: number, end: number): void {
    if (start === end) {
      this.tree[node] = data[start];
    } else {
      const mid = Math.floor((start + end) / 2);
      const leftChild = 2 * node + 1;
      const rightChild = 2 * node + 2;

      this.build(data, leftChild, start, mid);
      this.build(data, rightChild, mid + 1, end);

      this.tree[node] = Math.max(this.tree[leftChild], this.tree[rightChild]);
    }
  }

  public query(l: number, r: number): number {
    return this.queryRange(0, 0, this.n - 1, l, r);
  }

  private queryRange(node: number, start: number, end: number, l: number, r: number): number {
    if (r < start || end < l) {
      return -Infinity;
    }
    if (l <= start && end <= r) {
      return this.tree[node];
    }

    const mid = Math.floor((start + end) / 2);
    const leftChild = 2 * node + 1;
    const rightChild = 2 * node + 2;

    const leftMax = this.queryRange(leftChild, start, mid, l, r);
    const rightMax = this.queryRange(rightChild, mid + 1, end, l, r);

    return Math.max(leftMax, rightMax);
  }

  public update(index: number, value: number): void {
    this.updatePoint(0, 0, this.n - 1, index, value);
  }

  private updatePoint(node: number, start: number, end: number, idx: number, val: number): void {
    if (start === end) {
      this.tree[node] = val;
    } else {
      const mid = Math.floor((start + end) / 2);
      const leftChild = 2 * node + 1;
      const rightChild = 2 * node + 2;

      if (start <= idx && idx <= mid) {
        this.updatePoint(leftChild, start, mid, idx, val);
      } else {
        this.updatePoint(rightChild, mid + 1, end, idx, val);
      }

      this.tree[node] = Math.max(this.tree[leftChild], this.tree[rightChild]);
    }
  }

  public getTreeData(): number[] {
    // Return only the meaningful portion of the internal tree array.
    // The segment tree for n leaves needs at most 2 * nextPow2(n) - 1 internal nodes.
    let nextPow2 = 1;
    while (nextPow2 < this.n) nextPow2 *= 2;
    const meaningfulSize = 2 * nextPow2 - 1;
    return this.tree.slice(0, meaningfulSize);
  }
}
