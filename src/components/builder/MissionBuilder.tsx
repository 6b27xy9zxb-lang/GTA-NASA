import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  Layers,
  Zap,
  Radio,
  Fuel,
  Cpu,
  Shield,
  Sparkles,
  ChevronLeft,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  Info,
} from 'lucide-react';
import componentsList from '../../data/components.json';
import instrumentsList from '../../data/instruments.json';
import launchersList from '../../data/launchers.json';
import scenariosList from '../../data/scenarios.json';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';
import { SpacecraftSvgDiagram } from './SpacecraftSvgDiagram';
import { TelemetryDashboard } from './TelemetryDashboard';
import { AdvisorPanel } from './AdvisorPanel';
import { AiArchitectModal } from './AiArchitectModal';
import { CoreComponent, ScientificInstrument, LaunchVehicle, Scenario } from '../../types/game';

export const MissionBuilder: React.FC = () => {
  const {
    config,
    calculation,
    setScreen,
    setCoreComponent,
    toggleInstrument,
    setFuelLoad,
    setLauncher,
    startMission,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'components' | 'instruments' | 'launcher'>('components');
  const [componentCategory, setComponentCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showAiArchitectModal, setShowAiArchitectModal] = useState(false);

  const scenario = (scenariosList as Scenario[]).find((s) => s.id === config.scenarioId) || scenariosList[0];

  const handleLaunchClick = () => {
    if (!calculation.isValidForLaunch) {
      sound.playAlarm();
      setShowErrorModal(true);
      return;
    }
    sound.playLaunchIgnition();
    startMission();
  };

  const filteredComponents = (componentsList as CoreComponent[]).filter((c) => {
    const matchCat = componentCategory === 'all' || c.category === componentCategory;
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredInstruments = (instrumentsList as ScientificInstrument[]).filter((inst) => {
    return (
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 p-4 md:p-6 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="max-w-[1600px] mx-auto w-full mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              sound.playUiClick();
              setScreen('hangar');
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> [ RETURN TO HANGAR ]
          </button>
          <div className="h-4 w-px bg-slate-800 hidden md:block" />
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              MISSION BUILDER // {scenario.title.toUpperCase()}
            </h2>
            <span className="text-xs font-mono text-slate-400">
              TARGET: {scenario.destination} // BUDGET: ${scenario.budgetLimitMillion}M // CEILING: {scenario.massLimitKg} kg
            </span>
          </div>
        </div>

        {/* Launch Readiness & Big Launch Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playUiClick();
              setShowAiArchitectModal(true);
            }}
            className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 flex items-center gap-2 transition-all hover:border-cyan-400 shadow-md"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>AI MISSION ARCHITECT</span>
          </button>

          <button
            onClick={handleLaunchClick}
            className={`px-7 py-3 rounded-xl font-black text-sm flex items-center gap-2.5 transition-all shadow-xl ${
              calculation.isValidForLaunch
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.35)] transform hover:-translate-y-0.5'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{calculation.isValidForLaunch ? 'AUTHORIZE LAUNCH SEQUENCE' : 'LAUNCH BLOCKED (ERRORS)'}</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* LEFT COLUMN: Component & Instrument Catalogue (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            {/* Top Catalogue Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800/80 mb-3 font-mono text-xs">
              <button
                onClick={() => {
                  sound.playUiClick();
                  setActiveTab('components');
                }}
                className={`py-1.5 rounded-lg font-bold transition-colors ${
                  activeTab === 'components' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Core Systems
              </button>
              <button
                onClick={() => {
                  sound.playUiClick();
                  setActiveTab('instruments');
                }}
                className={`py-1.5 rounded-lg font-bold transition-colors ${
                  activeTab === 'instruments' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Instruments ({config.selectedInstruments.length})
              </button>
              <button
                onClick={() => {
                  sound.playUiClick();
                  setActiveTab('launcher');
                }}
                className={`py-1.5 rounded-lg font-bold transition-colors ${
                  activeTab === 'launcher' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Launch Vehicle
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter subsystems by name or specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Sub-Category Chips (for components) */}
            {activeTab === 'components' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 font-mono text-[10px] text-slate-400">
                {['all', 'solar', 'propulsion', 'antenna', 'battery', 'computer'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setComponentCategory(cat)}
                    className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition-colors ${
                      componentCategory === cat
                        ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable Item List */}
          <div className="flex-1 overflow-y-auto max-h-[460px] space-y-2.5 pr-1">
            {activeTab === 'components' &&
              filteredComponents.map((comp) => {
                const isSelected = Object.values(config.coreComponents).includes(comp.id);

                return (
                  <div
                    key={comp.id}
                    onClick={() => {
                      sound.playEquipSound();
                      setCoreComponent(comp.category as any, comp.id);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
                          {comp.category}
                        </span>
                        <h5 className="font-bold text-xs text-white">{comp.name}</h5>
                      </div>
                      <span className="font-mono text-xs text-slate-300 font-bold">${comp.cost}M</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug mb-2">{comp.description}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-slate-800/80 text-slate-400">
                      <span>Mass: {comp.mass} kg</span>
                      <span>Power: {comp.powerConsumption > 0 ? `-${comp.powerConsumption} W` : `+${Math.abs(comp.powerConsumption)} W`}</span>
                      {isSelected ? (
                        <span className="text-cyan-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> EQUIPPED
                        </span>
                      ) : (
                        <span className="text-slate-600">Click to Equip</span>
                      )}
                    </div>
                  </div>
                );
              })}

            {activeTab === 'instruments' &&
              filteredInstruments.map((inst) => {
                const isEquipped = config.selectedInstruments.includes(inst.id);

                return (
                  <div
                    key={inst.id}
                    onClick={() => {
                      sound.playEquipSound();
                      toggleInstrument(inst.id);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isEquipped
                        ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block font-bold">
                          SCIENCE SENSOR (+{inst.scienceValue} PTS)
                        </span>
                        <h5 className="font-bold text-xs text-white">{inst.name}</h5>
                      </div>
                      <span className="font-mono text-xs text-slate-300 font-bold">${inst.cost}M</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug mb-2">{inst.description}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-slate-800/80 text-slate-400">
                      <span>Mass: {inst.mass} kg</span>
                      <span>Data: {inst.dataGenerationRateMbps} Mbps</span>
                      <span>Duty: {Math.round(inst.dutyCycle * 100)}%</span>
                      <span className={isEquipped ? 'text-purple-400 font-bold' : 'text-slate-600'}>
                        {isEquipped ? 'ACTIVE' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                );
              })}

            {activeTab === 'launcher' &&
              (launchersList as LaunchVehicle[]).map((launcher) => {
                const isSelected = config.launchVehicleId === launcher.id;

                return (
                  <div
                    key={launcher.id}
                    onClick={() => {
                      sound.playEquipSound();
                      setLauncher(launcher.id);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                          {launcher.manufacturer}
                        </span>
                        <h5 className="font-bold text-sm text-white">{launcher.name}</h5>
                      </div>
                      <span className="font-mono text-xs text-cyan-400 font-bold">${launcher.cost}M</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug mb-2">{launcher.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1.5 border-t border-slate-800/80 text-slate-300">
                      <span>Payload Cap: {launcher.marsCapacityKg} kg</span>
                      <span>Reliability: {Math.round(launcher.reliability * 100)}%</span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Propellant Mass Slider */}
          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between font-mono text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-orange-400" /> Propellant Mass (Fuel Load):
              </span>
              <strong className="text-orange-400 font-bold">{config.fuelLoadKg} kg</strong>
            </div>
            <input
              type="range"
              min="100"
              max="1800"
              step="50"
              value={config.fuelLoadKg}
              onChange={(e) => setFuelLoad(parseInt(e.target.value))}
              className="w-full accent-orange-400 cursor-pointer"
            />
          </div>
        </div>

        {/* CENTER COLUMN: SVG Architecture Diagram (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <SpacecraftSvgDiagram config={config} calculation={calculation} />

          {/* Active Launch Vehicle Mini-Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Selected Booster</span>
                <span className="text-sm font-bold text-white">
                  {launchersList.find((l) => l.id === config.launchVehicleId)?.name}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('launcher')}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-400 transition-colors"
            >
              Change Rocket
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Telemetry Dashboard (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <TelemetryDashboard calculation={calculation} config={config} />
        </div>
      </div>

      {/* BOTTOM PANEL: Rule-Based Autonomous Mission Advisor */}
      <div className="max-w-[1600px] mx-auto w-full mt-4">
        <AdvisorPanel config={config} calculation={calculation} />
      </div>

      {/* AI Mission Architect Modal */}
      <AiArchitectModal
        isOpen={showAiArchitectModal}
        onClose={() => setShowAiArchitectModal(false)}
      />

      {/* Launch Blocked Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.3)] space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-black tracking-wide">LAUNCH AUTHORIZATION ABORTED</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Critical engineering violations prevent safe liftoff and orbital insertion. Resolve the following bottlenecks before flight clearance:
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {calculation.checks
                .filter((c) => c.level === 'error')
                .map((chk, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs">
                    <span className="font-bold text-rose-300 block">{chk.title}</span>
                    <span className="text-slate-300 text-[11px] block mt-0.5">{chk.message}</span>
                  </div>
                ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Acknowledge & Adjust Architecture
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
