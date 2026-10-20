export class HashMap<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private capacity: number;
  private size: number;

  constructor(capacity = 16) {
    this.capacity = capacity;
    this.buckets = new Array(capacity).fill(null).map(() => []);
    this.size = 0;
  }

  // Simple string hash function
  public hash(key: K): number {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % this.capacity;
  }

  public set(key: K, value: V): void {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value;
        return;
      }
    }

    bucket.push([key, value]);
    this.size++;
    // Omitted resizing logic for simplicity of demonstration
  }

  public get(key: K): { value: V | undefined, bucketIndex: number, comparisons: number } {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    let comparisons = 0;

    for (let i = 0; i < bucket.length; i++) {
      comparisons++;
      if (bucket[i][0] === key) {
        return { value: bucket[i][1], bucketIndex: index, comparisons };
      }
    }
    return { value: undefined, bucketIndex: index, comparisons };
  }
}
