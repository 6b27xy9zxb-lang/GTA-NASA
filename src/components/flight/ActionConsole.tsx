import React from 'react';
import {
  Zap,
  Navigation,
  Radio,
  EyeOff,
  AlertOctagon,
  Activity,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';

export const ActionConsole: React.FC = () => {
  const { triggerEmergencyAction } = useGameStore();

  const handleAction = (
    type: 'reroute_power' | 'evasive' | 'adjust_comms' | 'reduce_instruments' | 'emergency_protocol'
  ) => {
    sound.playEquipSound();
    triggerEmergencyAction(type);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 p-4 space-y-3 backdrop-blur-md shadow-xl select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Tactical Subsystem Console
        </h4>
        <span className="text-[10px] font-mono text-emerald-400 font-bold">MANUAL OVERRIDES ONLINE</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Reroute Power */}
        <button
          onClick={() => handleAction('reroute_power')}
          className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs text-white group-hover:text-cyan-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Reroute Power
            </span>
            <span className="font-mono text-[10px] text-slate-500">Grid</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 block leading-tight">
            Prioritize attitude reaction wheels over auxiliary science sensors.
          </span>
        </button>

        {/* Evasive Maneuvers */}
        <button
          onClick={() => handleAction('evasive')}
          className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-orange-950/40 border border-slate-800 hover:border-orange-500/50 text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs text-white group-hover:text-orange-300 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-orange-400" /> Evasive Burst
            </span>
            <span className="font-mono text-[10px] text-orange-400 font-bold">-15 kg Fuel</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 block leading-tight">
            Fire RCS thrusters to evade oncoming debris field or density pocket.
          </span>
        </button>

        {/* Adjust Communication */}
        <button
          onClick={() => handleAction('adjust_comms')}
          className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs text-white group-hover:text-blue-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400" /> Slew Antenna
            </span>
            <span className="font-mono text-[10px] text-slate-500">+6 dB SNR</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 block leading-tight">
            Align high-gain dish gimbals directly with Goldstone Deep Space Network.
          </span>
        </button>

        {/* Reduce Instrument Activity */}
        <button
          onClick={() => handleAction('reduce_instruments')}
          className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs text-white group-hover:text-purple-300 flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-purple-400" /> Sensor Standby
            </span>
            <span className="font-mono text-[10px] text-emerald-400 font-bold">-45 W</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 block leading-tight">
            Place optical cameras into hibernation to preserve battery buffers.
          </span>
        </button>
      </div>

      {/* Emergency Protocol */}
      <button
        onClick={() => handleAction('emergency_protocol')}
        className="w-full py-2 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors font-mono"
      >
        <AlertOctagon className="w-4 h-4 text-rose-400" />
        <span>ENGAGE EMERGENCY SAFEGUARD PROTOCOL</span>
      </button>
    </div>
  );
};
