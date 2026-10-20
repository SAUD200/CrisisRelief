import { create } from 'zustand';
import type { ActiveDispatch, Ambulance, CityNode, DisasterEvent, DispatchLogEntry, Emergency, Road, SupplyItem } from '../types';
import { ambulances, initialEmergencies, nodes, roads, supplies } from '../data/seedCity';

interface SimulationState {
  timeMinute: number;
  timeHour: number;
  isRunning: boolean;
  speedMultiplier: number;
  nodes: CityNode[];
  roads: Road[];
  ambulances: Ambulance[];
  emergencies: Emergency[];
  supplies: SupplyItem[];
  events: DisasterEvent[];
  dispatches: ActiveDispatch[];
  dispatchLog: DispatchLogEntry[];
  
  // Actions
  setTime: (minute: number) => void;
  advanceTime: (minutes: number) => void;
  toggleSimulation: () => void;
  setSpeedMultiplier: (speed: number) => void;
  addEmergency: (emergency: Emergency) => void;
  updateEmergency: (id: string, updates: Partial<Emergency>) => void;
  updateAmbulance: (id: string, updates: Partial<Ambulance>) => void;
  addAmbulance: (ambulance: Ambulance) => void;
  removeAmbulance: (id: string) => void;
  addSupply: (item: SupplyItem) => void;
  updateSupply: (id: string, updates: Partial<SupplyItem>) => void;
  defaultAmbulanceCapacity: number;
  setDefaultAmbulanceCapacity: (capacity: number) => void;
  updateRoad: (id: string, updates: Partial<Road>) => void;
  addEvent: (event: DisasterEvent) => void;
  dispatchAmbulance: (dispatch: ActiveDispatch) => void;
  updateDispatches: (dispatches: ActiveDispatch[]) => void;
  completeDispatch: (id: string) => void;
  resetSimulation: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  timeMinute: 0,
  timeHour: 0,
  isRunning: false,
  speedMultiplier: 1,
  defaultAmbulanceCapacity: 15,
  nodes: [...nodes],
  roads: [...roads],
  ambulances: [...ambulances],
  emergencies: [...initialEmergencies],
  supplies: [...supplies],
  events: [],
  dispatches: [],
  dispatchLog: [],

  setTime: (minute) => set({ timeMinute: minute, timeHour: Math.floor(minute / 60) % 24 }),
  advanceTime: (minutes) => set((state) => {
    const newMinute = state.timeMinute + minutes;
    return { timeMinute: newMinute, timeHour: Math.floor(newMinute / 60) % 24 };
  }),
  toggleSimulation: () => set((state) => ({ isRunning: !state.isRunning })),
  setSpeedMultiplier: (speed) => set({ speedMultiplier: speed }),
  setDefaultAmbulanceCapacity: (capacity) => set({ defaultAmbulanceCapacity: capacity }),
  
  addEmergency: (emergency) => set((state) => ({ emergencies: [...state.emergencies, emergency] })),
  updateEmergency: (id, updates) => set((state) => ({
    emergencies: state.emergencies.map((e) => e.id === id ? { ...e, ...updates } : e)
  })),
  
  updateAmbulance: (id, updates) => set((state) => ({
    ambulances: state.ambulances.map((a) => a.id === id ? { ...a, ...updates } : a)
  })),

  addAmbulance: (ambulance) => set((state) => ({
    ambulances: [...state.ambulances, ambulance]
  })),

  removeAmbulance: (id) => set((state) => ({
    ambulances: state.ambulances.filter((a) => a.id !== id)
  })),

  addSupply: (item) => set((state) => ({
    supplies: [...state.supplies, item]
  })),

  updateSupply: (id, updates) => set((state) => ({
    supplies: state.supplies.map((s) => s.id === id ? { ...s, ...updates } : s)
  })),
  
  updateRoad: (id, updates) => set((state) => ({
    roads: state.roads.map((r) => r.id === id ? { ...r, ...updates } : r)
  })),
  
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  
  // Atomically: create dispatch + mark ambulance enRoute + mark emergency enRoute
  dispatchAmbulance: (dispatch) => set((state) => ({
    dispatches: [...state.dispatches, dispatch],
    ambulances: state.ambulances.map(a =>
      a.id === dispatch.ambulanceId
        ? { ...a, status: 'enRoute' as const, currentEmergencyId: dispatch.emergencyId, routeNodeIds: dispatch.route }
        : a
    ),
    emergencies: state.emergencies.map(e =>
      e.id === dispatch.emergencyId
        ? { ...e, status: 'enRoute' as const }
        : e
    ),
  })),

  updateDispatches: (dispatches) => set({ dispatches }),
  
  // Atomically: remove dispatch + resolve emergency + free ambulance + add to log
  completeDispatch: (id) => set((state) => {
    const dispatch = state.dispatches.find(d => d.id === id);
    if (!dispatch) return {};
    
    return {
      dispatches: state.dispatches.filter(d => d.id !== id),
      dispatchLog: [...state.dispatchLog, {
        id: dispatch.id,
        ambulanceId: dispatch.ambulanceId,
        emergencyId: dispatch.emergencyId,
        severity: dispatch.severity,
        resolvedAtMinute: state.timeMinute,
        totalSeconds: dispatch.totalDurationSeconds,
        resolvedAtTimestamp: Date.now(),
      }],
      ambulances: state.ambulances.map(a =>
        a.id === dispatch.ambulanceId
          ? { ...a, status: 'available' as const, locationNodeId: dispatch.fromNodeId, currentEmergencyId: undefined, routeNodeIds: undefined, etaMinutes: undefined }
          : a
      ),
      emergencies: state.emergencies.map(e =>
        e.id === dispatch.emergencyId
          ? { ...e, status: 'resolved' as const }
          : e
      ),
    };
  }),
  
  resetSimulation: () => set({
    timeMinute: 0,
    timeHour: 0,
    isRunning: false,
    speedMultiplier: 1,
    nodes: [...nodes],
    roads: [...roads],
    ambulances: [...ambulances],
    emergencies: [...initialEmergencies],
    supplies: [...supplies],
    events: [],
    dispatches: [],
    dispatchLog: [],
  }),
}));
