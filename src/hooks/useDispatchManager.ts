import { useEffect, useRef } from 'react';
import { useSimulationStore } from '../state/store';
import { dijkstra } from '../algorithms/dijkstra';
import { MaxHeap } from '../algorithms/heap';
import type { Emergency } from '../types';

export function useDispatchManager() {
  const isRunning = useSimulationStore((s) => s.isRunning);
  const speedMultiplier = useSimulationStore((s) => s.speedMultiplier);
  const lastAutoDispatchRef = useRef<number>(0);

  // 1. Dispatch Countdown & Auto-Resolution Loop (ticks once per second)
  useEffect(() => {
    const timer = setInterval(() => {
      const state = useSimulationStore.getState();
      const now = Date.now();
      const currentDispatches = state.dispatches;

      if (currentDispatches.length === 0) return;

      const toComplete: string[] = [];
      let hasChanges = false;

      const updated = currentDispatches.map((d) => {
        const elapsedSec = (now - d.startTimestamp) / 1000;
        const progress = elapsedSec / d.totalDurationSeconds;
        const remaining = Math.max(0, Math.ceil(d.totalDurationSeconds - elapsedSec));

        let phase: 'enRoute' | 'atIncident' | 'returning' | 'resolved' = 'enRoute';
        if (progress >= 1.0) {
          phase = 'resolved';
          toComplete.push(d.id);
        } else if (progress >= 0.6) {
          phase = 'returning';
        } else if (progress >= 0.45) {
          phase = 'atIncident';
        }

        if (d.remainingSeconds !== remaining || d.phase !== phase) {
          hasChanges = true;
        }

        return {
          ...d,
          remainingSeconds: remaining,
          phase,
        };
      });

      if (hasChanges) {
        state.updateDispatches(updated);
      }

      toComplete.forEach((id) => {
        state.completeDispatch(id);
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // 2. Simulation Time Advancement & Auto-Dispatch Loop (when isRunning is true)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const state = useSimulationStore.getState();
      
      // Advance simulation clock
      state.advanceTime(1);

      // Check auto-dispatch throttle (every 2.5 seconds)
      const now = Date.now();
      if (now - lastAutoDispatchRef.current >= 2500) {
        lastAutoDispatchRef.current = now;

        const waiting = state.emergencies.filter((e) => e.status === 'waiting');
        const available = state.ambulances.filter((a) => a.status === 'available');

        if (waiting.length > 0 && available.length > 0) {
          // Use MaxHeap to pick highest priority emergency
          const heap = new MaxHeap<Emergency & { computedPriority: number }>();
          waiting.forEach((e) => {
            const normalizedAffected = Math.min(e.affectedPeople * 5, 100);
            const normalizedWait = Math.min(e.waitingMinutes * 2, 100);
            const score = 0.45 * e.severity + 0.25 * normalizedAffected + 0.15 * normalizedWait;
            heap.insert({ ...e, computedPriority: score }, score);
          });

          const highestPriority = heap.extractMax();
          if (highestPriority) {
            const emergency = highestPriority.item;

            // Find best ambulance: match ALS if required, or closest by road distance
            const matchedAmb = available.find((a) =>
              emergency.requiredAmbulanceType === 'ALS' ? a.type === 'ALS' : true
            ) || available[0];

            if (matchedAmb) {
              // Calculate shortest path via Dijkstra
              const routeRes = dijkstra(
                matchedAmb.locationNodeId,
                emergency.nodeId,
                state.nodes,
                state.roads,
                state.timeHour
              );

              const route = routeRes && routeRes.path.length > 0
                ? routeRes.path
                : [matchedAmb.locationNodeId, emergency.nodeId];

              // Duration varies by severity: (5s to 22s)
              const durationSec = Math.max(
                5,
                Math.min(22, Math.round(5 + (emergency.severity / 100) * 15))
              );

              state.dispatchAmbulance({
                id: `disp-${Date.now()}-${matchedAmb.id}`,
                ambulanceId: matchedAmb.id,
                emergencyId: emergency.id,
                fromNodeId: matchedAmb.locationNodeId,
                toNodeId: emergency.nodeId,
                route,
                startTimestamp: Date.now(),
                totalDurationSeconds: durationSec,
                remainingSeconds: durationSec,
                severity: emergency.severity,
                phase: 'enRoute',
              });
            }
          }
        }
      }
    }, 1000 / speedMultiplier);

    return () => clearInterval(interval);
  }, [isRunning, speedMultiplier]);
}
