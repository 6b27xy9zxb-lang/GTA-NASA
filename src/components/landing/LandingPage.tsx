import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  Users,
  Compass,
  Play,
  Volume2,
  VolumeX,
  Sparkles,
  Terminal,
  ShieldAlert,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';

export const LandingPage: React.FC = () => {
  const { setScreen, isAudioMuted, toggleAudio, createRoom } = useGameStore();

  const fullStory =
    "Earth's resources are depleted. You are the commander of the GTA NASA mission. Reach the Kepler sector. Millions are counting on you. Do not fail.";
  const [displayedStory, setDisplayedStory] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedStory(fullStory.slice(0, index));
      index++;
      if (index > fullStory.length) {
        clearInterval(interval);
      }
    }, 28);
    return () => clearInterval(interval);
  }, []);

  const handleStartMission = () => {
    sound.playUiClick();
    sound.startAmbientDrone();
    setScreen('scenario');
  };

  const handleCreateRoom = () => {
    sound.playUiClick();
    createRoom();
    setScreen('multiplayer');
  };

  const handleJoinRoom = () => {
    sound.playUiClick();
    setScreen('multiplayer');
  };

  const handleTutorial = () => {
    sound.playUiClick();
    setScreen('tutorial');
  };

  const handleSandbox = () => {
    sound.playUiClick();
    useGameStore.getState().setSandboxMode(true);
    setScreen('sandbox');
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-space-950 text-slate-100 select-none">
      {/* Background Starfield & Nebula Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-space-950 to-space-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff07_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff07_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Rocket className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-mono text-xs text-cyan-400 tracking-widest uppercase block font-semibold">
              NASA Space Apps 2026 // Prototype
            </span>
            <span className="font-extrabold tracking-wider text-sm text-slate-200">
              GTA NASA MISSION CONTROL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playUiClick();
              toggleAudio();
              sound.setMuted(!isAudioMuted);
            }}
            className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors"
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            KEPLER FLEET SIMULATOR READY
          </div>
        </div>
      </header>

      {/* Center Cinematic Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto my-8">
        {/* Story Typewriter Terminal */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 max-w-2xl px-5 py-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md shadow-2xl flex items-center gap-3 text-left font-mono text-xs md:text-sm text-slate-300"
        >
          <Terminal className="w-5 h-5 text-cyan-400 shrink-0 animate-pulse" />
          <p className="min-h-[2.5rem] leading-relaxed">
            {displayedStory}
            <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
          </p>
        </motion.div>

        {/* Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="space-y-3 mb-6"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_0_35px_rgba(0,240,255,0.3)]">
            GTA NASA
          </h1>
          <div className="inline-block px-4 py-1 rounded-md bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-mono text-xs md:text-sm tracking-[0.3em] uppercase font-bold">
            MISSION CONTROL // KEPLER SECTOR
          </div>
          <p className="text-sm md:text-lg text-slate-400 font-medium tracking-wide">
            DESIGN. LAUNCH. SURVIVE. DISCOVER.
          </p>
        </motion.div>

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 w-full max-w-3xl mt-4"
        >
          <button
            onClick={handleStartMission}
            className="group relative p-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center justify-between shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="text-left">
              <span className="text-xs uppercase tracking-wider block opacity-80 font-mono">Campaign</span>
              <span className="text-base font-extrabold flex items-center gap-1.5">
                <Play className="w-4 h-4 fill-current" /> Initialize Mission
              </span>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleStartMission}
            className="group p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 font-semibold flex items-center justify-between transition-all hover:-translate-y-0.5"
          >
            <div className="text-left">
              <span className="text-xs uppercase tracking-wider block text-slate-400 font-mono">Solo Pilot</span>
              <span className="text-base font-bold flex items-center gap-1.5 text-white">
                <Rocket className="w-4 h-4 text-cyan-400" /> Play Solo
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
          </button>

          <button
            onClick={handleCreateRoom}
            className="group p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 font-semibold flex items-center justify-between transition-all hover:-translate-y-0.5"
          >
            <div className="text-left">
              <span className="text-xs uppercase tracking-wider block text-slate-400 font-mono">Co-Op Flight</span>
              <span className="text-base font-bold flex items-center gap-1.5 text-white">
                <Users className="w-4 h-4 text-amber-400" /> Create Team Room
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
          </button>

          <button
            onClick={handleJoinRoom}
            className="group p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 text-slate-300 font-medium flex items-center justify-between transition-all"
          >
            <div className="text-left">
              <span className="text-xs uppercase tracking-wider block text-slate-500 font-mono">Multiplayer</span>
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" /> Join Room Code
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={handleTutorial}
            className="group p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 text-slate-300 font-medium flex items-center justify-between transition-all"
          >
            <div className="text-left">
              <span className="text-xs uppercase tracking-wider block text-slate-500 font-mono">Academy</span>
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" /> Flight Academy
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={handleSandbox}
            className="group p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 text-slate-300 font-medium flex items-center justify-between transition-all"
          >
            <div className="text-left">
              <span className="text-xs uppercase tracking-wider block text-slate-500 font-mono">Unlimited</span>
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" /> Engineering Sandbox
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </motion.div>

        {/* Spacecraft Engineering Concept Summary */}
        <div className="mt-10 max-w-3xl text-xs md:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-5 font-sans">
          <p>
            <strong className="text-slate-200">The Spacecraft Engineering Dilemma:</strong> In real space exploration, there is no universal super-ship. Heavy radar yields breakthrough discoveries but drains massive power. Radiation shielding keeps computers alive near Jupiter but consumes payload mass needed for propellant. Your mission is to build the optimal vehicle within realistic physics and budget constraints.
          </p>
        </div>
      </main>

      {/* Footer Legal & Educational Notice */}
      <footer className="relative z-10 px-6 py-4 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between text-xs font-mono text-slate-500 border-t border-slate-900">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500/70" />
          <span>Independent Educational Project // Simplified Physics & Engineering Simulation Model</span>
        </div>
        <div className="mt-2 md:mt-0 flex items-center gap-4">
          <span>Target: Kepler Sector</span>
          <span>NASA Space Apps Challenge 2026</span>
        </div>
      </footer>
    </div>
  );
};
