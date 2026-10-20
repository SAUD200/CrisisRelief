import type { Ambulance, CityNode, Emergency, Road, SupplyItem } from "../types";

export const nodes: CityNode[] = [
  { id: "H1", label: "Central Hospital", type: "hospital", x: 200, y: 150, capacity: 100 },
  { id: "H2", label: "Westside Clinic", type: "hospital", x: 800, y: 100, capacity: 50 },
  { id: "D1", label: "Main Depot", type: "depot", x: 500, y: 300, capacity: 1000 },
  { id: "S1", label: "North Shelter", type: "shelter", x: 400, y: 50, capacity: 200 },
  { id: "S2", label: "South Shelter", type: "shelter", x: 450, y: 550, capacity: 300 },
  { id: "Z1", label: "Zone Alpha", type: "emergencyZone", x: 100, y: 300 },
  { id: "Z2", label: "Zone Beta", type: "emergencyZone", x: 300, y: 450 },
  { id: "Z3", label: "Zone Gamma", type: "emergencyZone", x: 700, y: 400 },
  { id: "Z4", label: "Zone Delta", type: "emergencyZone", x: 850, y: 250 },
  { id: "Z5", label: "Zone Epsilon", type: "emergencyZone", x: 900, y: 500 },
  { id: "J1", label: "Junction 1", type: "junction", x: 300, y: 250 },
  { id: "J2", label: "Junction 2", type: "junction", x: 500, y: 150 },
  { id: "J3", label: "Junction 3", type: "junction", x: 650, y: 250 },
  { id: "J4", label: "Junction 4", type: "junction", x: 550, y: 450 },
  { id: "J5", label: "Junction 5", type: "junction", x: 750, y: 150 }
];

const generateHourlyData = (base: number, variance: number) => 
  Array.from({ length: 24 }, () => Math.max(0, Math.min(100, base + Math.floor(Math.random() * variance * 2 - variance))));

export const roads: Road[] = [
  { id: "R1", from: "H1", to: "J1", distanceKm: 2.5, baseTravelTimeMin: 5, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(30, 20), hazardByHour: generateHourlyData(10, 5) },
  { id: "R2", from: "J1", to: "Z1", distanceKm: 3.0, baseTravelTimeMin: 6, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(20, 10), hazardByHour: generateHourlyData(5, 5) },
  { id: "R3", from: "J1", to: "Z2", distanceKm: 4.0, baseTravelTimeMin: 8, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(40, 15), hazardByHour: generateHourlyData(15, 10) },
  { id: "R4", from: "H1", to: "J2", distanceKm: 5.0, baseTravelTimeMin: 10, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(50, 25), hazardByHour: generateHourlyData(20, 15) },
  { id: "R5", from: "S1", to: "J2", distanceKm: 2.0, baseTravelTimeMin: 4, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(10, 5), hazardByHour: generateHourlyData(0, 0) },
  { id: "R6", from: "J2", to: "D1", distanceKm: 3.5, baseTravelTimeMin: 7, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(60, 30), hazardByHour: generateHourlyData(10, 10) },
  { id: "R7", from: "J2", to: "J3", distanceKm: 4.5, baseTravelTimeMin: 9, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(45, 20), hazardByHour: generateHourlyData(5, 5) },
  { id: "R8", from: "J3", to: "D1", distanceKm: 2.5, baseTravelTimeMin: 5, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(35, 15), hazardByHour: generateHourlyData(10, 5) },
  { id: "R9", from: "D1", to: "J4", distanceKm: 3.0, baseTravelTimeMin: 6, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(55, 25), hazardByHour: generateHourlyData(15, 10) },
  { id: "R10", from: "J4", to: "S2", distanceKm: 2.5, baseTravelTimeMin: 5, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(25, 10), hazardByHour: generateHourlyData(5, 5) },
  { id: "R11", from: "J4", to: "Z2", distanceKm: 5.0, baseTravelTimeMin: 10, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(30, 15), hazardByHour: generateHourlyData(20, 15) },
  { id: "R12", from: "J4", to: "Z3", distanceKm: 4.0, baseTravelTimeMin: 8, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(40, 20), hazardByHour: generateHourlyData(10, 10) },
  { id: "R13", from: "Z3", to: "Z5", distanceKm: 3.5, baseTravelTimeMin: 7, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(20, 10), hazardByHour: generateHourlyData(30, 20) },
  { id: "R14", from: "J3", to: "J5", distanceKm: 3.0, baseTravelTimeMin: 6, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(50, 20), hazardByHour: generateHourlyData(5, 5) },
  { id: "R15", from: "J5", to: "H2", distanceKm: 2.0, baseTravelTimeMin: 4, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(30, 15), hazardByHour: generateHourlyData(5, 5) },
  { id: "R16", from: "J5", to: "Z4", distanceKm: 3.5, baseTravelTimeMin: 7, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(25, 10), hazardByHour: generateHourlyData(10, 5) },
  { id: "R17", from: "Z4", to: "H2", distanceKm: 4.5, baseTravelTimeMin: 9, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(20, 10), hazardByHour: generateHourlyData(5, 5) },
  { id: "R18", from: "Z4", to: "Z5", distanceKm: 5.5, baseTravelTimeMin: 11, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(15, 5), hazardByHour: generateHourlyData(25, 15) },
  { id: "R19", from: "J1", to: "D1", distanceKm: 6.0, baseTravelTimeMin: 12, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(65, 20), hazardByHour: generateHourlyData(15, 10) },
  { id: "R20", from: "J3", to: "Z3", distanceKm: 4.5, baseTravelTimeMin: 9, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(35, 15), hazardByHour: generateHourlyData(20, 10) },
  { id: "R21", from: "H1", to: "S1", distanceKm: 5.5, baseTravelTimeMin: 11, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(20, 10), hazardByHour: generateHourlyData(5, 5) },
  { id: "R22", from: "J1", to: "S1", distanceKm: 6.5, baseTravelTimeMin: 13, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(25, 15), hazardByHour: generateHourlyData(10, 5) },
  { id: "R23", from: "Z1", to: "Z2", distanceKm: 4.5, baseTravelTimeMin: 9, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(15, 5), hazardByHour: generateHourlyData(5, 5) },
  { id: "R24", from: "Z2", to: "S2", distanceKm: 5.0, baseTravelTimeMin: 10, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(20, 10), hazardByHour: generateHourlyData(10, 5) },
  { id: "R25", from: "J5", to: "Z5", distanceKm: 7.0, baseTravelTimeMin: 14, status: "open", isBidirectional: true, trafficByHour: generateHourlyData(30, 10), hazardByHour: generateHourlyData(15, 10) }
];

export const ambulances: Ambulance[] = [
  { id: "A1", locationNodeId: "H1", status: "available", type: "ALS", equipment: ["Defibrillator", "Oxygen", "Ventilator"], capacity: 2, fuelPercent: 100 },
  { id: "A2", locationNodeId: "H1", status: "available", type: "BLS", equipment: ["Oxygen", "First Aid"], capacity: 2, fuelPercent: 95 },
  { id: "A3", locationNodeId: "H2", status: "available", type: "ALS", equipment: ["Defibrillator", "Oxygen", "Ventilator"], capacity: 2, fuelPercent: 80 },
  { id: "A4", locationNodeId: "H2", status: "available", type: "BLS", equipment: ["Oxygen", "First Aid"], capacity: 2, fuelPercent: 100 }
];

export const initialEmergencies: Emergency[] = [
  { id: "E1", nodeId: "Z1", severity: 85, affectedPeople: 5, waitingMinutes: 10, requiredAmbulanceType: "ALS", requiredEquipment: ["Defibrillator"], status: "waiting", priorityScore: 0, createdAtSimulationMinute: 0 },
  { id: "E2", nodeId: "Z2", severity: 40, affectedPeople: 12, waitingMinutes: 25, requiredAmbulanceType: "BLS", requiredEquipment: [], status: "waiting", priorityScore: 0, createdAtSimulationMinute: 0 },
  { id: "E3", nodeId: "Z3", severity: 95, affectedPeople: 2, waitingMinutes: 5, requiredAmbulanceType: "ALS", requiredEquipment: ["Ventilator"], status: "waiting", priorityScore: 0, createdAtSimulationMinute: 0 },
  { id: "E4", nodeId: "Z4", severity: 60, affectedPeople: 20, waitingMinutes: 40, requiredAmbulanceType: "BLS", requiredEquipment: ["First Aid"], status: "waiting", priorityScore: 0, createdAtSimulationMinute: 0 },
  { id: "E5", nodeId: "Z5", severity: 75, affectedPeople: 8, waitingMinutes: 15, requiredAmbulanceType: "BLS", requiredEquipment: ["Oxygen"], status: "waiting", priorityScore: 0, createdAtSimulationMinute: 0 }
];

export const supplies: SupplyItem[] = [
  { id: "M1", name: "Medicine Kit A", availableQuantity: 50, weightKg: 2, reliefValue: 80, category: "medicine" },
  { id: "M2", name: "Medicine Kit B", availableQuantity: 30, weightKg: 5, reliefValue: 120, category: "medicine" },
  { id: "F1", name: "Food Packets", availableQuantity: 200, weightKg: 1, reliefValue: 20, category: "food" },
  { id: "W1", name: "Water Bottles", availableQuantity: 500, weightKg: 0.5, reliefValue: 10, category: "water" },
  { id: "S1", name: "Blankets", availableQuantity: 100, weightKg: 1.5, reliefValue: 15, category: "shelter" }
];
