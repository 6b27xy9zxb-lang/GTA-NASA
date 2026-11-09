import React from 'react';
import { SpacecraftConfig, MissionCalculation } from '../../types/game';
import chassisList from '../../data/chassis.json';

interface SvgDiagramProps {
  config: SpacecraftConfig;
  calculation: MissionCalculation;
}

export const SpacecraftSvgDiagram: React.FC<SvgDiagramProps> = ({ config, calculation }) => {
  const chassis = chassisList.find((c) => c.id === config.chassisId) || chassisList[0];

  const hasSolar = config.coreComponents.solar || config.installedModules.includes('advanced-solar-wing');
  const hasRtg = config.coreComponents.powerSource === 'power-rtg-base' || config.installedModules.includes('rtg-power-unit');
  const hasDish = config.coreComponents.antenna === 'antenna-ka-band' || config.installedModules.includes('high-gain-antenna');
  const hasShield = config.installedModules.includes('heavy-deflector-shield');
  const hasArmor = config.installedModules.includes('reinforced-hull-plating');

  const instrumentCount = config.selectedInstruments.length;

  return (
    <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 relative overflow-hidden">
      {/* Background Blueprint Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#00f0ff15_1px,transparent_1px)] [background-size:18px_18px] opacity-40 pointer-events-none" />

      {/* Blueprint Header */}
      <div className="absolute top-3 left-4 flex items-center gap-2 font-mono text-[11px] text-cyan-400">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>SCHEMATIC OVERLAY // {chassis.name.toUpperCase()} CAD v4.2</span>
      </div>

      <div className="absolute top-3 right-4 font-mono text-[11px] text-slate-500">
        SCALE: 1:25 METRIC
      </div>

      {/* SVG Diagram Canvas */}
      <svg
        viewBox="0 0 600 340"
        className="w-full h-auto max-h-[320px] select-none filter drop-shadow-[0_0_12px_rgba(0,240,255,0.15)]"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="fuselageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="solarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          <linearGradient id="thrusterGrad" x1="100%" y1="50%" x2="0%" y2="50%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
          </linearGradient>

          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Deflector Shield Outer Aura */}
        {hasShield && (
          <ellipse
            cx="300"
            cy="170"
            rx="180"
            ry="110"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            opacity="0.5"
            className="animate-spin"
            style={{ transformOrigin: '300px 170px', animationDuration: '24s' }}
          />
        )}

        {/* Thruster Plume */}
        <polygon
          points="200,170 120,155 140,170 120,185"
          fill="url(#thrusterGrad)"
          filter="url(#cyanGlow)"
        />

        {/* Thruster Bell */}
        <path d="M 200,158 L 220,163 L 220,177 L 200,182 Z" fill="#475569" stroke="#00f0ff" strokeWidth="1" />

        {/* Solar Panels (Left & Right) */}
        {hasSolar && (
          <g>
            {/* Top Wing */}
            <rect
              x="250"
              y="40"
              width="90"
              height="75"
              rx="4"
              fill="url(#solarGrad)"
              stroke="#60a5fa"
              strokeWidth="1.5"
            />
            {/* Photovoltaic Grid Lines */}
            <line x1="280" y1="40" x2="280" y2="115" stroke="#93c5fd" strokeWidth="0.8" opacity="0.6" />
            <line x1="310" y1="40" x2="310" y2="115" stroke="#93c5fd" strokeWidth="0.8" opacity="0.6" />
            <line x1="250" y1="65" x2="340" y2="65" stroke="#93c5fd" strokeWidth="0.8" opacity="0.6" />
            <line x1="250" y1="90" x2="340" y2="90" stroke="#93c5fd" strokeWidth="0.8" opacity="0.6" />
            <line x1="295" y1="115" x2="295" y2="140" stroke="#64748b" strokeWidth="3" />

            {/* Bottom Wing */}
            <rect
              x="250"
              y="225"
              width="90"
              height="75"
              rx="4"
              fill="url(#solarGrad)"
              stroke="#60a5fa"
              strokeWidth="1.5"
            />
            <line x1="280" y1="225" x2="280" y2="300" stroke="#93c5fd" strokeWidth="0.8" opacity="0.6" />
            <line x1="310" y1="225" x2="310" y2="300" stroke="#93c5fd" strokeWidth="0.8" opacity="0.6" />
            <line x1="250" y1="250" x2="340" y2="250" stroke="#93c5fd" strokeWidth="0.8" opacity="0.6" />
            <line x1="250" y1="275" x2="340" y2="275" stroke="#93c5fd" strokeWidth="0.8" opacity="0.6" />
            <line x1="295" y1="200" x2="295" y2="225" stroke="#64748b" strokeWidth="3" />
          </g>
        )}

        {/* RTG Nuclear Generator (if equipped) */}
        {hasRtg && (
          <g transform="translate(225, 120)">
            <rect x="0" y="0" width="22" height="35" rx="3" fill="#334155" stroke="#f97316" strokeWidth="1.2" />
            <line x1="-4" y1="8" x2="26" y2="8" stroke="#ea580c" strokeWidth="1.5" />
            <line x1="-4" y1="18" x2="26" y2="18" stroke="#ea580c" strokeWidth="1.5" />
            <line x1="-4" y1="28" x2="26" y2="28" stroke="#ea580c" strokeWidth="1.5" />
          </g>
        )}

        {/* High Gain Parabolic Dish (if equipped) */}
        {hasDish && (
          <g transform="translate(340, 105) rotate(-20)">
            <path d="M 0,0 Q 25,18 0,36 Z" fill="#f8fafc" stroke="#00f0ff" strokeWidth="1.2" />
            <line x1="12" y1="18" x2="28" y2="18" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="28" cy="18" r="3" fill="#00f0ff" />
          </g>
        )}

        {/* Main Central Bus Fuselage */}
        <polygon
          points="220,140 370,140 400,170 370,200 220,200"
          fill="url(#fuselageGrad)"
          stroke="#00f0ff"
          strokeWidth="2"
        />

        {/* Fuselage Panel Ribs */}
        <line x1="270" y1="140" x2="270" y2="200" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="320" y1="140" x2="320" y2="200" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />

        {/* Armor Reinforced Plating */}
        {hasArmor && (
          <rect
            x="245"
            y="146"
            width="100"
            height="48"
            rx="2"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
        )}

        {/* Science Payload Sensor Bay (Nose) */}
        <circle cx="380" cy="170" r="12" fill="#0f172a" stroke="#00f0ff" strokeWidth="1.5" />
        <circle cx="380" cy="170" r="6" fill="#38bdf8" />

        {/* Connecting Callout Lines & Labels */}
        {/* Antenna Callout */}
        <line x1="365" y1="100" x2="440" y2="70" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="440" cy="70" r="2" fill="#00f0ff" />
        <text x="445" y="73" fill="#38bdf8" fontSize="10" fontFamily="monospace">
          {hasDish ? 'KA-BAND HIGH-GAIN' : 'S-BAND OMNI'}
        </text>

        {/* Power Array Callout */}
        <line x1="300" y1="40" x2="300" y2="20" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="300" y1="20" x2="180" y2="20" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="180" cy="20" r="2" fill="#00f0ff" />
        <text x="80" y="23" fill="#60a5fa" fontSize="10" fontFamily="monospace">
          {hasSolar ? 'ULTRAFLEX WINGS' : 'BODY MOUNTED'}
        </text>

        {/* Propulsion Callout */}
        <line x1="210" y1="180" x2="160" y2="230" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="160" cy="230" r="2" fill="#00f0ff" />
        <text x="90" y="233" fill="#00f0ff" fontSize="10" fontFamily="monospace">
          {config.coreComponents.propulsion === 'propulsion-ion' ? 'NEXT-C ION DRIVE' : 'BIPROP THRUSTER'}
        </text>

        {/* Science Payload Callout */}
        <line x1="395" y1="175" x2="450" y2="210" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="450" cy="210" r="2" fill="#00f0ff" />
        <text x="455" y="213" fill="#a855f7" fontSize="10" fontFamily="monospace">
          PAYLOAD: {instrumentCount} SENSORS
        </text>
      </svg>

      {/* Dynamic Telemetry Footnote */}
      <div className="mt-3 flex items-center justify-between w-full px-2 text-[11px] font-mono border-t border-slate-800/80 pt-2.5">
        <span className="text-slate-400">
          Chassis: <strong className="text-white">{chassis.name}</strong> ({calculation.dryMassKg} kg dry)
        </span>
        <span className="text-slate-400">
          Equipped Modules: <strong className="text-cyan-400">{config.installedModules.length}</strong> / {chassis.hardpointSlots}
        </span>
        <span className="text-slate-400">
          Propellant: <strong className="text-amber-400">{calculation.fuelMassKg} kg</strong>
        </span>
      </div>
    </div>
  );
};
