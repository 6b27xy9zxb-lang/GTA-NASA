import React from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Moon,
  Compass,
  ArrowRight,
  Shield,
  Zap,
  Radio,
  Clock,
  DollarSign,
  Weight,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import scenariosList from '../../data/scenarios.json';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';
import { Scenario } from '../../types/game';

export const ScenarioSelect: React.FC = () => {
  const { setScreen, selectScenario, config } = useGameStore();

  const handleSelect = (scenarioId: string) => {
    sound.playEquipSound();
    selectScenario(scenarioId);
    setScreen('hangar');
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400';
      case 'Intermediate':
        return 'bg-amber-500/10 border-amber-500/40 text-amber-400';
      case 'Advanced':
        return 'bg-rose-500/10 border-rose-500/40 text-rose-400';
      default:
        return 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400';
    }
  };

  const getDestinationIcon = (id: string) => {
    if (id === 'scenario-earth') return <Globe className="w-5 h-5 text-blue-400" />;
    if (id === 'scenario-moon') return <Moon className="w-5 h-5 text-slate-300" />;
    if (id === 'scenario-mars') return <Compass className="w-5 h-5 text-orange-400" />;
    return <Sparkles className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 p-6 md:p-10 select-none">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={() => {
              sound.playUiClick();
              setScreen('landing');
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> [ RETURN TO MISSION CONTROL ]
          </button>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            MISSION SCENARIO SELECTION
          </h2>
          <p className="text-sm text-slate-400 font-sans mt-1">
            Choose an expedition profile to initiate spacecraft architecture and system design.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>4 OPERATIONAL SCENARIOS AVAILABLE</span>
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {(scenariosList as Scenario[]).map((sc, index) => {
          const isSelected = config.scenarioId === sc.id;

          return (
            <motion.div
              key={sc.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all backdrop-blur-sm ${
                isSelected
                  ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      {getDestinationIcon(sc.id)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{sc.title}</h3>
                      <span className="text-xs font-mono text-slate-400 block">{sc.destination}</span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold border uppercase ${getDifficultyBadge(
                      sc.difficulty
                    )}`}
                  >
                    {sc.difficulty}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-5">{sc.description}</p>

                {/* Key Constraint Badges */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 font-mono text-xs mb-5">
                  <div className="flex flex-col">
                    <span className="text-slate-500 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Budget
                    </span>
                    <span className="font-bold text-slate-200 mt-0.5">${sc.budgetLimitMillion}M</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Weight className="w-3.5 h-3.5 text-amber-400" /> Mass Limit
                    </span>
                    <span className="font-bold text-slate-200 mt-0.5">{sc.massLimitKg} kg</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> Duration
                    </span>
                    <span className="font-bold text-slate-200 mt-0.5">{sc.missionDurationYears} Years</span>
                  </div>
                </div>

                {/* Environmental Challenges Preview */}
                <div className="mb-5">
                  <span className="text-xs font-mono text-slate-400 tracking-wider uppercase block mb-1.5 font-semibold">
                    Critical Environmental Constraints:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {sc.environmentalChallenges.map((ch, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 shrink-0 font-bold">•</span>
                        <span>{ch}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Educational Note */}
                <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/40 text-xs text-blue-200 leading-relaxed font-sans">
                  <strong className="text-blue-300 font-mono uppercase text-[10px] block mb-1">
                    Engineering Physics Brief:
                  </strong>
                  {sc.educationalNotes}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500">
                  Target Science: <strong className="text-cyan-400 font-bold">{sc.minScienceGoal} pts</strong>
                </span>

                <button
                  onClick={() => handleSelect(sc.id)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'bg-slate-800 hover:bg-cyan-500/20 hover:border-cyan-500/50 text-slate-200 border border-slate-700'
                  }`}
                >
                  <span>Select Mission</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
