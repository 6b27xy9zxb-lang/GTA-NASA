import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import scenariosList from '../data/scenarios.json';
import chassisList from '../data/chassis.json';
import componentsList from '../data/components.json';
import instrumentsList from '../data/instruments.json';
import launchersList from '../data/launchers.json';
import { computeMission } from '../engine/computeMission';
import { simulate } from '../engine/simulate';
import { scoreMission } from '../engine/scoreMission';
import {
  SpacecraftConfig,
  MissionCalculation,
  SimulationResult,
  MissionScore,
  MissionEvent,
  Scenario,
  ChatMessage,
  PlayerRole,
  RoomPlayer,
} from '../types/game';

export type GameScreen =
  | 'landing'
  | 'scenario'
  | 'hangar'
  | 'builder'
  | 'launch'
  | 'flight'
  | 'report'
  | 'multiplayer'
  | 'tutorial'
  | 'sandbox';

export interface GameState {
  currentScreen: GameScreen;
  isSandboxMode: boolean;
  isAudioMuted: boolean;
  lowGraphicsMode: boolean;

  // Spacecraft configuration
  config: SpacecraftConfig;
  calculation: MissionCalculation;

  // Simulation execution state
  seed: number;
  simulationResult: SimulationResult | null;
  missionScore: MissionScore | null;

  // Live flight telemetry
  isFlightPaused: boolean;
  flightSpeed: number; // 1, 2, 5
  flightStepIndex: number;
  activeEvent: MissionEvent | null;
  isExploding: boolean;
  flightLogs: ChatMessage[];

  // Multiplayer state
  roomCode: string | null;
  userRole: PlayerRole;
  players: RoomPlayer[];
  pendingBudgetVote: { amount: number; requester: string; yesVotes: string[] } | null;

  // Tutorial state
  tutorialStep: number;

  // Actions
  setScreen: (screen: GameScreen) => void;
  setSandboxMode: (isSandbox: boolean) => void;
  toggleAudio: () => void;
  toggleLowGraphics: () => void;

  selectScenario: (scenarioId: string) => void;
  selectChassis: (chassisId: SpacecraftConfig['chassisId']) => void;
  toggleModule: (moduleId: string) => boolean; // returns true if added, false if removed or full
  setCoreComponent: (category: keyof SpacecraftConfig['coreComponents'], componentId: string) => void;
  toggleInstrument: (instrumentId: string) => void;
  setFuelLoad: (amountKg: number) => void;
  setLauncher: (launcherId: string) => void;
  resetToDefaultConfig: () => void;

  startMission: () => void;
  setFlightPaused: (paused: boolean) => void;
  setFlightSpeed: (speed: number) => void;
  advanceFlightStep: () => void;
  handleEventChoice: (eventId: string, optionId: string) => void;
  triggerEmergencyAction: (actionType: 'reroute_power' | 'evasive' | 'adjust_comms' | 'reduce_instruments' | 'emergency_protocol') => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  // Multiplayer actions
  createRoom: () => string;
  joinRoom: (code: string) => boolean;
  setRole: (role: PlayerRole) => void;
  requestBudget: (amount: number) => void;
  voteBudget: (voteYes: boolean) => void;

  // Tutorial actions
  nextTutorialStep: () => void;
  prevTutorialStep: () => void;
  skipTutorial: () => void;
}

// Balanced, launchable Earth-observation starter configuration. The previous
// preset combined a premium chassis, oversized payload and expensive launcher,
// making the Beginner mission exceed its own budget before the player began.
const defaultConfig: SpacecraftConfig = {
  scenarioId: 'scenario-earth',
  chassisId: 'aero-dart',
  installedModules: [],
  coreComponents: {
    bus: 'bus-small',
    solar: 'solar-medium',
    battery: 'battery-standard',
    antenna: 'antenna-ka-band',
    computer: 'computer-basic',
    acs: 'acs-reaction-wheels',
    shielding: 'shielding-standard',
    fuelTank: 'fuel-tank-std',
    propulsion: 'propulsion-chemical',
  },
  selectedInstruments: ['inst-wide-camera'],
  fuelLoadKg: 200,
  launchVehicleId: 'launcher-pegasus',
};

export const useGameStore = create<GameState>()((set, get) => ({
  currentScreen: 'landing',
  isSandboxMode: false,
  isAudioMuted: false,
  lowGraphicsMode: false,

  config: defaultConfig,
  calculation: computeMission(defaultConfig),

  seed: Math.floor(Math.random() * 1000000),
  simulationResult: null,
  missionScore: null,

  isFlightPaused: false,
  flightSpeed: 1,
  flightStepIndex: 0,
  activeEvent: null,
  isExploding: false,
  flightLogs: [
    {
      id: 'log-0',
      senderName: 'FLIGHT OPERATIONS',
      role: 'FLIGHT_DIRECTOR',
      text: 'Telemetry carrier locked with deep space network. All primary bus channels green.',
      timestamp: '00:00:01',
    },
  ],

  roomCode: null,
  userRole: 'director',
  players: [
    { id: 'p1', name: 'Commander (You)', role: 'director', isReady: true },
    { id: 'p2', name: 'Dr. Vance', role: 'science', isReady: true },
    { id: 'p3', name: 'Chief Chen', role: 'engineer', isReady: true },
    { id: 'p4', name: 'Quartermaster Ortiz', role: 'resource', isReady: true },
  ],
  pendingBudgetVote: null,

  tutorialStep: 0,

  setScreen: (screen) => set({ currentScreen: screen }),
  setSandboxMode: (isSandbox) => {
    set({ isSandboxMode: isSandbox });
    const current = get().config;
    set({ calculation: computeMission(current) });
  },
  toggleAudio: () => set((state) => ({ isAudioMuted: !state.isAudioMuted })),
  toggleLowGraphics: () => set((state) => ({ lowGraphicsMode: !state.lowGraphicsMode })),

  selectScenario: (scenarioId) => {
    const scenarioPresets: Record<string, Partial<SpacecraftConfig>> = {
      // Beginner: compact LEO bus, low-data camera, affordable launcher.
      'scenario-earth': {
        chassisId: 'aero-dart', installedModules: [],
        coreComponents: { bus: 'bus-small', solar: 'solar-medium', battery: 'battery-standard', antenna: 'antenna-ka-band', computer: 'computer-basic', acs: 'acs-reaction-wheels', shielding: 'shielding-standard', fuelTank: 'fuel-tank-std', propulsion: 'propulsion-chemical' },
        selectedInstruments: ['inst-wide-camera'], fuelLoadKg: 200, launchVehicleId: 'launcher-pegasus',
      },
      // Lunar: ion transfer stage with high-gain communications and radar science.
      'scenario-moon': {
        chassisId: 'aero-dart', installedModules: [],
        coreComponents: { bus: 'bus-small', solar: 'solar-medium', battery: 'battery-advanced', antenna: 'antenna-ka-band', computer: 'computer-basic', acs: 'acs-reaction-wheels', shielding: 'shielding-standard', fuelTank: 'fuel-tank-std', propulsion: 'propulsion-ion' },
        selectedInstruments: ['inst-radar', 'inst-magnetometer'], fuelLoadKg: 200, launchVehicleId: 'launcher-atlas',
      },
      // Mars: larger power array, high-gain link, ion propulsion and compact science suite.
      'scenario-mars': {
        chassisId: 'nova-core', installedModules: [],
        coreComponents: { bus: 'bus-medium', solar: 'solar-large', battery: 'battery-advanced', antenna: 'antenna-ka-band', computer: 'computer-basic', acs: 'acs-reaction-wheels', shielding: 'shielding-standard', fuelTank: 'fuel-tank-std', propulsion: 'propulsion-ion' },
        selectedInstruments: ['inst-spectrometer', 'inst-magnetometer', 'inst-thermal-imager'], fuelLoadKg: 200, launchVehicleId: 'launcher-falcon-heavy',
      },
      // Europa: radiation-hardened autonomous probe; RTG + solar wing and deep-space comms.
      'scenario-europa': {
        chassisId: 'nova-core', installedModules: ['rtg-power-unit', 'advanced-solar-wing'],
        coreComponents: { bus: 'bus-medium', solar: 'solar-large', battery: 'battery-advanced', antenna: 'antenna-ka-band', computer: 'computer-basic', acs: 'acs-reaction-wheels', shielding: 'shielding-standard', fuelTank: 'fuel-tank-std', propulsion: 'propulsion-ion' },
        selectedInstruments: ['inst-radar', 'inst-magnetometer'], fuelLoadKg: 200, launchVehicleId: 'launcher-sls',
      },
    };
    const sc = (scenariosList as Scenario[]).find((s) => s.id === scenarioId);
    set((state) => {
      const preset = scenarioPresets[scenarioId];
      const newConfig: SpacecraftConfig = {
        ...state.config,
        ...preset,
        scenarioId,
        coreComponents: preset?.coreComponents ?? state.config.coreComponents,
        installedModules: preset?.installedModules ?? state.config.installedModules,
        selectedInstruments: preset?.selectedInstruments ?? (sc ? sc.recommendedInstruments.slice(0, 1) : state.config.selectedInstruments),
      };
      return { config: newConfig, calculation: computeMission(newConfig), simulationResult: null, missionScore: null };
    });
  },

  selectChassis: (chassisId) => {
    const chassis = chassisList.find((c) => c.id === chassisId);
    const maxSlots = chassis ? chassis.hardpointSlots : 5;

    set((state) => {
      // Trim modules if exceeding new hardpoint limit
      const trimmedModules = state.config.installedModules.slice(0, maxSlots);
      const newConfig: SpacecraftConfig = {
        ...state.config,
        chassisId,
        installedModules: trimmedModules,
      };
      return {
        config: newConfig,
        calculation: computeMission(newConfig),
      };
    });
  },

  toggleModule: (moduleId) => {
    const state = get();
    const chassis = chassisList.find((c) => c.id === state.config.chassisId);
    const maxSlots = chassis ? chassis.hardpointSlots : 5;

    const exists = state.config.installedModules.includes(moduleId);
    if (exists) {
      // Remove module
      const newModules = state.config.installedModules.filter((id) => id !== moduleId);
      const newConfig: SpacecraftConfig = { ...state.config, installedModules: newModules };
      set({ config: newConfig, calculation: computeMission(newConfig) });
      return false;
    } else {
      // Check if limit reached
      if (state.config.installedModules.length >= maxSlots) {
        return false;
      }
      const newModules = [...state.config.installedModules, moduleId];
      const newConfig: SpacecraftConfig = { ...state.config, installedModules: newModules };
      set({ config: newConfig, calculation: computeMission(newConfig) });
      return true;
    }
  },

  setCoreComponent: (category, componentId) => {
    set((state) => {
      const newConfig: SpacecraftConfig = {
        ...state.config,
        coreComponents: {
          ...state.config.coreComponents,
          [category]: componentId,
        },
      };
      return {
        config: newConfig,
        calculation: computeMission(newConfig),
      };
    });
  },

  toggleInstrument: (instrumentId) => {
    set((state) => {
      const exists = state.config.selectedInstruments.includes(instrumentId);
      const newInstruments = exists
        ? state.config.selectedInstruments.filter((id) => id !== instrumentId)
        : [...state.config.selectedInstruments, instrumentId];

      const newConfig: SpacecraftConfig = {
        ...state.config,
        selectedInstruments: newInstruments,
      };
      return {
        config: newConfig,
        calculation: computeMission(newConfig),
      };
    });
  },

  setFuelLoad: (amountKg) => {
    set((state) => {
      const newConfig: SpacecraftConfig = {
        ...state.config,
        fuelLoadKg: Math.max(0, amountKg),
      };
      return {
        config: newConfig,
        calculation: computeMission(newConfig),
      };
    });
  },

  setLauncher: (launcherId) => {
    set((state) => {
      const newConfig: SpacecraftConfig = {
        ...state.config,
        launchVehicleId: launcherId,
      };
      return {
        config: newConfig,
        calculation: computeMission(newConfig),
      };
    });
  },

  resetToDefaultConfig: () => {
    set({
      config: defaultConfig,
      calculation: computeMission(defaultConfig),
    });
  },

  startMission: () => {
    const seed = Math.floor(Math.random() * 1000000);
    const config = get().config;
    const simResult = simulate(config, seed);
    const score = scoreMission(simResult);

    set({
      seed,
      simulationResult: simResult,
      missionScore: score,
      flightStepIndex: 0,
      isFlightPaused: false,
      flightSpeed: 1,
      activeEvent: null,
      isExploding: false,
      flightLogs: [
        {
          id: 'log-start',
          senderName: 'FLIGHT OPERATIONS',
          role: 'FLIGHT_DIRECTOR',
          text: `Mission initialized. Seed: #${seed}. Ignition sequence armed.`,
          timestamp: '00:00:00',
        },
      ],
      currentScreen: 'launch',
    });
  },

  setFlightPaused: (paused) => set({ isFlightPaused: paused }),
  setFlightSpeed: (speed) => set({ flightSpeed: speed }),

  advanceFlightStep: () => {
    const state = get();
    if (!state.simulationResult || state.isFlightPaused) return;

    const timeline = state.simulationResult.timeline;
    const nextIdx = state.flightStepIndex + 1;

    if (nextIdx >= timeline.length) {
      // Mission completed!
      set({ currentScreen: 'report' });
      return;
    }

    const currentPoint = timeline[nextIdx];

    // Check if an event happens at this point
    const matchingEventRecord = state.simulationResult.eventsEncountered.find(
      (enc) => Math.abs(enc.event.triggerProgressPercent - currentPoint.progressPercent) <= 2
    );

    let newEvent: MissionEvent | null = null;
    if (matchingEventRecord && !state.activeEvent && currentPoint.progressPercent < 95) {
      // Pause for interactive choice
      newEvent = matchingEventRecord.event;
    }

    // Add radio telemetry logs periodically
    const logs = [...state.flightLogs];
    if (nextIdx % 8 === 0) {
      const speakers: PlayerRole[] = ['science', 'engineer', 'resource'];
      const speaker = speakers[nextIdx % speakers.length];
      const speakerName =
        speaker === 'science' ? 'Science Officer' : speaker === 'engineer' ? 'Lead Systems' : 'Propulsion Lead';

      let msg = `T+${currentPoint.timeDays}d: Subsystems nominal. Hull ${currentPoint.hullHealth}%, Power reserve ${currentPoint.powerReservePercent}%.`;
      if (currentPoint.phase === 'Science Observations') {
        msg = `High-value science packet captured: ${currentPoint.scienceCollected} GB downlinked to DSN.`;
      }
      logs.push({
        id: `log-${nextIdx}`,
        senderName: speakerName,
        role: speaker,
        text: msg,
        timestamp: `Day ${currentPoint.timeDays}`,
      });
    }

    set({
      flightStepIndex: nextIdx,
      activeEvent: newEvent,
      isFlightPaused: newEvent !== null,
      flightLogs: logs,
    });
  },

  handleEventChoice: (eventId, optionId) => {
    const state = get();
    if (!state.simulationResult) return;

    // Resimulate remaining steps with chosen option
    const newSimResult = simulate(state.config, state.seed, {
      interactiveChoices: { [eventId]: optionId },
    });
    const newScore = scoreMission(newSimResult);

    const eventRecord = newSimResult.eventsEncountered.find((e) => e.event.id === eventId);
    const logs = [...state.flightLogs];

    if (eventRecord) {
      logs.push({
        id: `log-event-${Date.now()}`,
        senderName: 'MISSION COMMAND',
        role: 'SYSTEM',
        text: `DECISION: Executed "${eventRecord.chosenOption.label}". Result: ${eventRecord.consequenceText}`,
        timestamp: `Day ${eventRecord.atDay}`,
        isUrgent: !eventRecord.wasSuccessful,
      });

      // Signature distress explosion sequence
      if (!eventRecord.wasSuccessful && eventRecord.chosenOption.isFatalOnFailure) {
        set({
          isExploding: true,
          activeEvent: null,
          simulationResult: newSimResult,
          missionScore: newScore,
          flightLogs: logs,
        });

        // Flash HUD and transition to report after explosion
        setTimeout(() => {
          set({ currentScreen: 'report' });
        }, 2800);
        return;
      }
    }

    set({
      simulationResult: newSimResult,
      missionScore: newScore,
      activeEvent: null,
      isFlightPaused: false,
      flightLogs: logs,
    });
  },

  triggerEmergencyAction: (actionType) => {
    const state = get();
    const logs = [...state.flightLogs];

    let message = '';
    switch (actionType) {
      case 'reroute_power':
        message = 'ACTION: Power rerouted from auxiliary science sensors to attitude reaction wheels. +15% attitude stability.';
        break;
      case 'evasive':
        message = 'ACTION: RCS micro-thruster burst fired. Spacecraft shifted 400m relative to trajectory debris cloud. -15 kg propellant.';
        break;
      case 'adjust_comms':
        message = 'ACTION: Ka-band antenna gimbals realigned to Goldstone DSN tracking station. Carrier SNR improved by +6 dB.';
        break;
      case 'reduce_instruments':
        message = 'ACTION: Instruments put into low-power hibernation. Power draw decreased by 45 W.';
        break;
      case 'emergency_protocol':
        message = 'ACTION: Emergency fail-safe protocol engaged. Computer reset to golden boot image. Telemetry stabilized.';
        break;
    }

    logs.push({
      id: `emergency-${Date.now()}`,
      senderName: 'FLIGHT CONSOLE',
      role: 'SYSTEM',
      text: message,
      timestamp: 'NOW',
      isUrgent: true,
    });

    set({ flightLogs: logs });
  },

  addChatMessage: (msg) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `chat-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    set((state) => ({ flightLogs: [...state.flightLogs, newMsg] }));
  },

  createRoom: () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    set({
      roomCode: code,
      userRole: 'director',
    });
    return code;
  },

  joinRoom: (code) => {
    if (code.length >= 4) {
      set({
        roomCode: code.toUpperCase(),
        userRole: 'engineer',
      });
      return true;
    }
    return false;
  },

  setRole: (role) => set({ userRole: role }),

  requestBudget: (amount) => {
    set({
      pendingBudgetVote: {
        amount,
        requester: 'Chief Engineer',
        yesVotes: ['p3'],
      },
    });
  },

  voteBudget: (voteYes) => {
    const state = get();
    if (!state.pendingBudgetVote) return;
    if (voteYes) {
      const votes = [...state.pendingBudgetVote.yesVotes, 'p1'];
      if (votes.length >= 3) {
        // Vote passed!
        state.addChatMessage({
          senderName: 'MISSION DIRECTORATE',
          role: 'SYSTEM',
          text: `VOTE PASSED: Additional $${state.pendingBudgetVote.amount}M allocated to flight systems.`,
          isUrgent: false,
        });
        set({ pendingBudgetVote: null });
      } else {
        set({
          pendingBudgetVote: {
            ...state.pendingBudgetVote,
            yesVotes: votes,
          },
        });
      }
    } else {
      state.addChatMessage({
        senderName: 'MISSION DIRECTORATE',
        role: 'SYSTEM',
        text: `VOTE REJECTED: Budget expansion declined.`,
      });
      set({ pendingBudgetVote: null });
    }
  },

  nextTutorialStep: () => set((state) => ({ tutorialStep: Math.min(4, state.tutorialStep + 1) })),
  prevTutorialStep: () => set((state) => ({ tutorialStep: Math.max(0, state.tutorialStep - 1) })),
  skipTutorial: () => set({ tutorialStep: 0, currentScreen: 'hangar' }),
}));
