import React from 'react';
import {
  Weight,
  Zap,
  Radio,
  Fuel,
  DollarSign,
  ShieldAlert,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { MissionCalculation, SpacecraftConfig } from '../../types/game';

interface DashboardProps {
  calculation: MissionCalculation;
  config: SpacecraftConfig;
}

export const TelemetryDashboard: React.FC<DashboardProps> = ({ calculation, config }) => {
  const getStatusBadge = (isGood: boolean, isWarning?: boolean) => {
    if (isGood) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> NOMINAL
        </span>
      );
    }
    if (isWarning) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" /> CAUTION
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
        <XCircle className="w-3 h-3" /> CRITICAL
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 p-5 space-y-4 shadow-xl select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Mission Telemetry Dashboard
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Launch Readiness:</span>
          <span
            className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-full border ${
              calculation.isValidForLaunch
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50'
                : 'bg-rose-950/60 text-rose-400 border-rose-500/50'
            }`}
          >
            {calculation.successProbabilityPercent}% EST. SUCCESS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
        {/* 1. Mass vs Launcher */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
              <Weight className="w-4 h-4 text-cyan-400" /> Spacecraft Wet Mass
            </span>
            {getStatusBadge(calculation.isMassCompatible)}
          </div>
          <div className="flex items-baseline justify-between font-bold">
            <span className="text-base text-white">{calculation.totalMassKg} kg</span>
            <span className="text-[11px] text-slate-400">Cap: {calculation.launcherCapacityKg} kg</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                calculation.isMassCompatible ? 'bg-cyan-400' : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(100, (calculation.totalMassKg / calculation.launcherCapacityKg) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* 2. Power Balance */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
              <Zap className="w-4 h-4 text-amber-400" /> Power Balance
            </span>
            {getStatusBadge(calculation.netPowerMarginW >= 40, calculation.netPowerMarginW >= 0)}
          </div>
          <div className="flex items-baseline justify-between font-bold">
            <span className="text-base text-white">
              {calculation.availablePowerW} W gen
            </span>
            <span className="text-[11px] text-slate-400">Req: {calculation.requiredPowerW} W</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                calculation.netPowerMarginW >= 40
                  ? 'bg-emerald-400'
                  : calculation.netPowerMarginW >= 0
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (calculation.availablePowerW / Math.max(calculation.requiredPowerW, 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* 3. Telemetry Downlink */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
              <Radio className="w-4 h-4 text-blue-400" /> Data Downlink
            </span>
            {getStatusBadge(calculation.lostDataPercent === 0, calculation.lostDataPercent < 25)}
          </div>
          <div className="flex items-baseline justify-between font-bold">
            <span className="text-base text-white">{calculation.downlinkCapacityGbDay} GB/d</span>
            <span className="text-[11px] text-slate-400">Gen: {calculation.totalDataGeneratedGbDay} GB/d</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                calculation.lostDataPercent === 0 ? 'bg-blue-400' : 'bg-amber-400'
              }`}
              style={{ width: `${calculation.dataDownlinkEfficiencyPercent}%` }}
            />
          </div>
        </div>

        {/* 4. Delta-V Margin */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
              <Fuel className="w-4 h-4 text-orange-400" /> Delta-V Velocity
            </span>
            {getStatusBadge(calculation.isDeltaVCompatible)}
          </div>
          <div className="flex items-baseline justify-between font-bold">
            <span className="text-base text-white">{calculation.deltaVAvailableKmS} km/s</span>
            <span className="text-[11px] text-slate-400">Req: {calculation.deltaVRequiredKmS} km/s</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                calculation.isDeltaVCompatible ? 'bg-orange-400' : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (calculation.deltaVAvailableKmS / Math.max(calculation.deltaVRequiredKmS, 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* 5. Total Budget */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Mission Budget
            </span>
            {getStatusBadge(calculation.isBudgetCompatible)}
          </div>
          <div className="flex items-baseline justify-between font-bold">
            <span className="text-base text-white">${calculation.totalBudgetMillion}M</span>
            <span className="text-[11px] text-slate-400">Cap: ${calculation.budgetLimitMillion}M</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                calculation.isBudgetCompatible ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (calculation.totalBudgetMillion / calculation.budgetLimitMillion) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* 6. Radiation Exposure */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
              <ShieldAlert className="w-4 h-4 text-purple-400" /> Radiation Dose
            </span>
            {getStatusBadge(
              calculation.radiationSurvivalRisk === 'safe',
              calculation.radiationSurvivalRisk === 'caution'
            )}
          </div>
          <div className="flex items-baseline justify-between font-bold">
            <span className="text-base text-white">{calculation.effectiveRadiationDoseRadPerYear} Rad/yr</span>
            <span className="text-[11px] text-slate-400">Shield: {Math.round(calculation.shieldingFactor * 100)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                calculation.radiationSurvivalRisk === 'safe'
                  ? 'bg-purple-400'
                  : calculation.radiationSurvivalRisk === 'caution'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(100, (calculation.effectiveRadiationDoseRadPerYear / 1500) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
