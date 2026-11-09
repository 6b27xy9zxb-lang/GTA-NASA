import React from 'react';
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { generateAdvisorAnalysis } from '../../services/missionAdvisor';
import { SpacecraftConfig, MissionCalculation } from '../../types/game';

interface AdvisorProps {
  config: SpacecraftConfig;
  calculation: MissionCalculation;
}

export const AdvisorPanel: React.FC<AdvisorProps> = ({ config, calculation }) => {
  const analysis = generateAdvisorAnalysis(config, calculation);

  const getStatusIcon = () => {
    switch (analysis.status) {
      case 'nominal':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'caution':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-rose-400" />;
    }
  };

  const getHeaderBorder = () => {
    switch (analysis.status) {
      case 'nominal':
        return 'border-emerald-500/30 bg-emerald-950/20';
      case 'caution':
        return 'border-amber-500/30 bg-amber-950/20';
      case 'critical':
        return 'border-rose-500/30 bg-rose-950/20';
    }
  };

  return (
    <div className={`rounded-2xl border p-4 md:p-5 select-none transition-all ${getHeaderBorder()}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            {getStatusIcon()}
          </div>
          <div>
            <span className="font-mono text-[10px] text-cyan-400 tracking-widest uppercase font-bold block">
              Autonomous Mission Advisor // Subsystem Analysis
            </span>
            <h4 className="font-bold text-sm md:text-base text-white tracking-wide">
              {analysis.headline}
            </h4>
          </div>
        </div>

        <span
          className={`font-mono text-xs font-bold px-2.5 py-1 rounded border uppercase ${
            analysis.status === 'nominal'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : analysis.status === 'caution'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}
        >
          {analysis.status}
        </span>
      </div>

      {/* Primary Diagnosis */}
      <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-4 font-sans">
        {analysis.primaryDiagnosis}
      </p>

      {/* Resource Impacts breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mb-4">
        {analysis.resourceImpacts.map((imp, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 font-semibold">{imp.resource}</span>
              {imp.state === 'good' ? (
                <span className="text-emerald-400 font-bold">PASS</span>
              ) : imp.state === 'warning' ? (
                <span className="text-amber-400 font-bold">WARN</span>
              ) : (
                <span className="text-rose-400 font-bold">FAIL</span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">{imp.detail}</p>
          </div>
        ))}
      </div>

      {/* Actionable Recommendations */}
      {analysis.actionableRecommendations.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80">
          <span className="font-mono text-[11px] text-amber-400 font-bold flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Actionable Engineering Recommendations:
          </span>
          <div className="space-y-1.5 font-sans text-xs text-slate-300">
            {analysis.actionableRecommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">›</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
