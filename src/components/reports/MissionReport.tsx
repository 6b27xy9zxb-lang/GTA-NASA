import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Sparkles,
  RotateCcw,
  Layers,
  Download,
  Share2,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';
import realMissionsList from '../../data/realMissions.json';
import scenariosList from '../../data/scenarios.json';
import chassisList from '../../data/chassis.json';

export const MissionReport: React.FC = () => {
  const {
    simulationResult,
    missionScore,
    config,
    setScreen,
    startMission,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'real_missions'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (simulationResult?.finalState === 'success') {
      sound.playVictoryFanfare();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else if (simulationResult?.finalState === 'failure') {
      sound.playDefeatChime();
    }
  }, [simulationResult]);

  if (!simulationResult || !missionScore) {
    return (
      <div className="min-h-screen bg-space-950 text-slate-100 flex items-center justify-center p-4">
        <p className="font-mono text-cyan-400">Compiling mission archive telemetry...</p>
      </div>
    );
  }

  const scenario = scenariosList.find((s) => s.id === config.scenarioId) || scenariosList[0];
  const chassis = chassisList.find((c) => c.id === config.chassisId) || chassisList[0];

  const handleExportJson = () => {
    sound.playUiClick();
    const exportData = {
      mission: scenario.title,
      destination: scenario.destination,
      chassis: chassis.name,
      config,
      score: missionScore,
      finalState: simulationResult.finalState,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GTA_NASA_Mission_${scenario.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    sound.playUiClick();
    navigator.clipboard.writeText(
      `GTA NASA Mission Debrief: Scored ${missionScore.overallScore}/1000 on "${scenario.title}" with the ${chassis.name} spaceframe!`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 p-4 md:p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1.5 font-bold">
                <span>KEPLER ARCHIVE RECORD // EXPEDITION DEBRIEF</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                {scenario.title.toUpperCase()}
              </h2>
              <p className="text-xs md:text-sm text-slate-400 font-mono mt-1">
                CHASSIS: {chassis.name} // DESTINATION: {scenario.destination}
              </p>
            </div>

            {/* Final Outcome Banner & Big Score */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="font-mono text-xs text-slate-400 uppercase tracking-wider block">
                  Composite Evaluation
                </span>
                <span className="text-4xl md:text-6xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                  {missionScore.overallScore}
                </span>
                <span className="text-xs font-mono text-slate-500 block">/ 1,000 PTS</span>
              </div>

              <div
                className={`px-4 py-3 rounded-2xl border font-bold flex flex-col items-center justify-center text-center ${
                  simulationResult.finalState === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : simulationResult.finalState === 'partial_success'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                }`}
              >
                {simulationResult.finalState === 'success' ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 mb-1 text-emerald-400" />
                    <span className="text-xs font-mono uppercase font-black">MISSION SUCCESS</span>
                  </>
                ) : simulationResult.finalState === 'partial_success' ? (
                  <>
                    <AlertTriangle className="w-6 h-6 mb-1 text-amber-400" />
                    <span className="text-xs font-mono uppercase font-black">PARTIAL SUCCESS</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 mb-1 text-rose-400" />
                    <span className="text-xs font-mono uppercase font-black">MISSION LOSS</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800 font-mono text-xs">
            <button
              onClick={() => {
                sound.playUiClick();
                setActiveTab('overview');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Telemetry Breakdown
            </button>
            <button
              onClick={() => {
                sound.playUiClick();
                setActiveTab('lessons');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                activeTab === 'lessons'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Why Did This Happen?
            </button>
            <button
              onClick={() => {
                sound.playUiClick();
                setActiveTab('real_missions');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                activeTab === 'real_missions'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Real Mission Comparisons
            </button>
          </div>
        </div>

        {/* Tab 1: Overview & Score Breakdown */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Score Breakdown Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Science Return (40%)</span>
                <span className="text-xl font-bold text-purple-400">{missionScore.scienceScore} / 400</span>
                <span className="text-[10px] text-slate-500 block">{simulationResult.totalScienceDownlinked} GB telemetry</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Engineering Margin (20%)</span>
                <span className="text-xl font-bold text-cyan-400">{missionScore.engineeringEfficiency} / 200</span>
                <span className="text-[10px] text-slate-500 block">Subsystems stability</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Budget Efficiency (15%)</span>
                <span className="text-xl font-bold text-emerald-400">{missionScore.budgetEfficiency} / 150</span>
                <span className="text-[10px] text-slate-500 block">${simulationResult.calculation.totalBudgetMillion}M used</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Survival Integrity (15%)</span>
                <span className="text-xl font-bold text-orange-400">{missionScore.survivalScore} / 150</span>
                <span className="text-[10px] text-slate-500 block">{simulationResult.finalHullPercent}% hull preserved</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 col-span-2 md:col-span-1">
                <span className="text-slate-400 text-[11px] block">Resource Mgmt (10%)</span>
                <span className="text-xl font-bold text-blue-400">{missionScore.resourceScore} / 100</span>
                <span className="text-[10px] text-slate-500 block">{simulationResult.finalFuelKg} kg fuel margin</span>
              </div>
            </div>

            {/* AI / Rule-Based Mission Narrative */}
            {missionScore.aiNarrative && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed space-y-2">
                <span className="text-cyan-400 font-bold uppercase tracking-wider block">
                  [ FLIGHT RECORDER LOG ARCHIVE ]
                </span>
                <p className="whitespace-pre-line">{missionScore.aiNarrative}</p>
              </div>
            )}

            {/* Earned Achievements */}
            {missionScore.earnedAchievements.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Earned Mission Badges & Commendations:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {missionScore.earnedAchievements.map((ach) => (
                    <span
                      key={ach}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold"
                    >
                      🏆 {ach.replace('ach-', '').replace(/-/g, ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Why Did This Happen? (Causal Engineering Lessons) */}
        {activeTab === 'lessons' && (
          <div className="space-y-4 font-sans">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                WHY DID THIS HAPPEN? // CAUSAL ENGINEERING ANALYSIS
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Spacecraft engineering is governed by strict physical trade-offs. The following cause-and-effect explanations demystify how your hardware decisions dictated mission survival:
              </p>

              <div className="space-y-3 pt-2">
                {missionScore.causeAndEffectExplanations.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="font-mono text-xs text-cyan-400 font-bold block">
                      Subsystem Interaction #{idx + 1}
                    </span>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{exp}</p>
                  </div>
                ))}
              </div>

              {missionScore.recommendations.length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <span className="font-mono text-xs text-amber-400 font-bold uppercase tracking-wider block mb-2">
                    Actionable Guidance For Next Spacecraft Iteration:
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {missionScore.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0 mt-0.5">›</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Real Mission Comparisons */}
        {activeTab === 'real_missions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
            {realMissionsList.map((m) => (
              <div key={m.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-base text-white">{m.name}</h4>
                    <span className="font-mono text-xs text-cyan-400">{m.target} (Launch {m.launchYear})</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400">${m.costBillionUsd}B USD</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300">
                  <span>Dry Mass: {m.dryMassKg} kg</span>
                  <span>Propellant: {m.propellantMassKg} kg</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-0.5">Key Challenge:</strong>
                  {m.keyEngineeringChallenge}
                </p>

                <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40 text-[11px] text-blue-200 leading-relaxed font-sans">
                  <strong className="text-blue-300 font-mono text-[10px] uppercase block mb-0.5">
                    GTA NASA Comparison:
                  </strong>
                  {m.educationalComparison}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playUiClick();
                setScreen('hangar');
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 transition-colors"
            >
              Return to Hangar
            </button>
            <button
              onClick={() => {
                sound.playLaunchIgnition();
                startMission();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry Mission Run
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-cyan-400 flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> {copiedLink ? 'Copied debrief!' : 'Share Score'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
