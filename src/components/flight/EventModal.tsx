import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Radio,
  ShieldAlert,
  Sparkles,
  Fuel,
  Zap,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { MissionEvent, MissionEventOption } from '../../types/game';
import { sound } from '../../services/soundEffects';

interface EventModalProps {
  event: MissionEvent;
  onChooseOption: (optionId: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onChooseOption }) => {
  const isHighStakes = event.isHighStakesDistress;

  const handleSelect = (opt: MissionEventOption) => {
    if (opt.isFatalOnFailure) {
      sound.playAlarm();
    } else {
      sound.playUiClick();
    }
    onChooseOption(opt.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`max-w-xl w-full p-6 md:p-7 rounded-2xl border shadow-2xl space-y-5 ${
          isHighStakes
            ? 'bg-slate-900 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.3)]'
            : 'bg-slate-900/95 border-cyan-500/60 shadow-[0_0_40px_rgba(0,240,255,0.25)]'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isHighStakes
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 animate-pulse'
                  : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
              }`}
            >
              {isHighStakes ? <AlertTriangle className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
            </div>
            <div>
              <span className="font-mono text-[10px] text-amber-400 tracking-widest uppercase font-bold block">
                [ TACTICAL MISSION EVENT // SIMULATION PAUSED ]
              </span>
              <h3 className="font-black text-lg md:text-xl text-white tracking-wide">
                {event.title}
              </h3>
            </div>
          </div>

          <span
            className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded uppercase border ${
              isHighStakes
                ? 'bg-amber-950 text-amber-400 border-amber-500/60'
                : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {event.severity}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
          {event.description}
        </p>

        {/* Options Selection */}
        <div className="space-y-3">
          <span className="font-mono text-xs text-slate-400 uppercase tracking-wider block font-bold">
            Select Tactical Response:
          </span>

          {event.options.map((opt) => (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt)}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-400/80 hover:bg-slate-900 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                  {opt.label}
                </span>
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    opt.riskProbabilityPercent === 0
                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                      : opt.riskProbabilityPercent >= 50
                      ? 'bg-rose-950/70 text-rose-400 border border-rose-500/40'
                      : 'bg-amber-950/70 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {opt.riskProbabilityPercent === 0 ? 'SAFE' : `${opt.riskProbabilityPercent}% RISK`}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-sans">{opt.riskDescription}</p>

              {/* Resource Impact Tags */}
              <div className="flex items-center gap-3 font-mono text-[11px] pt-1 text-slate-300">
                {opt.scienceBonus > 0 && (
                  <span className="text-purple-400 flex items-center gap-1 font-bold">
                    <Sparkles className="w-3 h-3" /> +{opt.scienceBonus} Science
                  </span>
                )}
                {opt.fuelImpactKg !== 0 && (
                  <span className="text-orange-400 flex items-center gap-1">
                    <Fuel className="w-3 h-3" /> {opt.fuelImpactKg} kg Propellant
                  </span>
                )}
                {opt.hullImpact !== 0 && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> {opt.hullImpact} HP Hull
                  </span>
                )}
              </div>

              {/* Engineering explanation */}
              <p className="text-[11px] text-slate-500 italic font-mono border-t border-slate-900 pt-1.5">
                Physics Brief: {opt.engineeringExplanation}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
