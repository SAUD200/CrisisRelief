import React from 'react';

interface IconProps {
  x: number;
  y: number;
  color: string;
  size?: number;
  label?: string;
}

const IsoBuilding: React.FC<{
  x: number;
  y: number;
  colorHex: string; // base color like #3b82f6
  lightHex: string; // top
  darkHex: string; // left
  midHex: string; // right
  height: number;
  width: number;
}> = ({ x, y, lightHex, darkHex, midHex, height, width }) => {
  const w = width / 2;
  const h = height;
  const depth = width * 0.3; // isometric depth factor

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx={0} cy={depth} rx={w * 1.2} ry={depth * 1.5} fill="rgba(0,0,0,0.4)" filter="blur(4px)" />
      
      {/* Left Face */}
      <polygon
        points={`0,0 -${w},-${depth} -${w},-${depth + h} 0,-${h}`}
        fill={darkHex}
      />
      {/* Right Face */}
      <polygon
        points={`0,0 ${w},-${depth} ${w},-${depth + h} 0,-${h}`}
        fill={midHex}
      />
      {/* Top Face */}
      <polygon
        points={`0,-${h} -${w},-${depth + h} 0,-${h + depth * 2} ${w},-${depth + h}`}
        fill={lightHex}
      />
    </g>
  );
};

export const HospitalIcon: React.FC<IconProps> = ({ x, y }) => (
  <IsoBuilding x={x} y={y} colorHex="#3b82f6" lightHex="#60a5fa" midHex="#3b82f6" darkHex="#2563eb" width={30} height={20} />
);

export const DepotIcon: React.FC<IconProps> = ({ x, y }) => (
  <IsoBuilding x={x} y={y} colorHex="#8b5cf6" lightHex="#a78bfa" midHex="#8b5cf6" darkHex="#7c3aed" width={34} height={16} />
);

export const ShelterIcon: React.FC<IconProps> = ({ x, y }) => (
  <IsoBuilding x={x} y={y} colorHex="#10b981" lightHex="#34d399" midHex="#10b981" darkHex="#059669" width={26} height={14} />
);

export const JunctionIcon: React.FC<IconProps> = ({ x, y }) => (
  <IsoBuilding x={x} y={y} colorHex="#64748b" lightHex="#94a3b8" midHex="#64748b" darkHex="#475569" width={20} height={6} />
);

export const EmergencyZoneIcon: React.FC<IconProps> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <ellipse cx={0} cy={5} rx={16} ry={8} fill="rgba(0,0,0,0.4)" filter="blur(3px)" />
    <circle cx={0} cy={-5} r={12} fill="#ef4444" opacity={0.8} />
    <circle cx={0} cy={-5} r={8} fill="#f87171" />
  </g>
);

export const AmbulanceIcon: React.FC<IconProps & { directionDeg?: number; status?: string; scale?: number }> = ({ 
  x, 
  y, 
  directionDeg = 0, 
  status,
  scale = 1
}) => {
  const isAvailable = status === 'available';
  const isAssigned = status === 'assigned';
  const isDispatched = status === 'enRoute';

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale}) rotate(${directionDeg})`}
      className="pointer-events-none"
    >
      {/* Ground Shadow */}
      <ellipse cx={0} cy={2} rx={14} ry={7} fill="rgba(0,0,0,0.45)" filter="blur(2px)" />

      {/* Wheels */}
      <rect x={-10} y={-8} width={5} height={2} fill="#0f172a" rx={1} />
      <rect x={5} y={-8} width={5} height={2} fill="#0f172a" rx={1} />
      <rect x={-10} y={6} width={5} height={2} fill="#0f172a" rx={1} />
      <rect x={5} y={6} width={5} height={2} fill="#0f172a" rx={1} />

      {/* Main Ambulance Van Body */}
      <rect x={-13} y={-7} width={26} height={14} rx={3} fill="#ffffff" stroke="#cbd5e1" strokeWidth={0.8} />

      {/* Emergency Red Side Stripe */}
      <rect x={-13} y={-1.5} width={26} height={3} fill="#ef4444" />

      {/* Front Cab / Windshield */}
      <path d="M 5,-5 L 10,-5 L 12,-1.5 L 5,-1.5 Z" fill="#0284c7" opacity={0.85} />

      {/* Side Windows */}
      <rect x={-3} y={-5.5} width={6} height={3} fill="#38bdf8" opacity={0.7} rx={0.5} />
      <rect x={-11} y={-5.5} width={5} height={3} fill="#38bdf8" opacity={0.7} rx={0.5} />

      {/* Medical Red Cross Icon */}
      <g transform="translate(-1, 0)">
        <rect x={-3} y={-1} width={6} height={2} fill="#ef4444" />
        <rect x={-1} y={-3} width={2} height={6} fill="#ef4444" />
      </g>

      {/* Roof Emergency Lightbar (Red/Blue Siren) */}
      <rect x={-1} y={-3.5} width={3} height={7} fill="#1e293b" rx={1} />
      {/* Red Strobe */}
      <circle cx={0.5} cy={-2} r={1.8} fill="#ef4444" />
      {isDispatched && (
        <circle cx={0.5} cy={-2} r={3} fill="#ef4444" opacity={0.6} className="animate-ping" />
      )}
      {/* Blue Strobe */}
      <circle cx={0.5} cy={2} r={1.8} fill="#3b82f6" />
      {isDispatched && (
        <circle cx={0.5} cy={2} r={3} fill="#3b82f6" opacity={0.6} className="animate-ping" />
      )}

      {/* Status Indicators */}
      {isAvailable && (
        <circle cx={0} cy={0} r={16} fill="none" stroke="#22c55e" strokeWidth={1.5} className="animate-ping" opacity={0.4} />
      )}
      {isAssigned && (
        <circle cx={0} cy={0} r={15} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 2" />
      )}
    </g>
  );
};

