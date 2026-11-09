import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, FastForward, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';
import launchersList from '../../data/launchers.json';

export const LaunchSequence: React.FC = () => {
  const { config, setScreen } = useGameStore();
  const [seconds, setSeconds] = useState(10);
  const [phaseText, setPhaseText] = useState('FINAL PAD CHILL & INTERNAL POWER TRANSFER');
  const [altitudeKm, setAltitudeKm] = useState(0);
  const [velocityKmS, setVelocityKmS] = useState(0);
  const [isLiftoff, setIsLiftoff] = useState(false);
  const [stageSeparation, setStageSeparation] = useState(false);

  const launcher = launchersList.find((l) => l.id === config.launchVehicleId) || launchersList[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          sound.playCountdownBeep(true);
          return 0;
        }
        sound.playCountdownBeep(false);
        return prev - 1;
      });
    }, 900);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (seconds === 5) {
      sound.playLaunchIgnition();
      setPhaseText('MAIN ENGINE IGNITION // THRUST BUILDUP 100%');
    } else if (seconds === 0) {
      setIsLiftoff(true);
      setPhaseText('T+00:00:00 // LIFTOFF OF THE GTA NASA MISSION');

      // Accelerate telemetry
      let alt = 0;
      let vel = 0;
      const ascTimer = setInterval(() => {
        alt += 14;
        vel += 0.85;
        setAltitudeKm(alt);
        setVelocityKmS(Math.round(vel * 10) / 10);

        if (alt >= 70 && !stageSeparation) {
          setStageSeparation(true);
          sound.playStageSeparation();
          setPhaseText('MAX-Q PASSED // BOOSTER MECO // STAGE SEPARATION CONFIRMED');
        }

        if (alt >= 160) {
          clearInterval(ascTimer);
          setPhaseText('ORBITAL INSERTION CONFIRMED // FAIRING JETTISONED');
          setTimeout(() => {
            setScreen('flight');
          }, 1800);
        }
      }, 350);

      return () => clearInterval(ascTimer);
    }
  }, [seconds, setScreen, stageSeparation]);

  const handleSkip = () => {
    sound.playUiClick();
    setScreen('flight');
  };

  return (
    <div className="relative min-h-screen w-full bg-space-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none">
      {/* Background Gradient simulating ascent through atmosphere to space */}
      <motion.div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: isLiftoff
            ? altitudeKm > 90
              ? 'radial-gradient(ellipse at bottom, #070d1d 0%, #030712 100%)'
              : 'radial-gradient(ellipse at bottom, #1e3a8a 0%, #070d1d 80%)'
            : 'radial-gradient(ellipse at bottom, #0f172a 0%, #030712 100%)',
        }}
      />

      {/* Atmospheric Cloud & Starfield particles */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Telemetry Header */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
            <Rocket className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-mono text-xs text-orange-400 font-bold tracking-widest uppercase block">
              LAUNCH CONTROL CENTER // PAD 39B
            </span>
            <span className="font-bold text-sm text-white">{launcher.name}</span>
          </div>
        </div>

        <button
          onClick={handleSkip}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span>Skip to Flight Phase</span>
          <FastForward className="w-4 h-4" />
        </button>
      </div>

      {/* Center Cinematic Rocket Animation */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
        {/* Massive Countdown */}
        {!isLiftoff ? (
          <motion.div
            key={seconds}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="mb-8"
          >
            <div className="font-mono text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_35px_rgba(255,255,255,0.4)]">
              T-{seconds.toString().padStart(2, '0')}
            </div>
            <span className="font-mono text-xs text-amber-400 tracking-[0.3em] uppercase font-bold block mt-2">
              AUTOMATED LAUNCH SEQUENCE COUNTDOWN
            </span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 space-y-2"
          >
            <div className="font-mono text-4xl md:text-6xl font-black text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              ASCENT NOMINAL
            </div>
            <span className="font-mono text-sm text-cyan-300 tracking-wider uppercase block font-bold">
              {stageSeparation ? 'SECOND STAGE BURNOUT SEQUENCE' : 'FIRST STAGE POWERED BOOST'}
            </span>
          </motion.div>
        )}

        {/* Procedural Rocket Silhouette with Flame & Particles */}
        <div className="relative w-28 h-64 flex items-center justify-center">
          <motion.div
            animate={
              isLiftoff
                ? { y: [-10, -180], transition: { duration: 6, ease: 'easeIn' } }
                : seconds <= 5
                ? { x: [-2, 2, -2, 2, 0], transition: { repeat: Infinity, duration: 0.1 } }
                : {}
            }
            className="relative flex flex-col items-center"
          >
            {/* Spacecraft Payload Fairing */}
            <div className="w-10 h-16 bg-gradient-to-b from-white to-slate-300 rounded-t-full border border-slate-400 shadow-lg" />
            {/* Upper Stage */}
            <div className="w-12 h-20 bg-slate-200 border-x border-slate-400 flex items-center justify-center">
              <span className="text-[9px] font-mono font-bold text-slate-800 rotate-90">NASA</span>
            </div>
            {/* Interstage */}
            <div className="w-13 h-4 bg-slate-800" />
            {/* Core Booster */}
            <div className="w-14 h-32 bg-gradient-to-b from-slate-100 to-slate-300 border-x border-slate-400 flex flex-col items-center justify-between py-2">
              <span className="text-[8px] font-mono font-bold text-blue-900 tracking-wider">USA</span>
              <div className="w-full h-1 bg-amber-500" />
            </div>

            {/* Exhaust Plume & Flame */}
            {(seconds <= 5 || isLiftoff) && (
              <motion.div
                animate={{
                  scaleY: [1, 1.3, 1],
                  opacity: [0.85, 1, 0.85],
                }}
                transition={{ repeat: Infinity, duration: 0.12 }}
                className="w-8 h-28 bg-gradient-to-b from-cyan-400 via-orange-500 to-transparent rounded-b-full filter blur-[2px] shadow-[0_0_35px_#ff6600]"
              />
            )}
          </motion.div>
        </div>

        {/* Phase Status Banner */}
        <div className="mt-8 max-w-xl px-5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md font-mono text-xs text-cyan-300">
          <span className="text-slate-500 mr-2">[FLIGHT TELEMETRY]</span>
          {phaseText}
        </div>
      </div>

      {/* Bottom Telemetry Gauges */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs border-t border-slate-800/80 bg-slate-950/80">
        <div>
          <span className="text-slate-500 block">Altitude</span>
          <span className="text-lg font-bold text-white">{altitudeKm} km</span>
        </div>
        <div>
          <span className="text-slate-500 block">Velocity</span>
          <span className="text-lg font-bold text-cyan-400">{velocityKmS} km/s</span>
        </div>
        <div>
          <span className="text-slate-500 block">Downrange</span>
          <span className="text-lg font-bold text-white">{Math.round(altitudeKm * 0.8)} km</span>
        </div>
        <div>
          <span className="text-slate-500 block">Booster Thrust</span>
          <span className="text-lg font-bold text-emerald-400">{seconds <= 5 ? '100% 7.8 MN' : '0.0 MN'}</span>
        </div>
      </div>
    </div>
  );
};
