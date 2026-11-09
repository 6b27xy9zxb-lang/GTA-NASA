import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Cpu,
  X,
  Send,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Rocket,
  Shield,
  Layers,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';
import { consultAiMissionArchitect, AIAdvisorResponse } from '../../services/aiGatewayService';
import scenariosList from '../../data/scenarios.json';
import launchersList from '../../data/launchers.json';
import { Scenario } from '../../types/game';

interface AiArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiArchitectModal: React.FC<AiArchitectModalProps> = ({ isOpen, onClose }) => {
  const { config, calculation, setLauncher } = useGameStore();
  const [goalText, setGoalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIAdvisorResponse | null>(null);

  const scenarios = scenariosList as Scenario[];
  const scenario: Scenario = scenarios.find((s) => s.id === config.scenarioId) ?? scenarios[0];

  const presetGoals = [
    'Fast trajectory flyby with maximum delta-V and high-res imaging',
    'Low-cost mission designed to maximize science yield under strict budget limits',
    'Deep ice penetration and biosignature scan with high radiation resilience',
    'Long-endurance orbital survey with redundant avionics and high data downlink',
  ];

  const handleConsult = async () => {
    if (!goalText.trim()) return;
    sound.playUiClick();
    setLoading(true);

    try {
      const res = await consultAiMissionArchitect(goalText, scenario, config, calculation);
      setResponse(res);
      sound.playEquipSound();
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLauncher = (launcherName: string) => {
    const l = launchersList.find((item) => item.name.toLowerCase().includes(launcherName.toLowerCase()));
    if (l) {
      sound.playEquipSound();
      setLauncher(l.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-2xl w-full p-6 md:p-7 rounded-3xl bg-slate-900 border border-cyan-500/50 shadow-[0_0_50px_rgba(0,240,255,0.25)] space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-widest block">
                AI GATEWAY // NEURAL FLIGHT CONSULTANT
              </span>
              <h3 className="font-black text-lg md:text-xl text-white">
                AI Mission Architect
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input prompt */}
        <div className="space-y-2">
          <label className="font-mono text-xs text-slate-300 font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Describe Your Mission Goals & Spacecraft Concept:
          </label>
          <textarea
            rows={3}
            placeholder="e.g. I want to build a lightweight, high-speed probe to reach Europa quickly, prioritizing radar soundings while staying strictly under the $500M budget limit..."
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
          />

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] font-mono text-slate-500 mr-1 self-center">Quick Concepts:</span>
            {presetGoals.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setGoalText(preset)}
                className="px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition-colors"
              >
                {preset.slice(0, 32)}...
              </button>
            ))}
          </div>
        </div>

        {/* Consult Button */}
        <button
          onClick={handleConsult}
          disabled={loading || !goalText.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          {loading ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Synthesizing Design Recommendations via AI Gateway...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Generate Personalized Trade-Offs & Launch Recommendations</span>
            </>
          )}
        </button>

        {/* Generated AI Architect Response */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-4 border-t border-slate-800 font-sans"
          >
            {/* Header info */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-cyan-400 font-bold uppercase">{response.headline}</span>
                <span className="text-slate-500 text-[10px] uppercase">Source: {response.source}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{response.strategicSummary}</p>
            </div>

            {/* Design Trade-Offs */}
            {response.designTradeOffs.length > 0 && (
              <div className="space-y-2">
                <span className="font-mono text-xs text-amber-400 font-bold uppercase tracking-wider block">
                  Identified Engineering Trade-Offs:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {response.designTradeOffs.map((to, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                      <span className="font-bold text-white block">{to.aspect}</span>
                      <div className="text-emerald-400 flex items-start gap-1.5 leading-snug">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{to.pro}</span>
                      </div>
                      <div className="text-rose-400/90 flex items-start gap-1.5 leading-snug">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{to.con}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Subsystem Modifications */}
            {response.subsystemModifications.length > 0 && (
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs space-y-1.5">
                <span className="font-mono text-[11px] text-cyan-300 font-bold uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Recommended Hardware Modifications:
                </span>
                <ul className="space-y-1 text-slate-300">
                  {response.subsystemModifications.map((mod, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">›</span>
                      <span>{mod}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Launcher Recommendation */}
            {response.launcherRecommendation && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">Optimal Launch Vehicle</span>
                  <span className="font-bold text-sm text-emerald-400">
                    {response.launcherRecommendation.recommendedLauncher}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{response.launcherRecommendation.reasoning}</p>
                </div>
                <button
                  onClick={() => handleApplyLauncher(response.launcherRecommendation.recommendedLauncher)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono shrink-0"
                >
                  Apply Launcher
                </button>
              </div>
            )}

            {/* Governing Physics Explanation */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 font-mono italic">
              <strong>Physics Validation:</strong> {response.physicsExplanation}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
