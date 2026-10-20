export interface LaneState {
  id: string;
  direction: 'North' | 'South' | 'East' | 'West';
  queueLength: number;
}

export interface Phase {
  id: string; // e.g., 'North-South'
  lanes: LaneState[];
}

export function greedySignalAllocation(
  lanes: LaneState[],
  cycleTime: number = 60,
  minGreen: number = 8
): Record<string, number> {
  const allocation: Record<string, number> = {};
  let totalWeight = 0;
  
  // Calculate weights based on queue lengths
  const weights: Record<string, number> = {};
  lanes.forEach(lane => {
    // Add ambulance preemption boost here (mocked for demo as small random boost if needed, but normally driven by ambulance position)
    const boost = 0; 
    weights[lane.direction] = lane.queueLength + boost;
    totalWeight += weights[lane.direction];
  });

  if (totalWeight === 0) {
    lanes.forEach(lane => {
      allocation[lane.direction] = Math.floor(cycleTime / lanes.length);
    });
    return allocation;
  }

  // Allocate proportional time above minGreen
  const availableTime = cycleTime - (lanes.length * minGreen);
  lanes.forEach(lane => {
    allocation[lane.direction] = minGreen + Math.floor(availableTime * (weights[lane.direction] / totalWeight));
  });

  return allocation;
}

export function optimizeSignalsDP(
  phases: Phase[],
  cycleTime: number = 60,
  stepSize: number = 5
): Record<string, number> {
  const nPhases = phases.length;
  const maxSteps = Math.floor(cycleTime / stepSize);
  
  // dp[i][t] = max vehicles cleared using first i phases with t total steps
  const dp: number[][] = Array(nPhases + 1).fill(0).map(() => Array(maxSteps + 1).fill(0));
  // Keep track of decisions to reconstruct allocation
  const choice: number[][] = Array(nPhases + 1).fill(0).map(() => Array(maxSteps + 1).fill(0));

  // Diminishing returns function for clearing vehicles based on green time steps allocated
  const vehiclesCleared = (phase: Phase, steps: number) => {
    const totalQueue = phase.lanes.reduce((sum, lane) => sum + lane.queueLength, 0);
    const seconds = steps * stepSize;
    // Mock diminishing returns: clears fast initially, then slows down. Cannot clear more than queue.
    const cleared = Math.min(totalQueue, (seconds * 2.5) * (1 - (seconds / (cycleTime * 1.5))));
    return Math.max(0, cleared);
  };

  for (let i = 1; i <= nPhases; i++) {
    for (let t = 0; t <= maxSteps; t++) {
      // Try allocating `a` steps to phase `i`
      for (let a = 0; a <= t; a++) {
        const cleared = vehiclesCleared(phases[i - 1], a);
        const totalCleared = cleared + dp[i - 1][t - a];
        
        if (totalCleared > dp[i][t]) {
          dp[i][t] = totalCleared;
          choice[i][t] = a;
        }
      }
    }
  }

  // Reconstruct optimal allocation
  const allocation: Record<string, number> = {};
  let remainingSteps = maxSteps;
  
  for (let i = nPhases; i > 0; i--) {
    const allocatedSteps = choice[i][remainingSteps];
    allocation[phases[i - 1].id] = allocatedSteps * stepSize;
    remainingSteps -= allocatedSteps;
  }

  return allocation;
}
