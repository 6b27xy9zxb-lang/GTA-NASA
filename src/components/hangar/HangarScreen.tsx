import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Zap,
  Gauge,
  Radio,
  Fuel,
  Cpu,
  Layers,
  ArrowRight,
  ChevronLeft,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import chassisList from '../../data/chassis.json';
import modulesList from '../../data/modules.json';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';
import { Chassis, UpgradeModule } from '../../types/game';

export const HangarScreen: React.FC = () => {
  const { config, calculation, selectChassis, toggleModule, setScreen } = useGameStore();

  const currentChassis =
    (chassisList as Chassis[]).find((c) => c.id === config.chassisId) || (chassisList[0] as Chassis);

  const maxSlots = currentChassis.hardpointSlots;
  const usedSlots = config.installedModules.length;
  const remainingSlots = maxSlots - usedSlots;

  const [activeTab, setActiveTab] = useState<'chassis' | 'modules'>('chassis');
  const [selectedModuleDetail, setSelectedModuleDetail] = useState<UpgradeModule | null>(null);

  const handleChassisSelect = (id: string) => {
    sound.playEquipSound();
    selectChassis(id as any);
  };

  const handleModuleClick = (mod: UpgradeModule) => {
    const isEquipped = config.installedModules.includes(mod.id);
    if (!isEquipped && remainingSlots <= 0) {
      sound.playAlarm();
      return;
    }
    sound.playEquipSound();
    toggleModule(mod.id);
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 p-4 md:p-8 select-none">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <button
            onClick={() => {
              sound.playUiClick();
              setScreen('scenario');
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 mb-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> [ RETURN TO SCENARIO SELECTION ]
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              HANGAR // SPACECRAFT ARCHITECTURE
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
              SLOTS: {usedSlots}/{maxSlots}
            </span>
          </div>
        </div>

        {/* Proceed to Mission Builder button */}
        <button
          onClick={() => {
            sound.playUiClick();
            setScreen('builder');
          }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Proceed to Mission Builder</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chassis Selection (4 Cards) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Spacecraft Chassis Class
            </h3>
            <span className="text-xs font-mono text-slate-500">4 Base Architectures</span>
          </div>

          <div className="space-y-3">
            {(chassisList as Chassis[]).map((chassis) => {
              const isSelected = config.chassisId === chassis.id;

              return (
                <div
                  key={chassis.id}
                  onClick={() => handleChassisSelect(chassis.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-white">{chassis.name}</h4>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-400 text-slate-950 font-extrabold uppercase">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono block">{chassis.tagline}</span>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <span className="text-cyan-400 font-bold block">${chassis.cost}M</span>
                      <span className="text-slate-500">{chassis.dryMass} kg dry</span>
                    </div>
                  </div>

                  {/* Attribute Bars */}
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Hull</span>
                      <span className="font-bold text-slate-200">{chassis.hullStrength} HP</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Speed</span>
                      <span className="font-bold text-slate-200">{chassis.speedRating}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Max Fuel</span>
                      <span className="font-bold text-slate-200">{chassis.maxFuelCapacity} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Hardpoints</span>
                      <span className={`font-bold ${chassis.hardpointSlots === 3 ? 'text-amber-400' : 'text-cyan-400'}`}>
                        {chassis.hardpointSlots} slots
                      </span>
                    </div>
                  </div>

                  {/* Special Ability & Trade-off */}
                  <div className="mt-3 text-xs space-y-1">
                    <p className="text-emerald-400 flex items-start gap-1.5 leading-snug">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{chassis.specialAbility}</span>
                    </p>
                    <p className="text-rose-400/90 flex items-start gap-1.5 leading-snug">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{chassis.disadvantage}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Modification Interface (10 Modules) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" /> Upgrade Modules & Hardpoints
            </h3>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Remaining Slots:</span>
              <span
                className={`px-2 py-0.5 rounded font-bold ${
                  remainingSlots === 0
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {remainingSlots} available
              </span>
            </div>
          </div>

          {/* Hardpoint Slot Visualizer */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
              Structural Hardpoints ({usedSlots}/{maxSlots}):
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from({ length: maxSlots }).map((_, i) => {
                const installedId = config.installedModules[i];
                const installedMod = (modulesList as UpgradeModule[]).find((m) => m.id === installedId);

                return (
                  <div
                    key={i}
                    className={`h-9 px-3 rounded-lg border flex items-center gap-1.5 text-xs font-mono transition-all ${
                      installedMod
                        ? 'bg-cyan-950/50 border-cyan-400/60 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-600 border-dashed'
                    }`}
                  >
                    {installedMod ? (
                      <>
                        <span className="truncate max-w-[120px] font-bold">{installedMod.name}</span>
                        <button
                          onClick={() => handleModuleClick(installedMod)}
                          className="hover:text-rose-400 ml-1"
                          title="Remove module"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span>Slot {i + 1} [EMPTY]</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modules List (10 Modules) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {(modulesList as UpgradeModule[]).map((mod) => {
              const isEquipped = config.installedModules.includes(mod.id);
              const isDisabled = !isEquipped && remainingSlots <= 0;

              return (
                <div
                  key={mod.id}
                  onClick={() => !isDisabled && handleModuleClick(mod)}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all select-none ${
                    isEquipped
                      ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : isDisabled
                      ? 'bg-slate-900/30 border-slate-800/60 opacity-50 cursor-not-allowed'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-1.5">
                      <h5 className="font-bold text-sm text-slate-100">{mod.name}</h5>
                      <span className="font-mono text-xs text-cyan-400 font-bold">${mod.cost}M</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug mb-2">{mod.description}</p>

                    {/* Resource Consequences (3 distinct impacts) */}
                    <div className="space-y-1 mb-2 font-mono text-[11px]">
                      {mod.resourceImpactsSummary.map((impact, idx) => (
                        <div key={idx} className="flex items-start gap-1 text-slate-300">
                          <span className="text-cyan-400 font-bold shrink-0">›</span>
                          <span className="leading-tight">{impact}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-[11px] font-mono">
                    <span className="text-slate-500">Mass: +{mod.mass} kg</span>
                    <button
                      disabled={isDisabled}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        isEquipped
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          : isDisabled
                          ? 'bg-slate-800 text-slate-500'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                      }`}
                    >
                      {isEquipped ? 'Remove [-]' : 'Equip [+]'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
