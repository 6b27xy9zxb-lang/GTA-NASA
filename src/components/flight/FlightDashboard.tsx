import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Zap,
  Fuel,
  Radio,
  Sparkles,
  Play,
  Pause,
  FastForward,
  Eye,
  Layers,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Music,
  Volume2,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';
import { SpaceScene } from '../../3d/SpaceScene';
import { FlightView2D } from './FlightView2D';
import { ActionConsole } from './ActionConsole';
import { RadioComms } from './RadioComms';
import { EventModal } from './EventModal';

export const FlightDashboard: React.FC = () => {
  const {
    config,
    simulationResult,
    flightStepIndex,
    isFlightPaused,
    flightSpeed,
    activeEvent,
    isExploding,
    lowGraphicsMode,
    toggleLowGraphics,
    setFlightPaused,
    setFlightSpeed,
    advanceFlightStep,
    handleEventChoice,
    setScreen,
  } = useGameStore();

  const [use2DView, setUse2DView] = useState(false);
  const [isMusicActive, setIsMusicActive] = useState(true);

  // Initialize atmospheric space soundtrack during flight
  useEffect(() => {
    sound.startSpaceMusic();
    setIsMusicActive(true);
    return () => {
      sound.stopSpaceMusic();
    };
  }, []);

  // Trigger contextual SFX when an active event emerges
  useEffect(() => {
    if (activeEvent) {
      if (activeEvent.isHighStakesDistress) {
        sound.playDistressSonarPulse();
      } else if (activeEvent.id.includes('flare') || activeEvent.severity === 'critical') {
        sound.playWarningAlarm();
      } else if (activeEvent.id.includes('micrometeorite')) {
        sound.playImpactCrack();
      }
    }
  }, [activeEvent]);

  // Auto-advance flight steps based on speed
  useEffect(() => {
    if (isFlightPaused || !simulationResult || isExploding) return;

    const intervalMs = Math.max(250, 900 / flightSpeed);
    const interval = setInterval(() => {
      advanceFlightStep();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isFlightPaused, flightSpeed, simulationResult, advanceFlightStep, isExploding]);

  if (!simulationResult) {
    return (
      <div className="min-h-screen bg-space-950 text-slate-100 flex items-center justify-center p-4">
        <p className="font-mono text-cyan-400">Loading flight trajectory telemetry...</p>
      </div>
    );
  }

  const timeline = simulationResult.timeline;
  const currentPoint = timeline[flightStepIndex] || timeline[timeline.length - 1];

  const isHullCritical = currentPoint.hullHealth <= 25;

  return (
    <div
      className={`relative min-h-screen w-full bg-space-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none ${
        isHullCritical ? 'animate-pulse' : ''
      }`}
    >
      {/* Red Warning Border Pulse when Hull is Critically Low */}
      {isHullCritical && (
        <div className="pointer-events-none fixed inset-0 z-40 border-[8px] border-crimson-alert/40 shadow-[inset_0_0_60px_rgba(239,68,68,0.5)] animate-pulse" />
      )}

      {/* TOP TELEMETRY HUD */}
      <header className="relative z-30 px-4 md:px-6 py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Mission & Destination Banner */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">GTA NASA // FLIGHT OPS</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {currentPoint.phase.toUpperCase()}
                </span>
              </div>
              <span className="font-mono text-xs text-slate-400">
                T+{currentPoint.timeDays} DAYS // MISSION PROGRESS: {currentPoint.progressPercent}%
              </span>
            </div>
          </div>

          {/* Core HUD Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex items-center gap-3 font-mono text-xs">
            {/* Hull Health */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 min-w-[130px]">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" /> Hull Integrity
                </span>
                <span className={`font-bold ${currentPoint.hullHealth <= 25 ? 'text-rose-400 animate-ping' : 'text-slate-200'}`}>
                  {currentPoint.hullHealth}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentPoint.hullHealth > 50
                      ? 'bg-cyan-400'
                      : currentPoint.hullHealth > 25
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${currentPoint.hullHealth}%` }}
                />
              </div>
            </div>

            {/* Fuel Reserves */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 min-w-[130px]">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-orange-400" /> Propellant
                </span>
                <span className="font-bold text-slate-200">{currentPoint.fuelKg} kg</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-orange-400 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (currentPoint.fuelKg / Math.max(config.fuelLoadKg, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Power Reserves */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 min-w-[130px]">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Power Grid
                </span>
                <span className="font-bold text-slate-200">{currentPoint.powerReservePercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${currentPoint.powerReservePercent}%` }}
                />
              </div>
            </div>

            {/* Science Collected */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 min-w-[130px]">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Science Yield
                </span>
                <span className="font-bold text-purple-300">{currentPoint.scienceCollected} pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-purple-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (currentPoint.scienceCollected / 400) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Time & Speed Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playUiClick();
                setFlightPaused(!isFlightPaused);
              }}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200"
              title={isFlightPaused ? 'Resume Simulation' : 'Pause Simulation'}
            >
              {isFlightPaused ? <Play className="w-4 h-4 text-emerald-400 fill-current" /> : <Pause className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Speed Toggles */}
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  sound.playUiClick();
                  setFlightSpeed(spd);
                }}
                className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors ${
                  flightSpeed === spd
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}

            {/* Music Toggle */}
            <button
              onClick={() => {
                const playing = sound.toggleMusic();
                setIsMusicActive(playing);
              }}
              className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors ${
                isMusicActive
                  ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Toggle Procedural Sci-Fi Space Soundtrack"
            >
              <Music className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{isMusicActive ? 'OST On' : 'OST Off'}</span>
            </button>

            {/* 3D vs 2D Fallback Toggle */}
            <button
              onClick={() => {
                sound.playUiClick();
                setUse2DView(!use2DView);
              }}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 text-xs font-mono flex items-center gap-1"
              title="Toggle 3D View / 2D Tactical View"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{use2DView ? '2D View' : '3D View'}</span>
            </button>
          </div>
        </div>

        {/* Timeline Scrubber Bar */}
        <div className="max-w-[1700px] mx-auto mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>T+0d</span>
          <div className="flex-1 h-2 rounded-full bg-slate-900 border border-slate-800 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${currentPoint.progressPercent}%` }}
            />
          </div>
          <span>T+{simulationResult.missionDurationDays}d</span>
        </div>
      </header>

      {/* CENTER VIEWPORT (65-70% Height): 3D Scene or 2D Fallback */}
      <main className="relative flex-1 w-full overflow-hidden">
        {use2DView ? (
          <FlightView2D config={config} isExploding={isExploding} />
        ) : (
          <SpaceScene config={config} isExploding={isExploding} lowGraphics={lowGraphicsMode} />
        )}

        {/* High Stakes Catastrophic Hull Breach Notification Overlay */}
        {isExploding && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-red-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-3"
            >
              <div className="font-mono text-5xl md:text-7xl font-black text-rose-500 drop-shadow-[0_0_35px_rgba(244,63,94,0.8)] animate-pulse">
                MISSION FAILED: HULL BREACHED
              </div>
              <p className="font-mono text-sm md:text-base text-slate-200">
                CRITICAL CATASTROPHIC HULL COLLAPSE // TELEMETRY TERMINATED
              </p>
            </motion.div>
          </div>
        )}
      </main>

      {/* BOTTOM TACTICAL PANELS (Action Console & Radio Comms) */}
      <footer className="relative z-30 p-4 max-w-[1700px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Action Console (7 cols) */}
        <div className="lg:col-span-7">
          <ActionConsole />
        </div>

        {/* Right: Team Radio Comms (5 cols) */}
        <div className="lg:col-span-5">
          <RadioComms />
        </div>
      </footer>

      {/* Interactive Random Event Modal */}
      {activeEvent && (
        <EventModal
          event={activeEvent}
          onChooseOption={(optId) => handleEventChoice(activeEvent.id, optId)}
        />
      )}
    </div>
  );
};
