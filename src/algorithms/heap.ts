export interface HeapNode<T> {
  item: T;
  priority: number;
}

export class MaxHeap<T> {
  public heap: HeapNode<T>[] = [];

  constructor() {}

  public insert(item: T, priority: number): void {
    const node: HeapNode<T> = { item, priority };
    this.heap.push(node);
    this.heapifyUp(this.heap.length - 1);
  }

  public extractMax(): HeapNode<T> | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;

    const max = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.heapifyDown(0);
    return max;
  }

  public peek(): HeapNode<T> | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  private heapifyUp(index: number): void {
    let currentIndex = index;
    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);
      if (this.heap[currentIndex].priority > this.heap[parentIndex].priority) {
        this.swap(currentIndex, parentIndex);
        currentIndex = parentIndex;
      } else {
        break;
      }
    }
  }

  private heapifyDown(index: number): void {
    let currentIndex = index;
    const length = this.heap.length;

    while (true) {
      let leftChildIndex = 2 * currentIndex + 1;
      let rightChildIndex = 2 * currentIndex + 2;
      let largestIndex = currentIndex;

      if (leftChildIndex < length && this.heap[leftChildIndex].priority > this.heap[largestIndex].priority) {
        largestIndex = leftChildIndex;
      }

      if (rightChildIndex < length && this.heap[rightChildIndex].priority > this.heap[largestIndex].priority) {
        largestIndex = rightChildIndex;
      }

      if (largestIndex !== currentIndex) {
        this.swap(currentIndex, largestIndex);
        currentIndex = largestIndex;
      } else {
        break;
      }
    }
  }

  private swap(index1: number, index2: number): void {
    const temp = this.heap[index1];
    this.heap[index1] = this.heap[index2];
    this.heap[index2] = temp;
  }

  public size(): number {
    return this.heap.length;
  }
}
