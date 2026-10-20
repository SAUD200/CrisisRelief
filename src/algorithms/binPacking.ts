import type { SupplyItem } from '../types';

export interface PackedBin {
  binId: number;
  ambulanceId?: string;
  items: { item: SupplyItem; quantity: number; totalWeight: number; totalValue: number }[];
  currentWeight: number;
  maxCapacity: number;
  utilizationPercent: number;
}

export interface BinPackingResult {
  bins: PackedBin[];
  totalWeight: number;
  totalValue: number;
  totalItemsCount: number;
  minAmbulancesRequired: number;
  theoreticalLowerBound: number;
  efficiencyPercent: number;
}

/**
 * Bin Packing Algorithm using First-Fit Decreasing (FFD)
 * Solves the problem of accommodating relief supplies exceeding a single vehicle's capacity
 * into the minimum possible number of ambulances.
 * 
 * Theoretical guarantee: FFD uses at most 11/9 * OPT + 1 bins.
 */
export function solveBinPackingFFD(
  requestedSupplies: { item: SupplyItem; count: number }[],
  vehicleCapacityKg: number
): BinPackingResult {
  if (vehicleCapacityKg <= 0) {
    return {
      bins: [],
      totalWeight: 0,
      totalValue: 0,
      totalItemsCount: 0,
      minAmbulancesRequired: 0,
      theoreticalLowerBound: 0,
      efficiencyPercent: 0,
    };
  }

  // 1. Flatten requested items into individual units
  interface UnitItem {
    item: SupplyItem;
    unitWeight: number;
    unitValue: number;
  }

  const individualUnits: UnitItem[] = [];
  let totalWeight = 0;
  let totalValue = 0;
  let totalItemsCount = 0;

  requestedSupplies.forEach(({ item, count }) => {
    for (let i = 0; i < count; i++) {
      individualUnits.push({
        item,
        unitWeight: item.weightKg,
        unitValue: item.reliefValue,
      });
      totalWeight += item.weightKg;
      totalValue += item.reliefValue;
      totalItemsCount++;
    }
  });

  // 2. Sort units in descending order of weight (Decreasing strategy)
  individualUnits.sort((a, b) => b.unitWeight - a.unitWeight);

  // 3. First-Fit Decreasing packing
  const bins: PackedBin[] = [];

  for (const unit of individualUnits) {
    // Find the first bin that can accommodate this unit
    let placed = false;
    for (const bin of bins) {
      if (bin.currentWeight + unit.unitWeight <= bin.maxCapacity + 0.001) {
        bin.currentWeight = Number((bin.currentWeight + unit.unitWeight).toFixed(2));
        
        // Group identical items in the bin for clean presentation
        const existingGroup = bin.items.find(g => g.item.id === unit.item.id);
        if (existingGroup) {
          existingGroup.quantity++;
          existingGroup.totalWeight = Number((existingGroup.totalWeight + unit.unitWeight).toFixed(2));
          existingGroup.totalValue += unit.unitValue;
        } else {
          bin.items.push({
            item: unit.item,
            quantity: 1,
            totalWeight: unit.unitWeight,
            totalValue: unit.unitValue,
          });
        }

        bin.utilizationPercent = Math.min(100, Math.round((bin.currentWeight / bin.maxCapacity) * 100));
        placed = true;
        break;
      }
    }

    // If no existing bin can fit it, spawn a new bin (ambulance)
    if (!placed) {
      const newBin: PackedBin = {
        binId: bins.length + 1,
        items: [{
          item: unit.item,
          quantity: 1,
          totalWeight: unit.unitWeight,
          totalValue: unit.unitValue,
        }],
        currentWeight: unit.unitWeight,
        maxCapacity: vehicleCapacityKg,
        utilizationPercent: Math.min(100, Math.round((unit.unitWeight / vehicleCapacityKg) * 100)),
      };
      bins.push(newBin);
    }
  }

  const theoreticalLowerBound = Math.ceil(totalWeight / vehicleCapacityKg);
  const totalCapacityUsed = bins.length * vehicleCapacityKg;
  const efficiencyPercent = totalCapacityUsed > 0 ? Math.round((totalWeight / totalCapacityUsed) * 100) : 0;

  return {
    bins,
    totalWeight: Number(totalWeight.toFixed(2)),
    totalValue,
    totalItemsCount,
    minAmbulancesRequired: bins.length,
    theoreticalLowerBound,
    efficiencyPercent,
  };
}
