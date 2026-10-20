export type NodeType = "hospital" | "junction" | "emergencyZone" | "shelter" | "depot";

export type AmbulanceStatus =
  | "available"
  | "assigned"
  | "enRoute"
  | "atIncident"
  | "transporting"
  | "returning"
  | "unavailable";

export type RoadStatus = "open" | "congested" | "hazardous" | "closed";

export type EmergencyStatus =
  | "waiting"
  | "assigned"
  | "enRoute"
  | "resolved"
  | "unreachable";

export interface CityNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  capacity?: number;
}

export interface Road {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  baseTravelTimeMin: number;
  status: RoadStatus;
  trafficByHour: number[];
  hazardByHour: number[];
  isBidirectional: boolean;
}

export interface Ambulance {
  id: string;
  locationNodeId: string;
  status: AmbulanceStatus;
  type: "BLS" | "ALS";
  equipment: string[];
  capacity: number;
  fuelPercent: number;
  currentEmergencyId?: string;
  routeNodeIds?: string[];
  etaMinutes?: number;
}

export interface Emergency {
  id: string;
  nodeId: string;
  severity: number;
  affectedPeople: number;
  waitingMinutes: number;
  requiredAmbulanceType: "BLS" | "ALS";
  requiredEquipment: string[];
  status: EmergencyStatus;
  priorityScore: number;
  createdAtSimulationMinute: number;
}

export interface SupplyItem {
  id: string;
  name: string;
  availableQuantity: number;
  weightKg: number;
  reliefValue: number;
  category: "medicine" | "food" | "water" | "shelter";
}

export interface DisasterEvent {
  id: string;
  timestampSimulationMinute: number;
  type:
    | "roadClosure"
    | "hazardIncrease"
    | "trafficIncrease"
    | "newEmergency"
    | "supplyUpdate";
  targetId: string;
  details: string;
}

// --- Dispatch System ---

export interface ActiveDispatch {
  id: string;
  ambulanceId: string;
  emergencyId: string;
  fromNodeId: string;
  toNodeId: string;
  route: string[];
  startTimestamp: number;
  totalDurationSeconds: number;
  remainingSeconds: number;
  severity: number;
  phase: 'enRoute' | 'atIncident' | 'returning' | 'resolved';
}

export interface DispatchLogEntry {
  id: string;
  ambulanceId: string;
  emergencyId: string;
  severity: number;
  resolvedAtMinute: number;
  totalSeconds: number;
  resolvedAtTimestamp: number;
}
