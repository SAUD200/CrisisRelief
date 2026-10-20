# 🚨 CrisisRelief - Autonomous Emergency Response & Logistics Optimization

[![Live Demo](https://img.shields.io/badge/Demo-crisisrelief.vercel.app-000?style=for-the-badge&logo=vercel&logoColor=white)](https://crisisrelief.vercel.app)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **Live Deployment:** 🌐 **[https://crisisrelief.vercel.app](https://crisisrelief.vercel.app)**

---

## 📌 Overview

**CrisisRelief** is an advanced crisis coordination and emergency logistics simulation platform. Designed for modern emergency dispatchers and disaster responders, it couples graph theory, heuristic route optimization, and combinatorial resource allocation to coordinate multi-unit response fleets across complex city grid networks in real time.

---

## 🚀 Live Demo

Experience the live application deployed on Vercel:
👉 **[https://crisisrelief.vercel.app](https://crisisrelief.vercel.app)**

---

## ✨ Key Features

### 1. 🚑 Dynamic Emergency Navigation & Animated Fleet Routing
- Real-time animated ambulances with dynamic heading rotation and siren pulse effects.
- Route optimization with obstacle avoidance, road congestion accounting, and hazard rerouting.
- Support for single-unit emergency dispatches and multi-unit convoy deployments.

### 2. ⚠️ Crisis Management & Incident Simulator
- Inject custom incidents across city zones directly from the Command Panel.
- Configurable severity levels (*Critical, Severe, Moderate, Low*), affected casualty counts, and localized emergency tags.
- Dynamic road closures and congestion modifiers dynamically altering graph edge weights.

### 3. 📦 Smart Resource Allocation & Bin-Packing Optimization
- **Bin Packing Algorithm**: When disaster relief supplies (medical kits, oxygen tanks, blood packs, trauma bags) exceed single vehicle capacity, the system automatically runs a greedy first-fit decreasing bin-packing algorithm.
- Calculates the **minimum number of ambulances** required to carry all demanded supplies without overloading any vehicle.
- Configurable per-vehicle cargo capacity and adjustable emergency fleet sizing.

### 4. 🚦 Intelligent Traffic Signal Synchronization (Green Corridor)
- Dynamic traffic signal optimization along the active emergency path.
- Preemptively turns intersections along the route **Green**, clearing intersections before the arrival of the ambulance convoy.

### 5. 📊 Interactive Analytics & Live Telemetry
- Real-time statistics: Active emergency count, total resolved crises, dispatched vehicles, average response times, and fuel/travel efficiency metrics.
- Mission audit log detailing dispatch history, algorithmic decisions, and waypoint steps.

---

## 🧠 Algorithmic Core

| Component | Algorithm / Technique | Purpose |
| :--- | :--- | :--- |
| **Pathfinding** | **Dijkstra / A\*** | Determines minimum-latency routes across weighted city grids with live congestion factors. |
| **Resource Distribution** | **First-Fit Decreasing (FFD) Bin Packing** | Minimizes convoy vehicle count when demand exceeds single-ambulance payload limits. |
| **Signal Optimization** | **Heuristic Priority Scheduling** | Activates "Green Waves" along active emergency trajectories. |
| **Fleet Coordination** | **Multi-Agent Priority Queue** | Assigns nearest available ambulances based on crisis severity and proximity. |

---

## 🛠️ Tech Stack

- **Frontend Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio / Effects**: Web Audio API (Synthesized Siren & Signal Audio)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 💻 Local Development Setup

To run CrisisRelief locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SAUD200/CrisisRelief.git
   cd CrisisRelief
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173`

---

## 🌐 Deployment

The project is continuously hosted on Vercel:
- **Production URL**: [https://crisisrelief.vercel.app](https://crisisrelief.vercel.app)
- **Repository**: [https://github.com/SAUD200/CrisisRelief](https://github.com/SAUD200/CrisisRelief)

---

## 📄 License

This project is licensed under the MIT License - feel free to use and adapt it for research and educational purposes.
