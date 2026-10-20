import type { SupplyItem } from '../types';

export interface KnapsackResult {
  maxValue: number;
  selectedItems: SupplyItem[];
}

export function solveKnapsack(items: SupplyItem[], capacity: number): KnapsackResult {
  const n = items.length;
  
  // Scale weights to integers (multiply by 10 to handle one decimal place like 0.5kg)
  const scaleFactor = 10;
  const scaledCapacity = Math.round(capacity * scaleFactor);
  
  // Create DP table: dp[i][w] where w is in scaled units
  const dp: number[][] = Array(n + 1).fill(0).map(() => Array(scaledCapacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    const scaledWeight = Math.round(item.weightKg * scaleFactor);
    for (let w = 0; w <= scaledCapacity; w++) {
      if (scaledWeight <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - scaledWeight] + item.reliefValue
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Backtrack to find selected items
  const selectedItems: SupplyItem[] = [];
  let w = scaledCapacity;
  for (let i = n; i > 0 && w > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedItems.push(items[i - 1]);
      w -= Math.round(items[i - 1].weightKg * scaleFactor);
    }
  }

  return {
    maxValue: dp[n][scaledCapacity],
    selectedItems
  };
}
