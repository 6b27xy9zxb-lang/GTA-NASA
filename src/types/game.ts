export type ChassisId = 'titan-x' | 'aero-dart' | 'nova-core' | 'goliath';

export interface Chassis {
  id: ChassisId;
  name: string;
  tagline: string;
  description: string;
  hullStrength: number; // base HP (e.g. 100 - 250)
  speedRating: number; // 1-10
  dryMass: number; // kg
  maxFuelCapacity: number; // kg
  baseCommRangeAu: number; // AU
  hardpointSlots: number; // Titan-X: 5, Aero-Dart: 3, Nova-Core: 5, Goliath: 5
  specialAbility: string;
  disadvantage: string;
  cost: number; // Millions USD
  visualStyle: {
    accentColor: string;
    modelType: 'heavy' | 'interceptor' | 'cruiser' | 'dreadnought';
    scale: [number, number, number];
  };
}

export interface UpgradeModule {
  id: string;
  name: string;
  description: string;
  category: 'defense' | 'science' | 'propulsion' | 'avionics' | 'power' | 'comms';
  mass: number; // kg
  powerConsumption: number; // W (positive = consumes, negative = generates like RTG or solar)
  cost: number; // Millions USD
  hardpointCost: number; // usually 1
  canStack: boolean;
  effects: {
    hullBonus?: number;
    shieldBonus?: number;
    fuelCapacityBonus?: number;
    commRangeBonusAu?: number;
    downlinkMultiplier?: number;
    radiationResistanceBonus?: number; // 0 to 1
    ispBonus?: number; // seconds
    scienceMultiplier?: number;
    powerGenerationBonus?: number; // W
    redundancyRating?: number; // 0 to 1
  };
  resourceImpactsSummary: string[];
}

export type ComponentCategory =
  | 'bus'
  | 'solar'
  | 'power_source'
  | 'battery'
  | 'antenna'
  | 'computer'
  | 'acs'
  | 'radiation_shield'
  | 'fuel_tank'
  | 'propulsion';

export interface CoreComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  mass: number; // kg
  powerConsumption: number; // W (negative for power generators)
  cost: number; // Millions USD
  description: string;
  specs: {
    powerCapacityWh?: number; // for batteries
    powerGenerationW?: number; // at 1 AU for solar / constant for RTG
    downlinkRateMbps?: number; // for antennas
    commRangeAu?: number;
    ispSeconds?: number; // specific impulse for propulsion
    thrustKn?: number;
    radiationAbsorptionPercent?: number;
    reliabilityRating?: number; // 0-1
    capacityKg?: number; // for fuel tank or bus payload
  };
  compatibilityNotes?: string;
}

export interface ScientificInstrument {
  id: string;
  name: string;
  mass: number; // kg
  powerConsumption: number; // W
  cost: number; // Millions USD
  dataGenerationRateMbps: number; // Mbps continuous or active
  scienceValue: number; // base points (e.g. 50-250)
  dutyCycle: number; // percentage of mission time active (0.1 - 1.0)
  targetSuitability: ('atmosphere' | 'surface' | 'magnetic' | 'geological' | 'deep_space' | 'biosignature')[];
  description: string;
  compatibilityRequirements?: string;
}

export interface LaunchVehicle {
  id: string;
  name: string;
  manufacturer: string;
  cost: number; // Millions USD
  leoCapacityKg: number;
  lunarCapacityKg: number;
  marsCapacityKg: number;
  deepSpaceCapacityKg: number;
  reliability: number; // 0.90 - 0.99
  maxFairingDiameterMeters: number;
  description: string;
}

export interface DestinationOrbit {
  id: string;
  name: string;
  distanceFromSunAu: number;
  deltaVRequiredKmS: number;
  solarFluxMultiplier: number; // 1 / distance^2
  ambientRadiationLevel: 'low' | 'moderate' | 'high' | 'extreme'; // Rad/day index
  commDistanceAu: number;
  lightDelayMinutes: number;
}

export interface Scenario {
  id: string;
  title: string;
  destination: string;
  destinationOrbitId: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  budgetLimitMillion: number;
  massLimitKg: number;
  missionDurationYears: number;
  minScienceGoal: number;
  description: string;
  objectives: string[];
  scientificGoals: string[];
  environmentalChallenges: string[];
  educationalNotes: string;
  recommendedInstruments: string[];
}

export interface SpacecraftConfig {
  scenarioId: string;
  chassisId: ChassisId;
  installedModules: string[]; // module ids
  coreComponents: {
    bus: string;
    solar?: string;
    powerSource?: string;
    battery: string;
    antenna: string;
    computer: string;
    acs: string;
    shielding: string;
    fuelTank: string;
    propulsion: string;
  };
  selectedInstruments: string[];
  fuelLoadKg: number;
  launchVehicleId: string;
}

export interface EngineeringCheck {
  id: string;
  level: 'ok' | 'warning' | 'error';
  category: 'mass' | 'power' | 'comm' | 'fuel' | 'budget' | 'radiation' | 'lifetime';
  title: string;
  message: string;
  remedy?: string;
}

export interface MissionCalculation {
  dryMassKg: number;
  fuelMassKg: number;
  totalMassKg: number;
  launcherCapacityKg: number;
  isMassCompatible: boolean;

  availablePowerW: number; // scaled by solar flux at destination + RTG
  requiredPowerW: number;
  netPowerMarginW: number;
  batteryReserveHours: number;
  isPowerCompatible: boolean;

  totalDataGeneratedGbDay: number;
  downlinkCapacityGbDay: number;
  dataDownlinkEfficiencyPercent: number; // clamp 0-100%
  lostDataPercent: number;
  commDelayMinutes: number;

  deltaVAvailableKmS: number;
  deltaVRequiredKmS: number;
  isDeltaVCompatible: boolean;

  radiationDoseRadPerYear: number;
  shieldingFactor: number; // 0 to 1
  effectiveRadiationDoseRadPerYear: number;
  radiationSurvivalRisk: 'safe' | 'caution' | 'critical';

  totalBudgetMillion: number;
  budgetLimitMillion: number;
  isBudgetCompatible: boolean;

  estimatedLifetimeYears: number;
  targetDurationYears: number;
  isLifetimeCompatible: boolean;

  baseSciencePotential: number;
  expectedUsableScience: number;

  checks: EngineeringCheck[];
  isValidForLaunch: boolean;
  successProbabilityPercent: number;
}

export interface MissionEventOption {
  id: string;
  label: string;
  riskDescription: string;
  riskProbabilityPercent: number; // chance of bad outcome
  successReward: string;
  failurePenalty: string;
  engineeringExplanation: string;
  hullImpact: number; // direct HP change
  fuelImpactKg: number;
  powerImpactW: number;
  scienceBonus: number;
  isFatalOnFailure?: boolean;
}

export interface MissionEvent {
  id: string;
  title: string;
  description: string;
  triggerPhase: 'launch' | 'cruise' | 'orbital_insertion' | 'science_ops' | 'deep_space';
  triggerProgressPercent: number; // 0 - 100
  severity: 'minor' | 'moderate' | 'critical' | 'high_stakes';
  affectedSystem?: string;
  options: MissionEventOption[];
  isHighStakesDistress?: boolean;
}

export interface TimelineDataPoint {
  timeDays: number;
  progressPercent: number;
  hullHealth: number; // 0-100%
  fuelKg: number;
  powerReservePercent: number;
  scienceCollected: number;
  commQualityPercent: number;
  phase: string;
}

export interface SimulationResult {
  seed: number;
  scenarioId: string;
  config: SpacecraftConfig;
  calculation: MissionCalculation;
  timeline: TimelineDataPoint[];
  eventsEncountered: {
    event: MissionEvent;
    chosenOption: MissionEventOption;
    wasSuccessful: boolean;
    atDay: number;
    consequenceText: string;
  }[];
  finalState: 'success' | 'partial_success' | 'failure';
  failureReason?: string;
  finalHullPercent: number;
  finalFuelKg: number;
  totalScienceCollected: number;
  totalScienceDownlinked: number;
  missionDurationDays: number;
}

export interface MissionScore {
  overallScore: number; // 0 - 1000
  scienceScore: number;
  engineeringEfficiency: number;
  budgetEfficiency: number;
  resourceScore: number;
  survivalScore: number;
  teamworkScore?: number;
  mistakes: string[];
  causeAndEffectExplanations: string[];
  recommendations: string[];
  earnedAchievements: string[];
  aiNarrative?: string;
}

export type PlayerRole = 'director' | 'engineer' | 'science' | 'resource';

export interface RoomPlayer {
  id: string;
  name: string;
  role: PlayerRole;
  isReady: boolean;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  role: PlayerRole | 'SYSTEM' | 'FLIGHT_DIRECTOR' | 'AI_ADVISOR';
  text: string;
  timestamp: string;
  isUrgent?: boolean;
}
