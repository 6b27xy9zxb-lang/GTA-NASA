import React from 'react';
import { Cpu, ChevronLeft, ArrowRight, Play, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';
import { MissionBuilder } from '../builder/MissionBuilder';

export const SandboxScreen: React.FC = () => {
  const { setScreen, setSandboxMode } = useGameStore();

  const handleExitSandbox = () => {
    sound.playUiClick();
    setSandboxMode(false);
    setScreen('landing');
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col justify-between select-none">
      {/* Sandbox Alert Top Bar */}
      <div className="bg-purple-950/80 border-b border-purple-500/40 px-6 py-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-purple-300">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span className="font-bold uppercase tracking-wider">
            ENGINEERING SANDBOX MODE ACTIVE // BUDGET & MASS RESTRICTIONS RELAXED
          </span>
        </div>
        <button
          onClick={handleExitSandbox}
          className="text-purple-400 hover:text-white transition-colors underline"
        >
          Exit to Main Menu
        </button>
      </div>

      {/* Embed the standard Mission Builder with relaxed constraints */}
      <div className="flex-1">
        <MissionBuilder />
      </div>
    </div>
  );
};
