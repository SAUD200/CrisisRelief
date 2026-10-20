class TrieNode {
  children: Record<string, TrieNode> = {};
  isEndOfWord: boolean = false;
  metadata: any = null;
}

export class Trie {
  public root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string, metadata?: any): void {
    let current = this.root;
    for (const char of word.toLowerCase()) {
      if (!current.children[char]) {
        current.children[char] = new TrieNode();
      }
      current = current.children[char];
    }
    current.isEndOfWord = true;
    current.metadata = metadata;
  }

  searchPrefix(prefix: string): any[] {
    let current = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!current.children[char]) {
        return [];
      }
      current = current.children[char];
    }
    
    // Perform DFS to get all words from this node
    const results: any[] = [];
    this.collectAll(current, results);
    return results;
  }

  private collectAll(node: TrieNode, results: any[]): void {
    if (node.isEndOfWord && node.metadata) {
      results.push(node.metadata);
    }
    for (const child in node.children) {
      this.collectAll(node.children[child], results);
    }
  }
}
